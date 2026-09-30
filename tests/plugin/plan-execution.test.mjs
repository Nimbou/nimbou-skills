import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const skills = 'plugins/nimbou-skills/skills'
const corePath = `${skills}/roadmap-orchestration/references/execution-core.md`
const recordPath = `${skills}/roadmap-orchestration/references/execution-record.md`
const read = (path) => readFileSync(resolve(root, path), 'utf8')

test('action plans and roadmaps load the same packaged execution contract', () => {
  for (const path of [`${skills}/action-plan/SKILL.md`, `${skills}/roadmap-orchestration/SKILL.md`]) {
    const source = read(path)
    const links = [...source.matchAll(/\]\(([^)]+execution-core\.md)\)/g)]
    assert.equal(links.length, 1, `${path} must load the shared contract once`)
    assert.equal(resolve(dirname(resolve(root, path)), links[0][1]), resolve(root, corePath))
  }
  assert.equal(existsSync(resolve(root, recordPath)), true)
  assert.match(read(`${skills}/action-plan/SKILL.md`), /EXECUÇÃO/)
  assert.match(read(`${skills}/action-plan/SKILL.md`), /plano\.json/)
  assert.match(read(`${skills}/plan-summary/SKILL.md`), /plano\.json/)
})

test('execution authorization survives scheduled resumption without widening scope', () => {
  const core = read(corePath)
  assert.match(core, /autorização.*execução.*plano/is)
  assert.match(core, /não peça.*novamente/is)
  assert.match(core, /create_thread.*inicia/is)
  assert.match(core, /send_message_to_thread/)
  assert.match(core, /revogad|revoga/i)
  assert.match(core, /merge-pr/)
  assert.match(core, /write sets|write_sets/i)
  assert.doesNotMatch(core, /start_thread|mcp__faepen__list_tasks/)
})

test('persistent children report to the parent while the parent verifies outputs', () => {
  const core = read(corePath)
  assert.match(core, /chat persistente por marco/i)
  for (const tool of ['list_projects', 'create_thread', 'wait_threads', 'read_thread', 'send_message_to_thread']) {
    assert.match(core, new RegExp(tool))
  }
  assert.match(core, /clientThreadId.*threadId/is)
  assert.match(core, /pai.*único escritor/is)
  assert.match(core, /result\.md/)
  assert.match(core, /sem mensagem/is)
  assert.match(core, /confira o pedido humano.*read_thread/is)
  assert.match(core, /follow-up.*pode disparar um turno/is)
  assert.match(core, /filha.*callback.*nunca escreve `operations`/is)
  assert.match(core, /gpt-6-sol.*medium/is)
  assert.match(core, /gpt-6-luna.*high/is)
})

test('heartbeat makes progress every 30 minutes and handles unknown creation outcomes', () => {
  const core = read(corePath)
  assert.match(core, /automation_update/)
  assert.match(core, /heartbeat/)
  assert.match(core, /30 minutos/)
  assert.match(core, /silencios/i)
  assert.match(core, /resultado desconhecido/is)
  assert.match(core, /não repita.*criação/is)
  assert.match(core, /bloquead.*concluíd/is)
  assert.match(core, /paus.*automação/is)
})

test('human work uses supported FAEPEN fields and requires checked evidence', () => {
  const core = read(corePath)
  assert.match(core, /mcp__faepen__create_task/)
  assert.match(core, /mcp__faepen__get_task/)
  assert.match(core, /teams.*effort/is)
  assert.match(core, /nome exato/i)
  assert.match(core, /CONCLUIDA.*evidência/is)
  assert.match(core, /histórico.*anexos.*comentários/is)
  assert.match(core, /post.*valid|pós.*valid/is)
  assert.match(core, /Marcos mistos.*filha.*não cria tarefas FAEPEN/is)
  assert.match(read(recordPath), /operation_key.*outcome.*unknown/is)
})

test('operational identifiers stay optional in the management plan schema', () => {
  const schema = read(`${skills}/action-plan/references/schema.md`)
  assert.match(schema, /id.*opcional/is)
  assert.match(schema, /execucao\.json/)
  assert.match(read(recordPath), /schema_version/)
  assert.match(read(recordPath), /depends_on/)
  assert.match(read(recordPath), /authorization/)
  assert.match(read(recordPath), /evidence/)
  assert.match(read(recordPath), /source_ref/)
})

test('execution reference links resolve inside the shipped skill tree', () => {
  for (const path of [corePath, recordPath, `${skills}/roadmap-orchestration/references/operating-model.md`]) {
    for (const [, target] of read(path).matchAll(/\]\(([^)]+\.md)\)/g)) {
      assert.equal(existsSync(resolve(dirname(resolve(root, path)), target)), true, `${path}: ${target}`)
    }
  }
})

test('the mixed-plan example has stable identities and a valid dependency graph', () => {
  const example = read(recordPath).match(/```json\n([\s\S]*?)\n```/)
  assert.ok(example, 'a parseable mixed-plan example must ship with the contract')
  const record = JSON.parse(example[1])
  assert.equal(record.schema_version, 1)
  assert.equal(record.monitor.interval_minutes, 30)
  assert.equal(record.state, 'proposed', 'example cannot authorize or run real work')
  assert.deepEqual(record.authorization.actions, [])
  const ids = new Set(record.milestones.map((milestone) => milestone.id))
  assert.equal(ids.size, record.milestones.length)
  assert.deepEqual(new Set(record.source.active_scope), ids)
  const visited = new Set()
  function visit(id, path = new Set()) {
    assert.ok(ids.has(id), `missing dependency: ${id}`)
    assert.ok(!path.has(id), `cyclic dependency: ${id}`)
    if (visited.has(id)) return
    const milestone = record.milestones.find((entry) => entry.id === id)
    assert.ok(milestone.source_ref && milestone.criteria.length > 0)
    for (const dependency of milestone.depends_on) visit(dependency, new Set([...path, id]))
    visited.add(id)
  }
  for (const id of ids) visit(id)
  assert.equal(record.milestones.filter((entry) => entry.kind === 'human').length, 1)
  assert.equal(record.milestones.find((entry) => entry.id === 'consolidacao').depends_on.length, 2)
})
