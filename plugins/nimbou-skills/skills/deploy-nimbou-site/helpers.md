# Deploy helpers (token-protected, one-shot, delete after)

These run privileged steps on an FTP-only host (no SSH). Rules for **every** helper:

1. **Fresh random token per deploy.** Generate one (e.g. `openssl rand -base64 24 | tr -d '/+=' | cut -c1-32`), paste it into the helper's `$TOKEN`, and pass it as `?token=…` over HTTPS. Never reuse the token committed here — it is illustrative.
2. Upload the helper into the target `public/` (site or admin), hit it **once** over HTTPS, read the plain-text result.
3. **Delete the helper immediately**, then confirm it returns **404** (`curl -s -o /dev/null -w '%{http_code}' <URL>/_deploy_extract.php` → `404`). Deletion is a verified step, not cleanup-later — these expose files and credentials.
4. Helpers read DB creds from the app's `.env` (`DB_HOST`/`DB_DATABASE`/`DB_USERNAME`/`DB_PASSWORD`) so no secret is hardcoded in the file.

---

## `_deploy_extract.php` — unzip the uploaded bundle into the app-root

```php
<?php
// One-shot deploy helper. Extracts a zip from the app-root into the app-root. DELETE AFTER.
$TOKEN = '<FRESH_RANDOM_TOKEN>';
if (($_GET['token'] ?? '') !== $TOKEN) { http_response_code(403); exit('forbidden'); }
@set_time_limit(0); @ini_set('memory_limit', '512M');
header('Content-Type: text/plain; charset=utf-8');
if (!class_exists('ZipArchive')) { http_response_code(500); exit('NO_ZIPARCHIVE'); }
$appRoot = dirname(__DIR__);                 // this file sits in public/ -> extract to the parent (app-root)
$zipPath = $appRoot . '/' . basename($_GET['zip'] ?? 'site.zip');
if (!is_file($zipPath)) { http_response_code(404); exit('ZIP_NOT_FOUND: ' . $zipPath); }
$za = new ZipArchive();
$rc = $za->open($zipPath);
if ($rc !== true) { http_response_code(500); exit('OPEN_FAIL code=' . $rc); }
$n = $za->numFiles; $ok = $za->extractTo($appRoot); $za->close();
echo $ok ? ('OK extracted ' . $n . ' entries to ' . $appRoot) : 'EXTRACT_FAIL';
```

---

## `_deploy_import.php` — import the sanitized SQL dump into the shared DB

Reads creds from `.env`; streams the dump with `mysqli::multi_query`; reports per-batch errors and final row counts. ⚠️ Sanitize the dump for MariaDB **before** uploading (collation `utf8mb4_0900_ai_ci`→`utf8mb4_unicode_ci`; strip `DEFINER` / VIEW `SQL SECURITY INVOKER`). Set `$TABLES` to a few real tables of the site being deployed.

```php
<?php
// One-shot deploy helper. Imports a SQL dump into the DB from .env. DELETE AFTER (+ the .sql).
$TOKEN = '<FRESH_RANDOM_TOKEN>';
if (($_GET['token'] ?? '') !== $TOKEN) { http_response_code(403); exit('forbidden'); }
@set_time_limit(0); @ini_set('memory_limit', '512M');
mysqli_report(MYSQLI_REPORT_OFF);            // errors via return/errno, not exceptions
header('Content-Type: text/plain; charset=utf-8');
$appRoot = dirname(__DIR__);
$env = @file_get_contents($appRoot . '/.env');
if ($env === false) { http_response_code(500); exit('NO_ENV'); }
function envval($env, $k) { return preg_match('/^' . preg_quote($k, '/') . '=(.*)$/m', $env, $m) ? trim($m[1], " \t\r\n\"'") : null; }
$host = envval($env, 'DB_HOST') ?: 'localhost';
$db   = envval($env, 'DB_DATABASE');
$user = envval($env, 'DB_USERNAME');
$pass = envval($env, 'DB_PASSWORD');
$sqlPath = $appRoot . '/' . basename($_GET['sql'] ?? 'dump.sql');
if (!is_file($sqlPath)) { http_response_code(404); exit('SQL_NOT_FOUND: ' . $sqlPath); }
$mysqli = new mysqli($host, $user, $pass, $db);
if ($mysqli->connect_errno) { http_response_code(500); exit('DB_CONN_FAIL: ' . $mysqli->connect_error); }
$mysqli->set_charset('utf8mb4');
$sql = file_get_contents($sqlPath);
if (!$mysqli->multi_query($sql)) { http_response_code(500); exit('FIRST_QUERY_FAIL(errno=' . $mysqli->errno . '): ' . $mysqli->error); }
$batches = 0;
do {
  $batches++;
  if ($res = $mysqli->store_result()) { $res->free(); }
  if ($mysqli->errno) { http_response_code(500); exit('EXEC_ERR at batch ' . $batches . ' (errno=' . $mysqli->errno . '): ' . $mysqli->error); }
  if (!$mysqli->more_results()) break;
} while ($mysqli->next_result());
if ($mysqli->errno) { http_response_code(500); exit('TAIL_ERR at batch ' . $batches . ' (errno=' . $mysqli->errno . '): ' . $mysqli->error); }
$TABLES = ['modules', 'images', 'accounts'];  // add a few real content tables of THIS site
echo "OK imported ($batches batches)\n";
foreach ($TABLES as $t) {
  if ($r = $mysqli->query("SELECT COUNT(*) c FROM `$t`")) { $row = $r->fetch_assoc(); echo "$t=" . $row['c'] . "\n"; $r->free(); }
  else { echo "$t=ERR:" . $mysqli->error . "\n"; }
}
```

---

## `_deploy_export.php` — back up the destination DB BEFORE any import

⚠️ **Mandatory before any redeploy import** (and cheap insurance on first import if the DB is not truly empty). Writes a timestamped `.sql` outside the web root; download it by FTP, then delete the helper. Requires `mysqldump` to exist on the host — if it does not, use cPanel's Backup wizard or Adminer's Export instead and skip this helper.

```php
<?php
// One-shot deploy helper. Dumps the .env DB to a file outside public/. DELETE AFTER (download the .sql first).
$TOKEN = '<FRESH_RANDOM_TOKEN>';
if (($_GET['token'] ?? '') !== $TOKEN) { http_response_code(403); exit('forbidden'); }
@set_time_limit(0);
header('Content-Type: text/plain; charset=utf-8');
$appRoot = dirname(__DIR__);
$env = @file_get_contents($appRoot . '/.env');
function ev($e, $k) { return preg_match('/^' . preg_quote($k, '/') . '=(.*)$/m', $e, $m) ? trim($m[1], " \t\r\n\"'") : null; }
$db = ev($env, 'DB_DATABASE'); $u = ev($env, 'DB_USERNAME'); $p = ev($env, 'DB_PASSWORD'); $h = ev($env, 'DB_HOST') ?: 'localhost';
$stamp = date('Ymd-His');
$out = $appRoot . "/backup-$db-$stamp.sql";   // outside public/, above the web root
$cmd = sprintf('mysqldump --single-transaction --default-character-set=utf8mb4 -h%s -u%s -p%s %s > %s 2>&1',
  escapeshellarg($h), escapeshellarg($u), escapeshellarg($p), escapeshellarg($db), escapeshellarg($out));
$rc = 0; $o = []; exec($cmd, $o, $rc);
echo $rc === 0 && is_file($out) ? ("OK backup -> " . basename($out) . " (" . filesize($out) . " bytes)\n") : ("BACKUP_FAIL rc=$rc\n" . implode("\n", $o));
```

---

## `_dbcheck.php` — prove the prefixed DB name / host before importing

Handy in Step 2 to discover the real cPanel-prefixed DB name and which host string connects.

```php
<?php
$TOKEN = '<FRESH_RANDOM_TOKEN>';
if (($_GET['token'] ?? '') !== $TOKEN) { http_response_code(403); exit('forbidden'); }
header('Content-Type: text/plain; charset=utf-8');
mysqli_report(MYSQLI_REPORT_OFF);
$env = @file_get_contents(dirname(__DIR__) . '/.env');
function ev($e, $k) { return preg_match('/^' . preg_quote($k, '/') . '=(.*)$/m', $e, $m) ? trim($m[1], " \t\r\n\"'") : null; }
$u = ev($env, 'DB_USERNAME'); $p = ev($env, 'DB_PASSWORD');
echo "user=$u\n";
foreach (['localhost', '127.0.0.1'] as $h) {
  foreach ([ev($env, 'DB_DATABASE'), '<bare_name>', '<acct_bare_name>'] as $db) {
    $c = @new mysqli($h, $u, $p, $db);
    echo $c->connect_errno ? "[$h][$db] FAIL: {$c->connect_error}\n"
      : "[$h][$db] OK db=" . ($c->query('SELECT DATABASE() d')->fetch_assoc()['d'] ?? '?') . "\n";
    if (!$c->connect_errno) $c->close();
  }
}
```
