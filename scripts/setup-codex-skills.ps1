#Requires -Version 7

# Windows counterpart of setup-codex-skills.sh.
# Links the plugin skills into the Codex user
# skills directory using directory junctions (no admin/Developer Mode needed).

$ErrorActionPreference = 'Stop'

$ScriptDir = $PSScriptRoot
$RepoRoot = Split-Path -Parent $ScriptDir
$SharedSkillsDir = Join-Path $RepoRoot 'plugins\nimbou-skills\skills'
$CodexSkillsDir = if ($env:CODEX_SKILLS_DIR) {
  $env:CODEX_SKILLS_DIR
} else {
  Join-Path $env:USERPROFILE '.codex\skills'
}

function Set-DirJunction {
  param(
    [string]$Source,
    [string]$Target,
    [string]$Label
  )

  $parent = Split-Path -Parent $Target
  if (-not (Test-Path -LiteralPath $parent)) {
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
  }

  $item = Get-Item -LiteralPath $Target -Force -ErrorAction SilentlyContinue
  if ($item -and $item.LinkType -eq 'Junction') {
    # Delete only the reparse point, never the target contents.
    [System.IO.Directory]::Delete($Target, $false)
    New-Item -ItemType Junction -Path $Target -Value $Source | Out-Null
    Write-Host "$Label already linked: $Target"
    return
  }

  if ($item) {
    Write-Warning "Skipping existing ${Label}: $Target"
    return
  }

  New-Item -ItemType Junction -Path $Target -Value $Source | Out-Null
  Write-Host "Linked ${Label}: $Target"
}

New-Item -ItemType Directory -Force -Path $CodexSkillsDir | Out-Null

foreach ($skillsDir in @($SharedSkillsDir)) {
  if (-not (Test-Path -LiteralPath $skillsDir)) { continue }

  Get-ChildItem -LiteralPath $skillsDir -Directory | ForEach-Object {
    Set-DirJunction -Source $_.FullName -Target (Join-Path $CodexSkillsDir $_.Name) -Label 'Codex skill'
  }
}

Write-Host "Configured Codex skills: $CodexSkillsDir"
