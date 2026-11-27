import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'

function setupInstaller(t) {
  const checkout = mkdtempSync(join(realpathSync(tmpdir()), 'nimbou install-'))
  t.after(() => rmSync(checkout, { recursive: true, force: true }))
  const bin = join(checkout, 'bin')
  const scripts = join(checkout, 'scripts')
  mkdirSync(bin)
  mkdirSync(scripts)
  copyFileSync(new URL('../../install.sh', import.meta.url), join(checkout, 'install.sh'))
  for (const name of ['pnpm', 'npm']) {
    writeFileSync(join(bin, name), '#!/bin/sh\nexit 0\n', { mode: 0o755 })
  }
  for (const name of ['codex-full-wrapper', 'chrome-devtools-wrapper', 'codex-skills', 'python-docx']) {
    writeFileSync(join(scripts, `setup-${name}.sh`), 'exit 0\n')
  }

  const previousSource = join(checkout, 'previous clone')
  const sourceFile = join(checkout, 'source')
  writeFileSync(sourceFile, previousSource)
  writeFileSync(join(bin, 'codex'), `#!/usr/bin/env node
const { readFileSync, writeFileSync } = require('node:fs')
const [, , command, group, action, path] = process.argv
const { TEST_MARKETPLACE_SOURCE_FILE, TEST_FAIL_MARKETPLACE_MIGRATION } = process.env
const source = readFileSync(TEST_MARKETPLACE_SOURCE_FILE, 'utf8')

if (command !== 'plugin') process.exit(2)
if (group === 'add' && action === 'nimbou-skills@nimbou-skills') {
  process.exit(source === process.cwd() ? 0 : 2)
}
if (group !== 'marketplace') process.exit(2)

switch (action) {
  case '--help': break
  case 'list':
    console.log(JSON.stringify({ marketplaces: [{ name: 'nimbou-skills', marketplaceSource: { sourceType: 'local', source } }] }))
    break
  case 'remove':
    if (path !== 'nimbou-skills' || source === process.cwd()) process.exit(2)
    writeFileSync(TEST_MARKETPLACE_SOURCE_FILE, '')
    break
  case 'add':
    if (source && source !== path) {
      console.error("Error: marketplace 'nimbou-skills' is already added from a different source; remove it before adding this source")
      process.exit(1)
    }
    if (TEST_FAIL_MARKETPLACE_MIGRATION && path === process.cwd()) {
      console.error('Error: new checkout could not be registered')
      process.exit(1)
    }
    writeFileSync(TEST_MARKETPLACE_SOURCE_FILE, path)
    break
  default: process.exit(2)
}
`, { mode: 0o755 })

  return {
    checkout,
    previousSource,
    registeredSource: () => readFileSync(sourceFile, 'utf8'),
    install: (extraEnv) => spawnSync('bash', ['install.sh'], {
      cwd: checkout,
      encoding: 'utf8',
      env: { ...process.env, PATH: `${bin}${delimiter}${process.env.PATH}`, TEST_MARKETPLACE_SOURCE_FILE: sourceFile, ...extraEnv },
    }),
  }
}

test('the installer switches local marketplace checkouts and can be run again', (t) => {
  const installer = setupInstaller(t)
  for (let run = 0; run < 2; run += 1) {
    const result = installer.install()
    assert.equal(result.status, 0, result.stderr)
    assert.equal(installer.registeredSource(), installer.checkout)
  }
})

test('the installer restores the previous marketplace if registering the new checkout fails', (t) => {
  const installer = setupInstaller(t)
  const result = installer.install({ TEST_FAIL_MARKETPLACE_MIGRATION: '1' })
  assert.equal(result.status, 1, result.stderr)
  assert.match(result.stderr, /new checkout could not be registered/)
  assert.equal(installer.registeredSource(), installer.previousSource)
})
