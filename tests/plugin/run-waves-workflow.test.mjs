import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const workflowPath = resolve(root, 'plugins/nimbou-skills/workflows/run-waves.js')
const source = readFileSync(workflowPath, 'utf8')

// The workflow runtime executes the script body with top-level `await` and
// `return`, and injects agent()/parallel()/log()/phase()/args as globals. Node
// cannot import that shape directly, so the harness reproduces it: strip the
// `export` off `meta`, wrap the body in an async IIFE, and inject stub agents.
// This exercises the orchestration itself — wave ordering, write-set grouping,
// blocked-wave handling, follow-up grouping — without spawning anything.
const body = source.replace(/^export const meta = /m, 'const meta = ')

async function runWorkflow(args, handlers) {
  const calls = []

  const agent = async (prompt, opts = {}) => {
    calls.push({ prompt, opts })
    for (const [match, value] of handlers) {
      const hit = typeof match === 'string' ? (opts.label ?? '').includes(match) : match.test(prompt)
      if (hit) return typeof value === 'function' ? value(prompt, opts) : value
    }
    return 'ok'
  }

  const parallel = (thunks) => Promise.all(thunks.map((thunk) => thunk().catch(() => null)))
  const pipeline = async () => {
    throw new Error('pipeline() is not used by run-waves')
  }

  const run = new Function(
    'args',
    'agent',
    'parallel',
    'pipeline',
    'log',
    'phase',
    `return (async () => { ${body} })()`,
  )

  const result = await run(args, agent, parallel, pipeline, () => {}, () => {})
  return { result, calls }
}

const twoWavePlan = {
  waveStructured: true,
  planOrigin: 'nestjs-plan',
  posExecucao: [],
  waves: [
    {
      title: 'Contratos',
      tasks: [
        { title: 'DTO', spec: 'spec a', files: ['src/a.ts'], verification: 'pnpm test -- a', agentType: 'nimbou-skills:nestjs-controller-author' },
        { title: 'Repo contract', spec: 'spec b', files: ['src/b.ts'], verification: 'pnpm test -- b', agentType: 'nimbou-skills:prisma-repository-author' },
      ],
    },
    {
      title: 'Implementação',
      tasks: [
        { title: 'Use case', spec: 'spec c', files: ['src/c.ts'], verification: 'pnpm test -- c', consumes: 'type A', agentType: 'nimbou-skills:nestjs-usecase-author' },
      ],
    },
    {
      title: 'Verificação',
      isNestjsTestWave: true,
      tasks: [
        { title: 'nestjs-test', spec: 'run scoped suites', files: ['src/a.spec.ts'], verification: 'pnpm test -- --runInBand src/a.spec.ts' },
      ],
    },
  ],
}

const PARSE = /extract its execution structure/
const SPEC_REVIEW = /reviewing whether a wave/
const CODE_REVIEW = /Brief yourself/
const WRITE_FOLLOWUPS = /Write the follow-ups artifact/

const doneImplementer = { status: 'DONE', filesTouched: ['src/a.ts'], verification: 'pass' }
const okCommit = { sha: 'sha', message: 'm' }

test('run-waves declares the meta block the workflow runtime requires', () => {
  assert.match(source, /^export const meta = \{/m)
  assert.match(source, /name: 'run-waves'/)
  assert.match(source, /description:/)
  assert.match(source, /whenToUse:/)

  for (const phase of ['Parse', 'Implement', 'Commit', 'Review', 'Follow-ups']) {
    assert.match(source, new RegExp(`title: '${phase}'`), `meta.phases should declare ${phase}`)
    assert.match(source, new RegExp(`phase\\('${phase}'\\)`), `body should call phase('${phase}')`)
  }
})

test('run-waves refuses to run without a plan path', async () => {
  const { result } = await runWorkflow(undefined, [])
  assert.match(result.error, /No plan path/)
})

test('run-waves refuses a plan that is not wave-structured', async () => {
  const { result } = await runWorkflow('docs/plans/x.md', [[PARSE, { waveStructured: false, waves: [] }]])
  assert.match(result.error, /Ondas de Execução/)
  assert.match(result.error, /nestjs-plan or nimbou-skills:nuxt-plan/)
})

test('run-waves fans out one implementer per task and commits once per wave', async () => {
  const { result, calls } = await runWorkflow('docs/plans/x.md', [
    [PARSE, twoWavePlan],
    ['commit Onda', (prompt) => ({ sha: prompt.includes('Contratos') ? 'sha1' : 'sha2', message: 'm' })],
    ['Onda', doneImplementer],
    [SPEC_REVIEW, { findings: [] }],
    [CODE_REVIEW, { findings: [] }],
  ])

  const implementers = calls.filter((call) => call.opts.phase === 'Implement')
  assert.equal(implementers.length, 4, 'four tasks across three waves means four implementers')

  const commits = calls.filter((call) => (call.opts.label ?? '').startsWith('commit Onda'))
  assert.equal(commits.length, 3, 'one commit per wave, not per task')

  assert.equal(result.wavesCommitted.length, 3)
  assert.equal(result.wavesCommitted[0].sha, 'sha1')
  assert.equal(result.followups, null)
  assert.match(result.message, /sem follow-ups pendentes/)

  const labels = calls.map((call) => call.opts.label ?? '')
  assert.ok(
    labels.indexOf('commit Onda 1 — Contratos') < labels.findIndex((label) => label.startsWith('Onda 2')),
    'wave 2 must not open before wave 1 is committed',
  )
})

test('run-waves routes each implementer to the Role the plan declared', async () => {
  const { calls } = await runWorkflow('docs/plans/x.md', [
    [PARSE, twoWavePlan],
    ['commit Onda', okCommit],
    ['Onda', doneImplementer],
    [SPEC_REVIEW, { findings: [] }],
    [CODE_REVIEW, { findings: [] }],
  ])

  const routed = calls
    .filter((call) => call.opts.phase === 'Implement')
    .map((call) => call.opts.agentType)

  assert.deepEqual(routed.sort(), [
    'nimbou-skills:nestjs-controller-author',
    'nimbou-skills:nestjs-usecase-author',
    'nimbou-skills:prisma-repository-author',
    undefined, // the declared nestjs-test wave carries no Role, by contract
  ])
})

test('run-waves falls back to general-purpose and records a concern when a Role is missing', async () => {
  const unrouted = JSON.parse(JSON.stringify(twoWavePlan))
  for (const wave of unrouted.waves) for (const task of wave.tasks) delete task.agentType

  let collected = []
  const { result } = await runWorkflow('docs/plans/x.md', [
    [PARSE, unrouted],
    ['commit Onda', okCommit],
    ['Onda', doneImplementer],
    [SPEC_REVIEW, { findings: [] }],
    [CODE_REVIEW, { findings: [] }],
    [
      WRITE_FOLLOWUPS,
      (prompt) => {
        collected = prompt.match(/declared no Role/g) ?? []
        return { path: 'docs/plans/x.followups.md', automatable: [], manual: [] }
      },
    ],
    ['commit follow-ups', { sha: 'shaF', message: 'docs' }],
    ['review follow-ups', { findings: [] }],
  ])

  assert.equal(collected.length, 3, 'every task that owes a Role is recorded; the nestjs-test wave is exempt')
  assert.ok(result.followups, 'a planning defect always produces a follow-ups artifact')
})

test('run-waves adds the nestjs-test wave when a backend plan forgot it', async () => {
  const noTestWave = JSON.parse(JSON.stringify(twoWavePlan))
  noTestWave.waves = noTestWave.waves.filter((wave) => !wave.isNestjsTestWave)

  let artifactPrompt = ''
  const { result, calls } = await runWorkflow('docs/plans/x.md', [
    [PARSE, noTestWave],
    ['commit Onda Final', { sha: 'shaT', message: 'test wave' }],
    ['commit Onda', okCommit],
    ['Onda Final', { status: 'DONE', filesTouched: ['src/a.spec.ts'], verification: 'pnpm test -- --runInBand src/a.spec.ts' }],
    ['Onda', doneImplementer],
    [SPEC_REVIEW, { findings: [] }],
    [CODE_REVIEW, { findings: [] }],
    [
      WRITE_FOLLOWUPS,
      (prompt) => {
        artifactPrompt = prompt
        return { path: 'docs/plans/x.followups.md', automatable: [], manual: [] }
      },
    ],
    ['commit follow-ups', { sha: 'shaF', message: 'docs' }],
    ['review follow-ups', { findings: [] }],
  ])

  const testWave = calls.find((call) => (call.opts.label ?? '').startsWith('Onda Final'))
  assert.ok(testWave, 'the missing verification wave must be added, not skipped')
  assert.match(testWave.prompt, /nimbou-skills:nestjs-test/)
  assert.match(testWave.prompt, /unfiltered `pnpm test` is forbidden/i)
  assert.match(testWave.prompt, /src\/a\.ts/, 'scope must list the files the plan actually changed')
  assert.doesNotMatch(testWave.prompt, /^\s*pnpm test\s*$/m, 'never an unscoped runner invocation')

  assert.ok(
    result.wavesCommitted.some((wave) => wave.wave.startsWith('Onda Final')),
    'the added wave is committed like any other',
  )
  assert.match(artifactPrompt, /declared no final nestjs-test wave/, 'the planning defect reaches follow-ups')
})

test('run-waves does not add a nestjs-test wave to a frontend plan', async () => {
  const frontend = JSON.parse(JSON.stringify(twoWavePlan))
  frontend.planOrigin = 'nuxt-plan'
  frontend.waves = frontend.waves.filter((wave) => !wave.isNestjsTestWave)

  const { calls } = await runWorkflow('docs/plans/x.md', [
    [PARSE, frontend],
    ['commit Onda', okCommit],
    ['Onda', doneImplementer],
    [SPEC_REVIEW, { findings: [] }],
    [CODE_REVIEW, { findings: [] }],
  ])

  assert.equal(
    calls.filter((call) => (call.opts.label ?? '').startsWith('Onda Final')).length,
    0,
    'the nestjs-test rule belongs to nestjs-plan only',
  )
})

test('run-waves never lets an implementer commit', async () => {
  const { calls } = await runWorkflow('docs/plans/x.md', [
    [PARSE, twoWavePlan],
    ['commit Onda', okCommit],
    ['Onda', doneImplementer],
    [SPEC_REVIEW, { findings: [] }],
    [CODE_REVIEW, { findings: [] }],
  ])

  for (const call of calls.filter((entry) => entry.opts.phase === 'Implement')) {
    assert.match(call.prompt, /Do NOT commit/, 'implementer prompts must forbid committing')
    assert.match(call.prompt, /You may WRITE only to the files above/)
    assert.doesNotMatch(call.prompt, /git add -A/)
  }
})

test('run-waves collapses tasks that share a file into one implementer', async () => {
  const colliding = JSON.parse(JSON.stringify(twoWavePlan))
  colliding.waves[0].tasks[1].files = ['src/a.ts']

  const { result, calls } = await runWorkflow('docs/plans/x.md', [
    [PARSE, colliding],
    ['commit Onda', okCommit],
    ['Onda', doneImplementer],
    [SPEC_REVIEW, { findings: [] }],
    [CODE_REVIEW, { findings: [] }],
    [WRITE_FOLLOWUPS, { path: 'docs/plans/x.followups.md', automatable: [], manual: [] }],
    ['commit follow-ups', { sha: 'shaF', message: 'docs' }],
    ['review follow-ups', { findings: [] }],
  ])

  const waveOne = calls.filter((call) => (call.opts.label ?? '').startsWith('Onda 1'))
  assert.equal(waveOne.length, 1, 'two tasks writing src/a.ts are not parallel-safe')
  assert.match(waveOne[0].prompt, /2 tasks that share a file/)

  assert.ok(result.followups, 'the collision is recorded as a concern, which forces a follow-ups artifact')
})

test('run-waves stops downstream waves when an implementer is BLOCKED', async () => {
  const { result, calls } = await runWorkflow('docs/plans/x.md', [
    [PARSE, twoWavePlan],
    [
      'Onda 1 — Contratos · Repo contract',
      { status: 'BLOCKED', filesTouched: [], verification: '', blocker: 'contract missing' },
    ],
    ['commit Onda', okCommit],
    ['Onda', doneImplementer],
  ])

  assert.equal(result.wavesCommitted.length, 0, 'a partially completed wave is never committed')
  assert.equal(result.stopped.wave, 'Onda 1 — Contratos')
  assert.equal(result.stopped.blockers[0].blocker, 'contract missing')
  assert.equal(calls.filter((call) => (call.opts.label ?? '').startsWith('commit')).length, 0)
  assert.equal(calls.filter((call) => (call.opts.label ?? '').startsWith('Onda 2')).length, 0)
  assert.equal(result.followups, undefined, 'no follow-ups artifact for an incomplete plan')
})

test('run-waves groups follow-up fixes by file and keeps manual items out of the artifact', async () => {
  const { result, calls } = await runWorkflow('docs/plans/x.md', [
    [PARSE, { ...twoWavePlan, posExecucao: ['revisar cache'] }],
    ['commit Onda', okCommit],
    ['Onda', doneImplementer],
    [SPEC_REVIEW, { findings: [{ tipo: 'spec-deferred', descricao: 'nit', ref: 'src/a.ts:3' }] }],
    [CODE_REVIEW, { findings: [] }],
    [
      WRITE_FOLLOWUPS,
      {
        path: 'docs/plans/x.followups.md',
        automatable: [
          { descricao: 'fix 1', files: ['src/a.ts'] },
          { descricao: 'fix 2', files: ['src/b.ts'] },
          { descricao: 'fix 3', files: ['src/a.ts', 'src/b.ts'] },
          { descricao: 'fix 4', files: ['src/c.ts'] },
        ],
        manual: ['rodar migration em produção'],
      },
    ],
    ['commit follow-ups', { sha: 'shaF', message: 'docs' }],
    ['review follow-ups', { findings: [] }],
  ])

  const fixes = calls.filter((call) => (call.opts.label ?? '').startsWith('fix '))
  assert.equal(fixes.length, 2, 'src/a.ts and src/b.ts merge via the spanning item; src/c.ts stays alone')

  const merged = fixes.find((call) => call.prompt.includes('fix 3'))
  assert.ok(
    merged.prompt.includes('fix 1') && merged.prompt.includes('fix 2'),
    'an item spanning two groups must pull them together so no two agents write the same file',
  )

  assert.deepEqual(result.manualActions, ['rodar migration em produção'])
  assert.match(result.message, /Ações manuais pendentes/)
})

test('run-waves carries `## Pos-execucao` items into the follow-ups artifact', async () => {
  let sawPosExecucao = false

  const { result } = await runWorkflow({ planPath: 'docs/plans/x.md' }, [
    [PARSE, { ...twoWavePlan, posExecucao: ['medir p95'] }],
    ['commit Onda', okCommit],
    ['Onda', doneImplementer],
    [SPEC_REVIEW, { findings: [] }],
    [CODE_REVIEW, { findings: [] }],
    [
      WRITE_FOLLOWUPS,
      (prompt) => {
        sawPosExecucao = prompt.includes('medir p95') && prompt.includes('pos-execucao')
        return { path: 'docs/plans/x.followups.md', automatable: [], manual: [] }
      },
    ],
    ['commit follow-ups', { sha: 'shaF', message: 'docs' }],
    ['review follow-ups', { findings: [] }],
  ])

  assert.ok(sawPosExecucao, 'plan `## Pos-execucao` items reach the artifact writer tagged as pos-execucao')
  assert.equal(result.followups, 'docs/plans/x.followups.md')
})

const skillDir = 'plugins/nimbou-skills/skills/executing-plans'

test('executing-plans routes Steps 2-4 out of the skill and into the two executors', () => {
  const skill = readFileSync(resolve(root, `${skillDir}/SKILL.md`), 'utf8')

  // The router owns Step 1 and the routing decision. Nothing else executable.
  assert.match(skill, /## Step 1: Load and Review/)
  assert.match(skill, /## Routing: where the run actually happens/)
  assert.match(skill, /\/nimbou-skills:run-waves/)
  assert.match(skill, /prose-execution\.md/)
  assert.match(skill, /Codex does not run workflows/)
  assert.doesNotMatch(skill, /task mode/i)

  // The point of the split: the slow path cannot be walked from this file.
  for (const heading of ['## Step 2', '## Step 3', '## Step 4', '### 2.1', '### 2.2']) {
    assert.ok(
      !skill.includes(heading),
      `${heading} belongs in prose-execution.md, not in the router — otherwise it gets followed by default`,
    )
  }
})

test('prose-execution carries the full executable contract for Codex', () => {
  const prose = readFileSync(resolve(root, `${skillDir}/prose-execution.md`), 'utf8')
  const implementer = readFileSync(resolve(root, `${skillDir}/implementer-prompt.md`), 'utf8')

  assert.match(prose, /## Step 2: Execute/)
  assert.match(prose, /## Step 3: Collect Reviews/)
  assert.match(prose, /## Step 4: Execute Follow-ups/)
  assert.match(prose, /one implementer subagent per task/i)
  assert.match(prose, /commit once per wave/i)
  assert.match(prose, /check the write sets/i)
  assert.match(prose, /implementer-prompt\.md/)
  assert.match(prose, /## Role Routing/)
  assert.match(prose, /Never infer a role from the file path/i)
  assert.match(prose, /This file is normative/i)
  assert.match(prose, /Step 1 lives in `SKILL\.md`/)

  assert.match(implementer, /One dispatch per task/)
  assert.match(implementer, /Files You Own/)
  assert.match(implementer, /Never let an implementer commit/)
})
