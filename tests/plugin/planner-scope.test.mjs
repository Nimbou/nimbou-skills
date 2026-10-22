import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
const root = resolve(import.meta.dirname, '../../plugins/nimbou-skills/skills')
const entries = ['nestjs-plan/SKILL.md', 'laravel-plan/SKILL.md', 'nuxt-plan/SKILL.md', 'fullstack-plan/SKILL.md', 'change-plan/SKILL.md', 'change-plan/plan-generation.md', 'executing-plans/plan-session-handoff.md']
for (const entry of entries) {
  test(`${entry} requires the packaged scope and summary contract`, () => {
    const source = readFileSync(resolve(root, entry), 'utf8')
    const links = [...source.matchAll(/\[Required scope and delivery summary\]\(([^)]+)\)/g)]
    assert.equal(links.length, 1, 'load the contract once, outside saved-plan examples')
    const link = links[0]
    assert.ok(link, 'mandatory scope contract link missing')
    const target = resolve(dirname(resolve(root, entry)), link[1])
    assert.equal(target, resolve(root, 'fullstack-plan/scope-summary.md'))
    assert.ok(existsSync(target))
  })
}
