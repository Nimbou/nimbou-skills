import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), 'utf8')
}

test('roadmap orchestration ships an executable, authorization-safe skill', () => {
  const skill = 'plugins/nimbou-skills/skills/roadmap-orchestration/SKILL.md'
  const model = 'plugins/nimbou-skills/skills/roadmap-orchestration/references/operating-model.md'
  const examples = 'plugins/nimbou-skills/skills/roadmap-orchestration/references/evaluations.md'

  for (const file of [skill, model, examples]) {
    assert.equal(existsSync(resolve(root, file)), true, `${file} should exist`)
  }

  const entrypoint = read(skill)
  const operatingModel = read(model)
  const evaluations = read(examples)

  assert.match(entrypoint, /^---\nname: roadmap-orchestration/m)
  assert.match(entrypoint, /description: Coordene entregas, tarefas Codex e PRs autorizados/i)
  assert.match(entrypoint, /autorização explícita/i)
  assert.match(entrypoint, /nimbou-skills:executing-plans/)
  assert.match(entrypoint, /nimbou-skills:browser-smoke/)
  assert.match(entrypoint, /nimbou-skills:merge-pr/)

  assert.match(operatingModel, /proposed.*ready.*blocked.*running.*review.*smoke.*pr-open.*integrated/is)
  assert.match(operatingModel, /planning.*implementation.*review.*smoke.*PR.*merge/is)
  assert.match(operatingModel, /Nunca crie uma task.*explicit authorization/is)
  assert.match(operatingModel, /Never merge.*explicit confirmation/is)
  assert.match(operatingModel, /reconcilie.*tarefas.*PRs existentes/is)
  assert.match(operatingModel, /planning.*model.*effort.*execution.*model.*effort/is)
  assert.match(operatingModel, /gpt-6-sol.*medium/is)
  assert.match(operatingModel, /gpt-6-luna.*high/is)
  assert.match(operatingModel, /Não recomende `gpt-6-astra`/)
  assert.match(operatingModel, /pause automation|delete it/i)

  for (const scenario of ['Urgent launch', 'Resume without duplication', 'PR ready to merge']) {
    assert.match(evaluations, new RegExp(scenario))
  }
})
