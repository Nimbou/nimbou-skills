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
      // startsWith, not includes: a generic 'Onda' matcher would otherwise swallow
      // 'spec review Onda 1 — ...' and silently kill the reviewer handlers.
      const hit = typeof match === 'string' ? (opts.label ?? '').startsWith(match) : match.test(prompt)
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

// The parse agent establishes the checkout every later agent is anchored to. It is
// a worktree path here on purpose: the run must never fall back to the main checkout.
const WORKTREE = '/wt/feature-x'

const twoWavePlan = {
  waveStructured: true,
  repoRoot: WORKTREE,
  branch: 'feature/x',
  planOrigin: 'nestjs-plan',
  posExecucao: [],
  waves: [
    {
      title: 'Contratos',
      tasks: [
        { title: 'DTO', specLines: { start: 10, end: 20 }, files: ['src/a.ts'], verification: 'pnpm test -- a', agentType: 'nimbou-skills:nestjs-controller-author' },
        { title: 'Repo contract', specLines: { start: 21, end: 30 }, files: ['src/b.ts'], verification: 'pnpm test -- b', agentType: 'nimbou-skills:prisma-repository-author' },
      ],
    },
    {
      title: 'Implementação',
      tasks: [
        { title: 'Use case', specLines: { start: 40, end: 55 }, files: ['src/c.ts'], verification: 'pnpm test -- c', consumes: 'type A', agentType: 'nimbou-skills:nestjs-usecase-author' },
      ],
    },
    {
      title: 'Verificação',
      isNestjsTestWave: true,
      tasks: [
        { title: 'nestjs-test', specLines: { start: 60, end: 70 }, files: ['src/a.spec.ts'], verification: 'pnpm test -- --runInBand src/a.spec.ts' },
      ],
    },
  ],
}

const PARSE = /extract its execution structure/
const SPEC_REVIEW = /reviewing whether a plan/
// The second and last lens: boundaries and conventions, blind to the plan. It
// replaced the per-wave code reviewer, which the run no longer spawns at all.
const GAP_REVIEW = /boundary lens/
const WRITE_FOLLOWUPS = /Write the follow-ups artifact/

const doneImplementer = { status: 'DONE', filesTouched: ['src/a.ts'], verification: 'pass' }
const okCommit = { status: 'COMMITTED', sha: 'sha', message: 'm' }

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
    [GAP_REVIEW, { findings: [] }],
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
    [GAP_REVIEW, { findings: [] }],
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

test('run-waves keeps the Role when merged tasks agree on it', async () => {
  const colliding = JSON.parse(JSON.stringify(twoWavePlan))
  colliding.waves[0].tasks[1].files = ['src/a.ts'] // same file as task 1 -> merge
  colliding.waves[0].tasks[1].agentType = colliding.waves[0].tasks[0].agentType

  const { calls } = await runWorkflow('docs/plans/x.md', [
    [PARSE, colliding],
    ['commit Onda', okCommit],
    ['Onda', doneImplementer],
    [SPEC_REVIEW, { findings: [] }],
    [GAP_REVIEW, { findings: [] }],
    [WRITE_FOLLOWUPS, { path: 'docs/plans/x.followups.md', automatable: [], manual: [] }],
  ])

  const merged = calls.find((call) => (call.opts.label ?? '').startsWith('Onda 1'))
  assert.equal(
    merged.opts.agentType,
    'nimbou-skills:nestjs-controller-author',
    'a collision costs the parallelism, but not the Role when both tasks declare the same one',
  )
})

test('run-waves drops the Role and says so when merged tasks declare different ones', async () => {
  const colliding = JSON.parse(JSON.stringify(twoWavePlan))
  colliding.waves[0].tasks[1].files = ['src/a.ts'] // controller-author + repository-author

  let artifactPrompt = ''
  const { calls } = await runWorkflow('docs/plans/x.md', [
    [PARSE, colliding],
    ['commit Onda', okCommit],
    ['Onda', doneImplementer],
    [SPEC_REVIEW, { findings: [] }],
    [GAP_REVIEW, { findings: [] }],
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

  const merged = calls.find((call) => (call.opts.label ?? '').startsWith('Onda 1'))
  assert.equal(merged.opts.agentType, undefined, 'two different Roles have no correct winner')
  assert.match(artifactPrompt, /declare different Roles/, 'the dropped routing must reach follow-ups')
  assert.match(artifactPrompt, /nestjs-controller-author/, 'and must name what was lost')
})

test('run-waves refuses to dispatch a wave without an absolute checkout to write into', async () => {
  const rootless = JSON.parse(JSON.stringify(twoWavePlan))
  delete rootless.repoRoot

  const { result, calls } = await runWorkflow('docs/plans/x.md', [
    [PARSE, rootless],
    ['commit Onda', okCommit],
    ['Onda', doneImplementer],
  ])

  assert.match(result.error, /repoRoot/)
  assert.equal(
    calls.filter((call) => (call.opts.label ?? '').startsWith('Onda')).length,
    0,
    'unanchored implementers resolve the plan against whatever checkout they inherit',
  )
})

test('run-waves anchors every writing agent to the checkout the parse agent reported', async () => {
  const { calls } = await runWorkflow('docs/plans/x.md', [
    [PARSE, twoWavePlan],
    ['commit Onda', okCommit],
    ['Onda', doneImplementer],
    [SPEC_REVIEW, { findings: [] }],
    [GAP_REVIEW, { findings: [] }],
  ])

  const anchored = ['Onda 1', 'commit Onda 1']
  for (const label of anchored) {
    const call = calls.find((c) => (c.opts.label ?? '').startsWith(label))
    assert.match(call.prompt, new RegExp(`WORKTREE_ROOT = ${WORKTREE}`), `${label} must know where it writes`)
    assert.match(call.prompt, /git rev-parse --show-toplevel/, `${label} must verify it before writing`)
  }

  const impl = calls.find((c) => (c.opts.label ?? '').startsWith('Onda 1'))
  assert.match(impl.prompt, /re-anchor it under WORKTREE_ROOT/, 'plan paths written as absolute belong to another checkout')
})

test('run-waves stops the run when a wave was written into another checkout', async () => {
  const { result, calls } = await runWorkflow('docs/plans/x.md', [
    [PARSE, twoWavePlan],
    ['commit Onda 1', { status: 'PARTIAL_WAVE', missingReported: ['src/b.ts'] }],
    ['commit Onda', okCommit],
    ['Onda', doneImplementer],
    [SPEC_REVIEW, { findings: [] }],
    [GAP_REVIEW, { findings: [] }],
  ])

  assert.ok(result.stopped, 'a wave whose files are not in this checkout is a partial wave')
  assert.match(result.stopped.blockers[0].blocker, /src\/b\.ts/)
  assert.match(result.stopped.blockers[0].blocker, new RegExp(WORKTREE))
  assert.equal(result.wavesCommitted.length, 0, 'nothing may be committed from a fractured wave')
  assert.equal(
    calls.filter((call) => (call.opts.label ?? '').startsWith('Onda 2')).length,
    0,
    'downstream waves consume contracts this one did not land',
  )
})

test('run-waves records a declared-but-untouched file as a concern rather than a stop', async () => {
  let artifactPrompt = ''
  const { result } = await runWorkflow('docs/plans/x.md', [
    [PARSE, twoWavePlan],
    ['commit Onda 1', { ...okCommit, missingDeclared: ['prisma/schema.prisma'] }],
    ['commit Onda', okCommit],
    ['Onda', doneImplementer],
    [SPEC_REVIEW, { findings: [] }],
    [GAP_REVIEW, { findings: [] }],
    [
      WRITE_FOLLOWUPS,
      (prompt) => {
        artifactPrompt = prompt
        return { path: 'docs/plans/x.followups.md', automatable: [], manual: [] }
      },
    ],
  ])

  assert.ok(!result.stopped, 'a file nobody claimed to write is a planning gap, not a fracture')
  assert.match(artifactPrompt, /prisma\/schema\.prisma/)
})

test('run-waves pins the spec reviewer to general-purpose instead of the default subagent', async () => {
  const { calls } = await runWorkflow('docs/plans/x.md', [
    [PARSE, twoWavePlan],
    ['commit Onda', okCommit],
    ['Onda', doneImplementer],
    [SPEC_REVIEW, { findings: [] }],
    [GAP_REVIEW, { findings: [] }],
  ])

  for (const review of calls.filter((call) => (call.opts.label ?? '').startsWith('spec review'))) {
    assert.equal(review.opts.agentType, 'general-purpose', 'prose-execution.md declares it explicitly')
  }
  assert.equal(
    calls.filter((call) => (call.opts.label ?? '').startsWith('code review')).length,
    0,
    'per-wave code review was removed — /code-review over the branch covers that axis',
  )
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
    [GAP_REVIEW, { findings: [] }],
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
    [GAP_REVIEW, { findings: [] }],
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
    [GAP_REVIEW, { findings: [] }],
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
    [GAP_REVIEW, { findings: [] }],
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
    [GAP_REVIEW, { findings: [] }],
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
    [GAP_REVIEW, { findings: [] }],
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
    ['fix ', { filesTouched: ['src/a.ts'], fixed: ['done'], skipped: [] }],
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
  assert.equal(result.followupCommit.sha, 'shaF', 'fixes that touched files must be committed')

  const commit = calls.find((call) => (call.opts.label ?? '') === 'commit follow-ups')
  assert.match(commit.prompt, /src\/a\.ts/, 'the commit agent gets the file list, not the fixers transcript')
  assert.doesNotMatch(commit.prompt, /verification output/i, 'raw fixer output must not be paid for here')
})

test('run-waves skips the follow-up commit and review when nothing was automatable', async () => {
  const { result, calls } = await runWorkflow('docs/plans/x.md', [
    [PARSE, twoWavePlan],
    ['commit Onda', okCommit],
    ['Onda', doneImplementer],
    // one finding, so the artifact is written at all; it resolves to manual-only below
    [SPEC_REVIEW, { findings: [{ tipo: 'spec-deferred', descricao: 'nit', ref: 'src/a.ts:3' }] }],
    [GAP_REVIEW, { findings: [] }],
    [
      WRITE_FOLLOWUPS,
      { path: 'docs/plans/x.followups.md', automatable: [], manual: ['rodar migration em produção'] },
    ],
  ])

  assert.equal(result.followupCommit, null)
  assert.deepEqual(result.manualActions, ['rodar migration em produção'])

  for (const label of ['commit follow-ups', 'fix ']) {
    assert.equal(
      calls.filter((call) => (call.opts.label ?? '').startsWith(label)).length,
      0,
      `${label} must not spawn when there is nothing staged`,
    )
  }
})

test('run-waves keeps raw verification output out of the spec reviewer prompt', async () => {
  const noisy = {
    status: 'DONE',
    filesTouched: ['src/a.ts'],
    behaviorChanged: 'endpoint responds 201',
    verification: 'PASS src/a.spec.ts\n'.repeat(200),
    concerns: ['arquivo crescendo demais — src/a.ts:1'],
  }

  const { calls } = await runWorkflow('docs/plans/x.md', [
    [PARSE, twoWavePlan],
    ['commit Onda', okCommit],
    ['Onda', noisy],
    [SPEC_REVIEW, { findings: [] }],
    [GAP_REVIEW, { findings: [] }],
    [WRITE_FOLLOWUPS, { path: 'docs/plans/x.followups.md', automatable: [], manual: [] }],
  ])

  const review = calls.find((call) => (call.opts.label ?? '').startsWith('spec review'))
  assert.doesNotMatch(review.prompt, /PASS src\/a\.spec\.ts/, 'runner transcript must not be pasted in')
  assert.match(review.prompt, /endpoint responds 201/, 'the claim itself still reaches the reviewer')
  assert.match(review.prompt, /arquivo crescendo demais/, 'concerns still reach the reviewer')
  assert.match(review.prompt, /status: DONE/)
})

test('run-waves carries `## Pos-execucao` items into the follow-ups artifact', async () => {
  let sawPosExecucao = false

  const { result } = await runWorkflow({ planPath: 'docs/plans/x.md' }, [
    [PARSE, { ...twoWavePlan, posExecucao: ['medir p95'] }],
    ['commit Onda', okCommit],
    ['Onda', doneImplementer],
    [SPEC_REVIEW, { findings: [] }],
    [GAP_REVIEW, { findings: [] }],
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
  assert.match(prose, /What happens to the Role/)
  assert.match(prose, /declared explicitly, never left to the default/)
  assert.match(prose, /This file is normative/i)
  assert.match(prose, /Step 1 lives in `SKILL\.md`/)

  assert.match(implementer, /One dispatch per task/)
  assert.match(implementer, /Files You Own/)
  assert.match(implementer, /Never let an implementer commit/)
})

test('both planners declare the same Execution Contract the executor extracts', () => {
  const nestjsPlan = readFileSync(resolve(root, 'plugins/nimbou-skills/skills/nestjs-plan/SKILL.md'), 'utf8')
  const nuxtPlan = readFileSync(resolve(root, 'plugins/nimbou-skills/skills/nuxt-plan/SKILL.md'), 'utf8')
  const planFormat = readFileSync(
    resolve(root, 'plugins/nimbou-skills/skills/nuxt-plan/reference/plan-format.md'),
    'utf8',
  )

  for (const [name, plan] of [['nestjs-plan', nestjsPlan], ['nuxt-plan', nuxtPlan]]) {
    assert.match(plan, /## Execution Contract/, `${name} should declare the contract`)
    for (const field of ['\\*\\*Role:\\*\\*', '\\*\\*Onda:\\*\\*', '\\*\\*Files:\\*\\*', '\\*\\*Consome:\\*\\*', '\\*\\*Verificação:\\*\\*']) {
      assert.match(plan, new RegExp(field), `${name} should declare ${field}`)
    }
    assert.match(plan, /`Consome` is mandatory from Onda 2 on/, `${name} should require consumed contracts`)
    assert.match(plan, /Do \*\*not\*\* add a commit step to a task/, `${name} must not ask tasks to commit`)
  }

  // The per-task commit contradicted executing-plans, which commits once per wave.
  assert.doesNotMatch(nestjsPlan, /Step 5: Commit/)
  assert.doesNotMatch(nestjsPlan, /git add <exact files> && git commit/)

  assert.match(planFormat, /Execution Contract per task/)
  assert.match(planFormat, /Consome/)
})

test('the parser reads the contract fields instead of re-deriving them', () => {
  assert.match(source, /Read those fields; do not\s*\n?re-derive them from the prose/)
  assert.match(source, /the \\`\*\*Files:\*\*\\` field, split on commas/)
  assert.match(source, /the \\`\*\*Verificação:\*\*\\` field, verbatim/)
  // The FAIL-expecting run used to be excluded from extraction, which is what made
  // the Iron Law unenforceable: nothing downstream could tell a test-driven task
  // from one that wrote test and implementation together. It is now its own field.
  assert.match(source, /the \\`\*\*RED:\*\*\\` field, verbatim/)
  assert.match(source, /must never be merged into it/, 'RED and Verificação are separate fields')
  assert.match(source, /Never\s*\n?invent a \\`consumes\\` value/)
  assert.match(source, /Assign each task to a wave by its \\`\*\*Onda:\*\*\\` field/)
})

test('the prose path treats an empty Consome in a later wave as a planning bug', () => {
  const prose = readFileSync(
    resolve(root, 'plugins/nimbou-skills/skills/executing-plans/prose-execution.md'),
    'utf8',
  )

  assert.match(prose, /Execution Contract/)
  assert.match(prose, /is a planning bug, not an empty dependency/)
  assert.match(prose, /reconstruct\s*\n?the contract from the earlier wave's committed diff/)
})

test('fullstack-plan composes the platform planners instead of duplicating them', () => {
  const plan = readFileSync(resolve(root, 'plugins/nimbou-skills/skills/fullstack-plan/SKILL.md'), 'utf8')

  assert.match(plan, /^---\nname: fullstack-plan/m)

  // The reason the skill exists: the frontend waits on the contract, not on the backend.
  assert.match(plan, /a frontend task depends on the \*\*approved contract\*\*, never on a backend task/i)
  assert.match(plan, /## The Dependency Rule/)
  assert.match(plan, /openapi\.yaml/)
  assert.match(plan, /end-to-end verification/i, 'the one real cross-stack dependency must be named')
  assert.match(plan, /Unbalanced sides are normal and correct/)

  // It must emit what the executor extracts.
  for (const field of ['\\*\\*Role:\\*\\*', '\\*\\*Onda:\\*\\*', '\\*\\*Files:\\*\\*', '\\*\\*Consome:\\*\\*', '\\*\\*Verificação:\\*\\*']) {
    assert.match(plan, new RegExp(field), `fullstack-plan should carry ${field}`)
  }
  assert.match(plan, /No task declares a commit step/)

  // Composition, not a third copy: it defers platform rules and says so.
  assert.match(plan, /It does \*\*not\*\* restate platform rules/)
  assert.match(plan, /the platform planner wins/)
  assert.doesNotMatch(plan, /\| `nimbou-skills:prisma-schema-author` \|/, 'Role tables belong to the platform planners')
  assert.doesNotMatch(plan, /\| `nimbou-skills:vue-component-author` \|/, 'Role tables belong to the platform planners')
})

test('the pipeline routes cross-stack work to fullstack-plan', () => {
  const read = (p) => readFileSync(resolve(root, `plugins/nimbou-skills/skills/${p}/SKILL.md`), 'utf8')

  assert.match(read('feat-spec'), /planning ends in `fullstack-plan`, not in the platform planners/)
  assert.match(read('change-spec'), /hand the wave structure to `nimbou-skills:fullstack-plan`/)

  for (const skill of ['nestjs-think', 'nuxt-think']) {
    assert.match(
      read(skill),
      /when the work spans both stacks, that planning step is `fullstack-plan`/,
      `${skill} should branch to the joint planner`,
    )
  }

  // Single-platform routing must survive untouched.
  assert.match(read('nestjs-think'), /invoke `nestjs-plan`/)
  assert.match(read('nuxt-think'), /invoke `nuxt-plan`/)
})

test('code review is not part of executing-plans on either path', () => {
  const skillDir = 'plugins/nimbou-skills/skills/executing-plans'
  const skill = readFileSync(resolve(root, `${skillDir}/SKILL.md`), 'utf8')
  const prose = readFileSync(resolve(root, `${skillDir}/prose-execution.md`), 'utf8')
  const followups = readFileSync(resolve(root, `${skillDir}/followups-template.md`), 'utf8')

  // The workflow must spawn no code reviewer at all.
  assert.doesNotMatch(source, /nimbou-skills:code-reviewer/)
  assert.doesNotMatch(source, /code review \$\{label\}/)
  assert.doesNotMatch(source, /review follow-ups/)

  // Both harness paths must say so, and say why the spec reviewer is not the same thing.
  for (const [name, doc] of [['SKILL.md', skill], ['prose-execution.md', prose]]) {
    assert.match(doc, /\/code-review/, `${name} should point at the branch-level review`)
    assert.doesNotMatch(doc, /nimbou-skills:code-reviewer/, `${name} should not dispatch a code reviewer`)
  }
  assert.match(prose, /Full `\/code-review` is not part of this skill/)
  // Two lenses replaced it, and the prose must stay honest about what neither covers.
  assert.match(prose, /guidelines-gap-analyzer/)
  assert.match(prose, /TDD does not find the test you never thought to write/)

  // The boundary lens is dispatched by its agent type, not as a generic subagent.
  assert.match(source, /agentType: 'nimbou-skills:guidelines-gap-analyzer'/)

  // The artifact keeps review-* types, but as something the user appends.
  assert.match(followups, /`executing-plans` never writes these/)
  assert.match(prose, /this skill never writes them/)
})

test('run-waves hands implementers a plan line range instead of the task text', async () => {
  const { calls } = await runWorkflow('docs/plans/x.md', [
    [PARSE, twoWavePlan],
    ['commit Onda', okCommit],
    ['Onda', doneImplementer],
    [SPEC_REVIEW, { findings: [] }],
    [WRITE_FOLLOWUPS, { path: 'docs/plans/x.followups.md', automatable: [], manual: [] }],
  ])

  const dto = calls.find((call) => (call.opts.label ?? '').includes('DTO'))
  // start 10, end 20 -> offset 10, limit 11. Re-emitting the task body as parse
  // output is the single largest token cost in the run; the range replaces it.
  // The path is absolute for the same reason every write path is: a relative one
  // resolves against whatever directory the implementer happened to inherit.
  assert.match(dto.prompt, new RegExp(`Read\\("${WORKTREE}/docs/plans/x\\.md", offset: 10, limit: 11\\)`))
  assert.match(dto.prompt, /Grep` the plan for the heading/, 'drifted ranges need a recovery path')

  const review = calls.find((call) => (call.opts.label ?? '').startsWith('spec review'))
  assert.match(review.prompt, new RegExp(`Read\\("${WORKTREE}/docs/plans/x\\.md", offset: 10, limit: 11\\)`))
  assert.match(review.prompt, new RegExp(`Read\\("${WORKTREE}/docs/plans/x\\.md", offset: 21, limit: 10\\)`))
})

test('run-waves tiers its inline agents by category instead of inheriting the session model', async () => {
  const { calls } = await runWorkflow('docs/plans/x.md', [
    [PARSE, twoWavePlan],
    ['commit Onda', okCommit],
    ['Onda', doneImplementer],
    // A finding is required here: with nothing pending, the run returns before the
    // follow-ups phase and the artifact agent is never dispatched.
    [SPEC_REVIEW, { findings: [{ tipo: 'spec-deferred', descricao: 'nit', ref: 'src/a.ts:3' }] }],
    [WRITE_FOLLOWUPS, { path: 'docs/plans/x.followups.md', automatable: [], manual: [] }],
  ])

  const byLabel = (prefix) => calls.filter((call) => (call.opts.label ?? '').startsWith(prefix))

  // Mechanical work: git plumbing and structured extraction. On an opus session
  // these were a full opus agent each, once per wave.
  assert.equal(byLabel('parse-plan')[0].opts.model, 'haiku')
  for (const commit of byLabel('commit ')) assert.equal(commit.opts.model, 'haiku')
  assert.equal(byLabel('write followups')[0].opts.model, 'haiku')

  // Judgement work stays pinned up.
  for (const review of byLabel('spec review')) assert.equal(review.opts.model, 'opus')

  // The boundary lens carries no inline model: `guidelines-gap-analyzer` declares
  // its own tier, and overriding it here would silently outrank the agent file.
  const boundary = byLabel('boundary review')
  assert.equal(boundary.length, 1, 'exactly one boundary pass per run')
  assert.equal(boundary[0].opts.agentType, 'nimbou-skills:guidelines-gap-analyzer')
  assert.equal(boundary[0].opts.model, undefined)
})

test('run-waves re-runs only the verifications an implementer failed to evidence', async () => {
  const shown = { status: 'DONE', filesTouched: ['src/a.ts'], verification: 'PASS src/a.spec.ts\n'.repeat(50) }
  const claimed = { status: 'DONE', filesTouched: ['src/b.ts'], verification: 'passou' }

  const { calls } = await runWorkflow('docs/plans/x.md', [
    [PARSE, twoWavePlan],
    ['commit Onda', okCommit],
    ['Onda 1 — Contratos · DTO', shown],
    ['Onda 1 — Contratos · Repo contract', claimed],
    ['Onda', shown],
    [SPEC_REVIEW, { findings: [] }],
    [WRITE_FOLLOWUPS, { path: 'docs/plans/x.followups.md', automatable: [], manual: [] }],
  ])

  const wave1 = calls.find((call) => (call.opts.label ?? '') === 'commit Onda 1 — Contratos')
  assert.match(wave1.prompt, /pnpm test -- b/, 'the bare claim must be re-verified')
  assert.doesNotMatch(wave1.prompt, /pnpm test -- a/, 're-running a proven suite doubles the wave on the critical path')

  const wave2 = calls.find((call) => (call.opts.label ?? '') === 'commit Onda 2 — Implementação')
  assert.match(wave2.prompt, /Skip verification/, 'a fully evidenced wave re-runs nothing')
})

// ── Browser smoke (Step 5) ───────────────────────────────────────────────────
//
// The last lens of the run, and the only one that looks at the application
// instead of at its source. It runs after the follow-up commits, on the state the
// branch actually ends in.

const SMOKE = /browser-smoke/
const frontPlan = JSON.parse(JSON.stringify(twoWavePlan))
frontPlan.planOrigin = 'nuxt-plan'
frontPlan.waves[1].tasks[0].files = ['components/AttachmentCard.vue']
const frontImplementer = { status: 'DONE', filesTouched: ['components/AttachmentCard.vue'], verification: 'pass' }
const cleanSmoke = { status: 'PASS', driver: 'chrome-devtools', flows: 3, findings: [] }

test('run-waves skips the browser smoke when no wave touched the frontend', async () => {
  const { result, calls } = await runWorkflow('docs/plans/x.md', [
    [PARSE, twoWavePlan],
    ['commit Onda', okCommit],
    ['Onda', doneImplementer],
    [SPEC_REVIEW, { findings: [] }],
    [GAP_REVIEW, { findings: [] }],
  ])

  assert.equal(calls.filter((call) => SMOKE.test(call.prompt)).length, 0, 'a backend-only plan has nothing to look at')
  assert.equal(result.browserSmoke, null)
})

test('run-waves smokes the browser when a wave touched frontend files', async () => {
  const { result, calls } = await runWorkflow('docs/plans/x.md', [
    [PARSE, frontPlan],
    ['commit Onda', okCommit],
    ['Onda 2', frontImplementer],
    ['Onda', doneImplementer],
    ['browser smoke', cleanSmoke],
    [SPEC_REVIEW, { findings: [] }],
    [GAP_REVIEW, { findings: [] }],
  ])

  const smoke = calls.find((call) => (call.opts.label ?? '').startsWith('browser smoke'))
  assert.ok(smoke, 'a .vue in the committed diff is the trigger')
  assert.match(smoke.prompt, /nimbou-skills:browser-smoke/, 'the workflow delegates to the skill, not to an inline recipe')
  assert.match(smoke.prompt, /report/, 'the workflow owns the fix cycle, so the skill must not fix')
  assert.match(smoke.prompt, new RegExp(`WORKTREE_ROOT = ${WORKTREE}`), 'the dev server must serve this checkout')
  assert.match(smoke.prompt, new RegExp(`${WORKTREE}/docs/plans/x\\.md`), 'flows are derived from the plan text')
  assert.equal(result.browserSmoke.status, 'PASS')
})

test('run-waves treats a skipped smoke as a concern instead of a failure', async () => {
  let artifactPrompt = ''
  const { result, calls } = await runWorkflow('docs/plans/x.md', [
    [PARSE, frontPlan],
    ['commit Onda', okCommit],
    ['Onda 2', frontImplementer],
    ['Onda', doneImplementer],
    ['browser smoke', { status: 'SKIPPED', driver: 'none', concerns: ['nenhum driver de browser disponível'] }],
    [SPEC_REVIEW, { findings: [] }],
    [GAP_REVIEW, { findings: [] }],
    ['record browser', okCommit],
  ])

  assert.equal(result.browserSmoke.status, 'SKIPPED')
  const record = calls.find((call) => (call.opts.label ?? '').startsWith('record browser'))
  assert.match(record.prompt, /nenhum driver de browser disponível/, 'a lens that did not run must be visible')
  assert.equal(
    calls.filter((call) => (call.opts.label ?? '').startsWith('fix browser')).length,
    0,
    'a skipped smoke found nothing, so there is nothing to fix',
  )
})

test('run-waves reopens the fix cycle for smoke findings and stops after two rounds', async () => {
  const failing = {
    status: 'FAIL',
    driver: 'chrome-devtools',
    flows: 2,
    findings: [
      {
        flow: 'anexar arquivo e ver o thumbnail',
        descricao: 'card renderiza sem thumbnail',
        files: ['components/AttachmentCard.vue'],
        verification: 'pnpm test -- AttachmentCard',
      },
    ],
  }

  const { result, calls } = await runWorkflow('docs/plans/x.md', [
    [PARSE, frontPlan],
    ['commit Onda', okCommit],
    ['Onda 2', frontImplementer],
    ['Onda', doneImplementer],
    ['browser smoke', failing],
    ['fix browser', { filesTouched: ['components/AttachmentCard.vue'], fixed: ['thumbnail'] }],
    ['commit browser', okCommit],
    ['record browser', okCommit],
    [SPEC_REVIEW, { findings: [] }],
    [GAP_REVIEW, { findings: [] }],
  ])

  const smokes = calls.filter((call) => (call.opts.label ?? '').startsWith('browser smoke'))
  assert.equal(smokes.length, 2, 'one smoke, one re-check after the fix — and no third')
  assert.match(smokes[1].prompt, /anexar arquivo e ver o thumbnail/, 'the re-check runs the failing flows, not all of them')

  assert.equal(calls.filter((call) => (call.opts.label ?? '').startsWith('fix browser')).length, 1)
  assert.ok(calls.find((call) => (call.opts.label ?? '').startsWith('commit browser')), 'UI fixes get their own commit')

  const record = calls.find((call) => (call.opts.label ?? '').startsWith('record browser'))
  assert.match(record.prompt, /browser-issue/, 'what survived two rounds is a follow-up, not a silent pass')
  assert.match(record.prompt, /card renderiza sem thumbnail/)
  assert.equal(result.browserSmoke.status, 'FAIL')
})

test('run-waves runs the smoke even when the plan produced no follow-ups at all', async () => {
  const { result, calls } = await runWorkflow('docs/plans/x.md', [
    [PARSE, frontPlan],
    ['commit Onda', okCommit],
    ['Onda 2', frontImplementer],
    ['Onda', doneImplementer],
    ['browser smoke', cleanSmoke],
    [SPEC_REVIEW, { findings: [] }],
    [GAP_REVIEW, { findings: [] }],
  ])

  assert.equal(result.followups, null, 'nothing was pending')
  assert.ok(
    calls.find((call) => (call.opts.label ?? '').startsWith('browser smoke')),
    'a clean plan is exactly the one nobody checks on screen',
  )
  assert.equal(result.browserSmoke.status, 'PASS')
})

test('run-waves does not smoke a run that stopped before finishing', async () => {
  const { calls } = await runWorkflow('docs/plans/x.md', [
    [PARSE, frontPlan],
    ['commit Onda 1', { status: 'PARTIAL_WAVE', missingReported: ['src/b.ts'] }],
    ['commit Onda', okCommit],
    ['Onda', frontImplementer],
    ['browser smoke', cleanSmoke],
  ])

  assert.equal(
    calls.filter((call) => (call.opts.label ?? '').startsWith('browser smoke')).length,
    0,
    'smoking a half-executed plan reports defects the plan never finished building',
  )
})
