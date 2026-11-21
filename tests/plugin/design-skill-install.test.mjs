import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, realpathSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const skills = join(root, 'plugins/nimbou-skills/skills')
const retired = ['design-md', 'nuxt-components-redesign']

test('installing renamed design skills removes only links from this checkout', (t) => {
  const temporary = mkdtempSync(join(tmpdir(), 'nimbou-design-install-'))
  t.after(() => rmSync(temporary, { recursive: true, force: true }))
  const destination = join(temporary, 'skills')
  mkdirSync(destination)
  const install = () => execFileSync('bash', [join(root, 'scripts/setup-codex-skills.sh')], {
    env: { ...process.env, CODEX_SKILLS_DIR: destination },
    stdio: 'pipe',
  })

  for (const name of retired) {
    symlinkSync(join(skills, name), join(destination, name), 'dir')
  }
  symlinkSync(join(skills, 'nuxt-component-harden'), join(destination, 'nuxt-component-harden'), 'dir')
  install()

  for (const name of retired) {
    assert.throws(() => lstatSync(join(destination, name)), { code: 'ENOENT' })
  }
  for (const name of ['craft-setup', 'craft-sync', 'craft-explore', 'nuxt-design', 'nuxt-component-harden']) {
    const installed = join(destination, name)
    assert.equal(realpathSync(installed), realpathSync(join(skills, name)))
    assert.ok(readFileSync(join(installed, 'SKILL.md'), 'utf8').startsWith(`---\nname: ${name}\n`))
  }

  const foreignLink = join(destination, 'design-md')
  const foreignSource = join(temporary, 'other-plugin', 'design-md')
  symlinkSync(foreignSource, foreignLink, 'dir')
  const personalDirectory = join(destination, 'nuxt-components-redesign')
  mkdirSync(personalDirectory)
  install()

  assert.equal(readlinkSync(foreignLink), foreignSource)
  assert.ok(lstatSync(personalDirectory).isDirectory())
})
