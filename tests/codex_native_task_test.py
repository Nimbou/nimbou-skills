import importlib.util
import json
from pathlib import Path
import tempfile
import threading
import unittest

from websockets.sync.server import unix_serve


SCRIPT = Path(__file__).resolve().parents[1] / "plugins/nimbou-skills/skills/codex-native-task/scripts/native_task.py"
SPEC = importlib.util.spec_from_file_location("native_task", SCRIPT)
native_task = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(native_task)


class FakeClient:
    def __init__(self, cwd):
        self.cwd = str(cwd)
        self.calls = []
        self.model = "chosen-model"
        self.effort = "chosen-effort"
        self.fail_at = None

    def request(self, method, params):
        self.calls.append((method, params))
        if method == self.fail_at:
            raise TimeoutError("Response lost after submission")
        if method == "thread/start":
            return {"thread": {"id": "thread-1"}, "cwd": self.cwd,
                    "model": self.model, "reasoningEffort": self.effort}
        if method == "turn/start":
            return {"turn": {"id": "turn-1", "status": "inProgress"}}
        if method == "thread/read":
            return {"thread": {"id": "thread-1", "cwd": self.cwd,
                               "status": {"type": "active"}}}
        if method == "thread/name/set":
            return {}
        raise AssertionError(f"Unexpected mutation or read: {method}")


class NativeCreationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.cwd = Path(self.temp.name)
        self.client = FakeClient(self.cwd)
        self.options = dict(cwd=self.cwd, model="chosen-model", effort="chosen-effort",
                            name="Authorized task", prompt="Read the approved plan.",
                            receipt_path=self.cwd / "receipt.json", authorized=True)

    def run_creation(self, **overrides):
        return native_task.create_task(self.client, **(self.options | overrides))

    def test_preserves_cwd_model_effort_and_native_task_identity(self):
        result = self.run_creation()
        self.assertEqual(result["threadId"], "thread-1")
        self.assertEqual(result["turnId"], "turn-1")
        self.assertEqual(result["phase"], "started")
        self.assertEqual(result["model"], "chosen-model")
        start = dict(self.client.calls)["thread/start"]
        turn = dict(self.client.calls)["turn/start"]
        self.assertEqual(start["cwd"], str(self.cwd))
        self.assertEqual(start["config"]["model_reasoning_effort"], "chosen-effort")
        self.assertEqual(turn["effort"], "chosen-effort")
        self.assertEqual(turn["input"][0]["text"], self.options["prompt"])
        self.assertNotIn(self.options["prompt"], self.options["receipt_path"].read_text())

    def test_second_invocation_reads_existing_task_without_new_creation_or_turn(self):
        self.run_creation()
        self.client.calls.clear()
        result = self.run_creation()
        self.assertTrue(result["reused"])
        self.assertEqual([method for method, _ in self.client.calls], ["thread/read"])

    def test_does_not_mutate_without_existing_authorization(self):
        with self.assertRaisesRegex(ValueError, "authoriz"):
            self.run_creation(authorized=False)
        self.assertEqual(self.client.calls, [])
        self.assertFalse(self.options["receipt_path"].exists())

    def test_model_mismatch_keeps_created_id_but_does_not_start_turn(self):
        self.client.model = "unexpected-model"
        with self.assertRaisesRegex(ValueError, "configuration"):
            self.run_creation()
        record = json.loads(self.options["receipt_path"].read_text())
        self.assertEqual(record["threadId"], "thread-1")
        self.assertNotIn("turn/start", dict(self.client.calls))

    def test_lost_creation_response_cannot_create_duplicate_on_retry(self):
        self.client.fail_at = "thread/start"
        with self.assertRaises(TimeoutError):
            self.run_creation()
        self.client.calls.clear()
        with self.assertRaisesRegex(ValueError, "uncertain"):
            self.run_creation()
        self.assertEqual(self.client.calls, [])

    def test_lost_start_response_never_resubmits_prompt(self):
        self.client.fail_at = "turn/start"
        with self.assertRaises(TimeoutError):
            self.run_creation()
        self.client.calls.clear()
        result = self.run_creation()
        self.assertTrue(result["needsReconciliation"])
        self.assertEqual([method for method, _ in self.client.calls], ["thread/read"])

    def test_receipt_cannot_be_repurposed_for_different_request(self):
        self.run_creation()
        self.client.calls.clear()
        with self.assertRaisesRegex(ValueError, "different request"):
            self.run_creation(prompt="A different task")
        self.assertEqual(self.client.calls, [])

    def test_receipt_lock_prevents_concurrent_mutations(self):
        Path(str(self.options["receipt_path"]) + ".lock").mkdir()
        with self.assertRaisesRegex(ValueError, "lock"):
            self.run_creation()
        self.assertEqual(self.client.calls, [])


class LocalTransportTests(unittest.TestCase):
    def test_unix_handshake_notifications_and_no_automatic_approvals(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "server.sock"
            observations = []

            def handle(socket):
                initialize = json.loads(socket.recv())
                observations.append(initialize["method"])
                socket.send(json.dumps({"id": initialize["id"], "result": {}}))
                observations.append(json.loads(socket.recv())["method"])
                request = json.loads(socket.recv())
                socket.send(json.dumps({"method": "thread/started", "params": {}}))
                socket.send(json.dumps({"id": "approval", "method": "item/commandExecution/requestApproval", "params": {}}))
                denied = json.loads(socket.recv())
                observations.append(denied["error"]["code"])
                socket.send(json.dumps({"id": request["id"], "result": {"thread": {"id": "target"}}}))

            with unix_serve(handle, path=str(path)) as server:
                worker = threading.Thread(target=server.serve_forever, daemon=True)
                worker.start()
                try:
                    with native_task.NativeClient(path) as client:
                        result = client.request("thread/read", {"threadId": "target", "includeTurns": False})
                        self.assertEqual(result["thread"]["id"], "target")
                finally:
                    server.shutdown()
                    worker.join(timeout=3)
            self.assertEqual(observations, ["initialize", "initialized", -32601])


if __name__ == "__main__":
    unittest.main()
