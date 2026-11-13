import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const skills = resolve(root, 'plugins/nimbou-skills/skills')

test('shared installer exposes modern-web-guidance outside project dependencies and can run twice', () => {
  const destination = mkdtempSync(join(tmpdir(), 'nimbou-modern-web-'))
  const packageBefore = readFileSync(resolve(root, 'package.json'), 'utf8')
  const lockBefore = readFileSync(resolve(root, 'pnpm-lock.yaml'), 'utf8')
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      execFileSync('bash', [resolve(root, 'scripts/setup-codex-skills.sh')], {
        env: { ...process.env, CODEX_SKILLS_DIR: destination },
        stdio: 'pipe',
      })
      const installed = join(destination, 'modern-web-guidance')
      assert.equal(realpathSync(installed), resolve(skills, 'modern-web-guidance'))
      assert.match(readFileSync(join(installed, 'SKILL.md'), 'utf8'), /^---\nname: modern-web-guidance\n/)
    }
    assert.equal(readFileSync(resolve(root, 'package.json'), 'utf8'), packageBefore)
    assert.equal(readFileSync(resolve(root, 'pnpm-lock.yaml'), 'utf8'), lockBefore)
  } finally {
    rmSync(destination, { recursive: true, force: true })
  }
})

test('frontend entry points resolve the shared guidance skill shipped in the plugin', () => {
  const consumers = [
    'nuxt-think',
    'nuxt-design-posture',
    'nuxt-performance',
    'nuxt-audit',
    'nuxt-components-redesign',
  ]
  for (const name of consumers) {
    const content = readFileSync(resolve(skills, name, 'SKILL.md'), 'utf8')
    assert.ok(content.includes('nimbou-skills:modern-web-guidance'), `${name} should route to the shared skill`)
  }
  const content = readFileSync(resolve(skills, 'modern-web-guidance/SKILL.md'), 'utf8')
  assert.match(content, /^---\nname: modern-web-guidance\n/)
})
