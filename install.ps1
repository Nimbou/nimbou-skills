#Requires -Version 7
$ErrorActionPreference = 'Stop'
$RepoRoot = $PSScriptRoot
$LocalPrefix = Join-Path $env:USERPROFILE '.local'
$PwshExe = (Get-Process -Id $PID).Path
foreach ($name in @('node', 'pnpm', 'npm', 'codex')) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) { throw "Missing required command: $name" }
}
if ([int](node -p "process.versions.node.split('.')[0]") -lt 20) { throw 'Node >= 20 is required.' }
codex plugin marketplace --help *> $null
if ($LASTEXITCODE -ne 0) { throw 'Codex marketplace support is required. Install Codex rust-v0.121.0+ or newer.' }
pnpm install --dir $RepoRoot
if ($LASTEXITCODE -ne 0) { throw 'pnpm install failed.' }
codex plugin marketplace add $RepoRoot
if ($LASTEXITCODE -ne 0) { throw 'Codex marketplace registration failed.' }
$env:npm_config_prefix = $LocalPrefix
npm link --prefix $RepoRoot
if ($LASTEXITCODE -ne 0) { throw 'npm link failed for nb-catalog.' }
npm install -g '@google/design.md'
if ($LASTEXITCODE -ne 0) { throw 'Installing @google/design.md failed.' }
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if (($userPath -split ';') -notcontains $LocalPrefix) { [Environment]::SetEnvironmentVariable('Path', "$LocalPrefix;$userPath", 'User') }
if (($env:Path -split ';') -notcontains $LocalPrefix) { $env:Path = "$LocalPrefix;$env:Path" }
& $PwshExe -NoProfile -File (Join-Path $RepoRoot 'scripts/setup-codex-full-wrapper.ps1')
& $PwshExe -NoProfile -File (Join-Path $RepoRoot 'scripts/setup-codex-skills.ps1')
& $PwshExe -NoProfile -File (Join-Path $RepoRoot 'scripts/setup-python-docx.ps1')
Write-Host 'Codex installation complete. Restart Codex to load the skills.'
