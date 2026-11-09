#!/usr/bin/env python3
"""Create native Codex tasks over a local Unix socket. Dependency: websockets==15.0.1."""

import argparse
import hashlib
import ipaddress
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import time
from urllib.parse import urlparse


class NativeClient:
    def __init__(self, path, timeout=20):
        self.path = str(path)
        self.timeout = timeout
        self.sequence = 0

    def __enter__(self):
        from websockets.sync.client import unix_connect

        self.connection = unix_connect(self.path, open_timeout=self.timeout, close_timeout=1)
        try:
            self.request("initialize", {
                "clientInfo": {"name": "nimbou_codex_native_task", "version": "1.0"},
                "capabilities": {"experimentalApi": True},
            })
            self.connection.send(json.dumps({"method": "initialized", "params": {}}))
        except BaseException:
            self.connection.close()
            raise
        return self

    def __exit__(self, *_args):
        self.connection.close()

    def request(self, method, params):
        self.sequence += 1
        request_id = self.sequence
        self.connection.send(json.dumps({"id": request_id, "method": method, "params": params}))
        deadline = time.monotonic() + self.timeout
        while True:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise TimeoutError(f"Timeout waiting for {method}")
            message = json.loads(self.connection.recv(timeout=remaining))
            if "method" in message:
                if "id" in message:
                    # A maintenance client must never approve commands or permissions.
                    self.connection.send(json.dumps({"id": message["id"], "error": {
                        "code": -32601, "message": "Unsupported maintenance-client request",
                    }}))
                continue
            if message.get("id") != request_id:
                continue
            if "error" in message:
                raise RuntimeError(f"{method} failed (RPC code {message['error'].get('code')})")
            return message["result"]


def resolve_socket(explicit=None):
    if explicit is None:
        result = subprocess.run(["codex", "app-server", "daemon", "version"],
                                check=True, capture_output=True, text=True, timeout=10)
        explicit = json.loads(result.stdout).get("socketPath")
    if not explicit or not Path(explicit).is_absolute():
        raise ValueError("No authoritative absolute control-socket path; inspect local Codex help")
    path = Path(explicit)
    if not path.is_socket() or path.stat().st_uid != os.getuid():
        raise ValueError("Control socket must exist and belong to the current OS user")
    return path


def bridge_listener(origin):
    parsed = urlparse(origin or "")
    host = parsed.hostname
    if host == "localhost":
        host = "127.0.0.1"
    try:
        if not ipaddress.ip_address(host).is_loopback:
            return None
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        with socket.create_connection((host, port), timeout=2):
            return True
    except (ValueError, TypeError):
        return None
    except OSError:
        return False


def inspect_connection(client, thread_id=None):
    result = {"daemonReachable": True}
    if thread_id:
        thread = client.request("thread/read", {"threadId": thread_id, "includeTurns": False})["thread"]
        result["thread"] = {key: thread.get(key) for key in ["id", "cwd", "status"]}
        try:
            status = client.request("mcpServerStatus/list", {
                "threadId": thread_id, "serverName": "codex_tui", "detail": "toolsAndAuthOnly",
            })
            result["bridges"] = [{"name": server["name"],
                                   "cachedStatus": server.get("runtimeStatus"),
                                   "httpOrigin": server.get("httpOrigin"),
                                   "listening": bridge_listener(server.get("httpOrigin"))}
                                  for server in status.get("data", [])]
        except (RuntimeError, TimeoutError):
            result["bridgeStatusUnavailable"] = True
    return result


def write_receipt(path, record):
    temporary = path.with_name(path.name + f".tmp-{os.getpid()}")
    try:
        with temporary.open("x", encoding="utf-8") as stream:
            os.chmod(temporary, 0o600)
            json.dump(record, stream, ensure_ascii=False, indent=2)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def verify_thread(client, record):
    thread = client.request("thread/read", {"threadId": record["threadId"], "includeTurns": False})["thread"]
    if thread["id"] != record["threadId"] or Path(thread["cwd"]).resolve() != Path(record["cwd"]):
        raise ValueError("Native task identity or cwd differs from the receipt; reconcile before continuing")
    return thread.get("status")


def create_task(client, *, cwd, model, effort, name, prompt, receipt_path, authorized):
    if not authorized:
        raise ValueError("Task creation requires existing user authorization (--authorized)")
    cwd = Path(cwd).resolve(strict=True)
    if not cwd.is_dir() or not all(value.strip() for value in [model, effort, name, prompt]):
        raise ValueError("An existing checkout and nonempty model, effort, name and prompt are required")
    receipt_path = Path(receipt_path).resolve()
    fingerprint = hashlib.sha256(json.dumps({"cwd": str(cwd), "model": model, "effort": effort,
                                             "name": name, "prompt": prompt}, sort_keys=True).encode()).hexdigest()
    receipt_path.parent.mkdir(parents=True, exist_ok=True)
    lock = Path(str(receipt_path) + ".lock")
    try:
        lock.mkdir()
    except FileExistsError as error:
        raise ValueError("Receipt lock exists; inspect the running operation before removing it") from error
    try:
        if receipt_path.exists():
            record = json.loads(receipt_path.read_text(encoding="utf-8"))
            if record.get("requestFingerprint") != fingerprint:
                raise ValueError("Receipt belongs to a different request; do not repurpose it")
            if not record.get("threadId"):
                raise ValueError("Creation outcome uncertain; reconcile native tasks before retrying")
            return {**record, "reused": True, "threadStatus": verify_thread(client, record),
                    "needsReconciliation": record["phase"] != "started"}

        record = {"version": 1, "phase": "creating", "requestFingerprint": fingerprint,
                  "cwd": str(cwd), "requestedModel": model, "requestedEffort": effort, "name": name}
        # Persist intent BEFORE mutation: a lost reply must not cause another creation.
        write_receipt(receipt_path, record)
        created = client.request("thread/start", {"cwd": str(cwd), "model": model,
                                                   "config": {"model_reasoning_effort": effort},
                                                   "ephemeral": False})
        record.update(phase="created", threadId=created["thread"]["id"],
                      model=created["model"], reasoningEffort=created.get("reasoningEffort"))
        write_receipt(receipt_path, record)
        if (created["model"] != model or created.get("reasoningEffort") != effort
                or Path(created["cwd"]).resolve() != cwd):
            raise ValueError("Effective configuration differs from request; created task kept, turn not started")
        client.request("thread/name/set", {"threadId": record["threadId"], "name": name})
        record["phase"] = "starting"
        write_receipt(receipt_path, record)
        started = client.request("turn/start", {"threadId": record["threadId"], "cwd": str(cwd),
                                                "model": model, "effort": effort,
                                                "input": [{"type": "text", "text": prompt}]})
        record.update(phase="started", turnId=started["turn"]["id"], turnStatus=started["turn"]["status"])
        write_receipt(receipt_path, record)
        return {**record, "threadStatus": verify_thread(client, record), "reused": False}
    finally:
        lock.rmdir()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--socket", help="Authoritative local Unix control socket; otherwise use daemon version")
    commands = parser.add_subparsers(dest="command", required=True)
    diagnostic = commands.add_parser("inspect", help="Read-only native connection and optional bridge diagnosis")
    diagnostic.add_argument("--thread", default=os.environ.get("CODEX_THREAD_ID"))
    creation = commands.add_parser("create", help="Create/start one authorized native task with a durable receipt")
    for option in ["cwd", "model", "effort", "name", "prompt-file", "receipt"]:
        creation.add_argument("--" + option, required=True)
    creation.add_argument("--authorized", action="store_true", help="Record authorization already given by the user")
    args = parser.parse_args()
    if args.command == "create" and not args.authorized:
        parser.error("--authorized must reflect an existing user request; no creation was attempted")
    try:
        with NativeClient(resolve_socket(args.socket)) as client:
            if args.command == "inspect":
                result = inspect_connection(client, args.thread)
            else:
                result = create_task(client, cwd=args.cwd, model=args.model, effort=args.effort,
                                     name=args.name, prompt=Path(args.prompt_file).read_text(encoding="utf-8"),
                                     receipt_path=args.receipt, authorized=args.authorized)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except ImportError:
        parser.exit(1, "Missing dependency: install websockets==15.0.1 in a temporary Python virtualenv.\n")
    except Exception as error:
        parser.exit(1, f"Task operation stopped: {error}. Preserve any receipt and reconcile before retrying.\n")


if __name__ == "__main__":
    main()
