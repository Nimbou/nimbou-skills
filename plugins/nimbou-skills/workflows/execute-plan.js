export const meta = {
  name: 'execute-plan',
  description: 'Execute an approved wave-structured plan: tasks in parallel per wave, one commit per wave, non-blocking reviews, follow-ups at the end',
  whenToUse:
    'After nimbou-skills:executing-plans Step 1 has loaded and approved a wave-structured plan. Pass the plan path as args. Step 1 stays in conversation — this script cannot ask the user anything mid-run.',
  phases: [
    { title: 'Parse', detail: 'read the plan and extract waves, tasks, file boundaries' },
    { title: 'Implement', detail: 'one implementer per task, parallel inside each wave' },
    { title: 'Commit', detail: 'one commit per wave, staged explicitly' },
    { title: 'Review', detail: 'spec compliance + code review per wave, non-blocking' },
    { title: 'Follow-ups', detail: 'collect findings, write the artifact, fix by file group' },
  ],
}

// This script mirrors Steps 2-4 of the `nimbou-skills:executing-plans` skill.
// The skill is normative; when the two disagree, the skill wins.
//
// Contract with the caller:
//   args = 'docs/plans/foo.md'  |  { planPath: 'docs/plans/foo.md' }
// Step 1 (critical plan review, blocker raising, refusing a plan without
// `## Ondas de Execução`) happens in conversation before this runs — a workflow
// takes no user input mid-run.

const planPath = typeof args === 'string' ? args : args?.planPath

if (!planPath) {
  return { error: 'No plan path. Call with args: "docs/plans/<plan>.md" (or { planPath }).' }
}

const PLAN_SCHEMA = {
  type: 'object',
  required: ['waves'],
  properties: {
    planOrigin: { type: 'string', description: 'nestjs-plan | nuxt-plan | other' },
    waveStructured: { type: 'boolean' },
    posExecucao: { type: 'array', items: { type: 'string' } },
    waves: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'tasks'],
        properties: {
          title: { type: 'string' },
          isNestjsTestWave: {
            type: 'boolean',
            description: 'true when this wave dispatches nimbou-skills:nestjs-test as the final verification',
          },
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              required: ['title', 'spec', 'files', 'verification'],
              properties: {
                title: { type: 'string' },
                spec: { type: 'string', description: 'full task text, verbatim from the plan' },
                files: { type: 'array', items: { type: 'string' }, description: 'files this task writes' },
                verification: { type: 'string', description: 'declared verification command, verbatim' },
                consumes: { type: 'string', description: 'contracts from earlier waves this task depends on' },
                agentType: { type: 'string', description: 'role-specialized agent named by the plan, if any' },
              },
            },
          },
        },
      },
    },
  },
}

const IMPL_SCHEMA = {
  type: 'object',
  required: ['status', 'filesTouched', 'verification'],
  properties: {
    status: { type: 'string', enum: ['DONE', 'DONE_WITH_CONCERNS', 'BLOCKED'] },
    filesTouched: { type: 'array', items: { type: 'string' } },
    behaviorChanged: { type: 'string' },
    verification: { type: 'string', description: 'command run and its actual output' },
    concerns: { type: 'array', items: { type: 'string' } },
    blocker: { type: 'string' },
  },
}

const COMMIT_SCHEMA = {
  type: 'object',
  required: ['sha', 'message'],
  properties: { sha: { type: 'string' }, message: { type: 'string' } },
}

const REVIEW_SCHEMA = {
  type: 'object',
  required: ['findings'],
  properties: {
    status: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['tipo', 'descricao'],
        properties: {
          tipo: {
            type: 'string',
            enum: ['spec-issue', 'spec-deferred', 'review-critical', 'review-important', 'review-minor'],
          },
          descricao: { type: 'string' },
          ref: { type: 'string', description: 'file:line when applicable' },
          proximoPasso: { type: 'string' },
        },
      },
    },
  },
}

// ── Parse ────────────────────────────────────────────────────────────────────

phase('Parse')

const plan = await agent(
  `Read the plan at \`${planPath}\` and extract its execution structure.

Waves live under \`## Ondas de Execução\` (or the legacy \`## Grupos de Execucao\`).
Set waveStructured to false if neither heading exists — do not invent waves from a
serial task list.

For every task in every wave, return:
- title
- spec: the task's FULL text, verbatim. Do not summarize or compress it — an
  implementer subagent with none of this context will be handed this string as
  its entire specification.
- files: every file the task creates or modifies
- verification: the task's declared verification command, verbatim
- consumes: the contracts (types, signatures, routes, DTOs, schema fields) this
  task depends on from earlier waves. For waves after the first, paste the actual
  declarations from the plan, not references to them.
- agentType: the Role slug the plan declared for this task — the \`**Role:**\` line
  in a nestjs-plan task, or the \`Role\` column of the \`## Arquivos\` row in a
  nuxt-plan. Copy it verbatim, including the \`nimbou-skills:\` prefix. Omit the
  field entirely when the plan declared no Role; never infer one from the file
  path, since the fallback to general-purpose is what surfaces the planning bug.

Set isNestjsTestWave on a wave whose job is to dispatch
\`nimbou-skills:nestjs-test\` as the plan's final verification. Only the last wave
can be one. Set it to false everywhere else — a wave that merely contains some
test tasks is not the final verification wave.

Also return planOrigin (nestjs-plan / nuxt-plan / other) and posExecucao: the
verbatim items under \`## Pos-execucao\` when that section exists.

Read only. Change nothing.`,
  { label: 'parse-plan', schema: PLAN_SCHEMA },
)

if (!plan) return { error: `Could not parse ${planPath}.` }
if (plan.waveStructured === false) {
  return {
    error: `${planPath} has no \`## Ondas de Execução\`. Regenerate it via nimbou-skills:nestjs-plan or nimbou-skills:nuxt-plan before executing.`,
  }
}

const waves = plan.waves ?? []
const taskCount = waves.reduce((n, w) => n + (w.tasks?.length ?? 0), 0)
log(`${waves.length} waves, ${taskCount} tasks. Waves run in order; tasks inside a wave run in parallel.`)

// ── Execute ──────────────────────────────────────────────────────────────────

const reviews = [] // fired per wave, never awaited until the end
const executed = []
const concerns = []
let stoppedAt = null

for (let w = 0; w < waves.length; w++) {
  const wave = waves[w]
  const label = `Onda ${w + 1} — ${wave.title}`
  const tasks = wave.tasks ?? []

  // Step 2.1: write-set check. Tasks sharing a file are not parallel-safe
  // whatever the plan says — they go to one implementer, not two.
  const owner = new Map()
  const groups = []
  for (const task of tasks) {
    const collidesWith = (task.files ?? []).map(f => owner.get(f)).find(g => g !== undefined)
    let index
    if (collidesWith === undefined) {
      index = groups.push([task]) - 1
    } else {
      index = collidesWith
      concerns.push(
        `${label}: "${task.title}" shares a file with "${groups[index][0].title}" — merged into one implementer. The plan declared them parallel; it should not have.`,
      )
      groups[index].push(task)
    }
    for (const f of task.files ?? []) owner.set(f, index)
  }

  // A nestjs-test wave carries no Role by contract — it routes through the test
  // auditors, not through implementers. Only other waves owe one.
  const unrouted = wave.isNestjsTestWave ? [] : tasks.filter(t => !t.agentType)

  phase('Implement')
  log(
    `${label}: ${groups.length} implementer(s) for ${tasks.length} task(s)` +
      (unrouted.length ? ` — ${unrouted.length} without a declared Role, falling back to general-purpose` : ''),
  )
  for (const task of unrouted) {
    concerns.push(`${label}: "${task.title}" declared no Role; dispatched as general-purpose.`)
  }

  const reports = await parallel(
    groups.map(group => () =>
      agent(implementerPrompt(group, label), {
        label: `${label} · ${group.map(t => t.title).join(' + ')}`,
        phase: 'Implement',
        schema: IMPL_SCHEMA,
        ...(group.length === 1 && group[0].agentType ? { agentType: group[0].agentType } : {}),
      }),
    ),
  )

  for (const r of reports) {
    for (const c of r?.concerns ?? []) concerns.push(`${label}: ${c}`)
  }

  const blocked = reports.map((r, i) => ({ r, group: groups[i] })).filter(({ r }) => !r || r.status === 'BLOCKED')
  if (blocked.length) {
    stoppedAt = {
      wave: label,
      blockers: blocked.map(({ r, group }) => ({
        tasks: group.map(t => t.title),
        blocker: r?.blocker ?? 'implementer returned no result',
      })),
    }
    log(`${label} BLOCKED — not committing a partial wave, downstream waves stopped.`)
    break
  }

  // Step 2.4: commit once per wave.
  phase('Commit')
  const files = [...new Set(reports.flatMap(r => r.filesTouched ?? []))]
  const commit = await agent(
    `Commit exactly one wave of an approved plan.

Wave: ${label}
Tasks included:
${tasks.map(t => `- ${t.title}`).join('\n')}

Files reported as touched by the implementers:
${files.map(f => `- ${f}`).join('\n')}

Do this:
1. Run \`git status --porcelain\` and compare against the list above. Report any
   file changed that no implementer declared — an implementer wrote outside its
   boundary. Do NOT revert it; record it and carry on.
2. Re-run the wave's declared verifications if any implementer's output looks
   claimed rather than shown. Run them exactly as written below. Never widen to
   an unfiltered suite run (no bare \`pnpm test\`, \`npm test\`, \`pytest\`).
${tasks.map(t => `   - ${t.verification}`).join('\n')}
3. Stage the wave's files EXPLICITLY by path. Never \`git add -A\`.
4. Read \`git log\` on the current branch and mirror its message style. Reference
   the wave and list the tasks included.
5. Commit, then return the resulting SHA and the message you used.

Do not push. Do not commit anything outside this wave.`,
    { label: `commit ${label}`, phase: 'Commit', schema: COMMIT_SCHEMA },
  )

  if (!commit) {
    stoppedAt = { wave: label, blockers: [{ tasks: ['<commit>'], blocker: 'commit agent returned no result' }] }
    break
  }

  executed.push({
    wave: label,
    sha: commit.sha,
    message: commit.message,
    tasks: tasks.map(t => t.title),
    files,
  })

  // Step 2.5: reviewers are advisory and must not gate the next wave. Start them
  // without awaiting — they run alongside wave w+1 and are collected at the end.
  dispatchReviewers(
    label,
    commit.sha,
    tasks.map((t, i) => `### Task ${i + 1} — ${t.title}\n\n${t.spec}`).join('\n\n'),
    reports
      .map((r, i) => `### ${groups[i].map(t => t.title).join(' + ')}\n${JSON.stringify(r, null, 2)}`)
      .join('\n\n'),
  )
}

// Step 2.6: a plan from nestjs-plan MUST end with a nestjs-test wave scoped to
// the files it changed. When the plan author forgot it, the executor adds it —
// shipping a backend plan without its verification wave is not an option.
if (!stoppedAt && plan.planOrigin === 'nestjs-plan' && !waves.some(w => w.isNestjsTestWave)) {
  const label = 'Onda Final — Verificação (nestjs-test)'
  concerns.push(
    `${label}: the plan came from nestjs-plan but declared no final nestjs-test wave. The executor added it. Fix the plan.`,
  )
  log(`${label}: missing from the plan, adding it.`)

  const touched = [...new Set(executed.flatMap(e => e.files ?? []))]

  phase('Implement')
  const testReport = await agent(
    `Run the plan's final verification wave using \`nimbou-skills:nestjs-test\`.

The plan at \`${planPath}\` came from \`nestjs-plan\` but declared no final
verification wave. You are that wave.

Scope: ONLY what this plan changed across every wave — these files and nothing
else:

${touched.map(f => `- ${f}`).join('\n')}

Do this:
1. Derive the explicit suite/file paths that cover those files — the controllers,
   use-cases, repositories, Prisma adapters, and migrations they contain.
2. Invoke the runner with those paths and nothing wider, e.g.
   \`pnpm test -- --runInBand <suite-path>\`.
3. An unfiltered \`pnpm test\` is forbidden. If you cannot derive a scoped path
   set, report BLOCKED rather than widening the run.
4. Stabilize or expand only the suites covering the files above.

Do NOT commit — the caller commits this wave. Report status, the files you touched,
and the actual runner output.`,
    { label, phase: 'Implement', schema: IMPL_SCHEMA, agentType: 'general-purpose' },
  )

  if (!testReport || testReport.status === 'BLOCKED') {
    stoppedAt = {
      wave: label,
      blockers: [{ tasks: ['nestjs-test'], blocker: testReport?.blocker ?? 'nestjs-test wave returned no result' }],
    }
  } else {
    for (const c of testReport.concerns ?? []) concerns.push(`${label}: ${c}`)

    phase('Commit')
    const testFiles = testReport.filesTouched ?? []
    const testCommit = testFiles.length
      ? await agent(
          `Commit the final verification wave for the plan at \`${planPath}\`.

Files touched by the nestjs-test wave:
${testFiles.map(f => `- ${f}`).join('\n')}

Stage them EXPLICITLY by path — never \`git add -A\`. Mirror the repo's commit
style from \`git log\`. Do not push. Return the SHA and message.`,
          { label: `commit ${label}`, phase: 'Commit', schema: COMMIT_SCHEMA },
        )
      : null

    if (testCommit) {
      executed.push({
        wave: label,
        sha: testCommit.sha,
        message: testCommit.message,
        tasks: ['nestjs-test'],
        files: testFiles,
      })
      dispatchReviewers(label, testCommit.sha, 'Final verification wave: scoped nestjs-test run.', JSON.stringify(testReport, null, 2))
    } else {
      log(`${label}: green with no file changes, nothing to commit.`)
    }
  }
}

function dispatchReviewers(label, sha, requested, reported) {
  reviews.push(
    agent(
      `You are reviewing whether a wave's implementation matches its specification.
Follow the spec compliance reviewer contract in the \`nimbou-skills:executing-plans\`
skill (\`spec-reviewer-prompt.md\`).

The work was performed by one implementer subagent per task, running in parallel.
Each reported its own task done and the wave was committed on that basis. Do not
trust the reports — read the diff.

Parallel implementers introduce failure modes a single executor does not have.
Check specifically for: two tasks that independently redefined the same type or
helper; a task that wrote outside its declared files; an earlier wave's contract
re-declared with a different shape by one task; a gap each task assumed the other
would close.

## What Was Requested

${requested}

## What the Implementers Claim Was Changed

${reported}

## Diff Under Review

Run \`git show ${sha}\` and open the touched files at \`file:line\` to confirm
context. Review only this commit.

Return findings as \`spec-issue\` (Missing / Extra / Misunderstanding) or
\`spec-deferred\` (out-of-scope nits, nearby pre-existing issues). Every finding
carries a concrete \`file:line\` and a suggested next step. Vague findings are not
actionable — concretize or drop them. Return an empty findings array when the
diff matches the spec. Change nothing.`,
      { label: `spec review ${label}`, phase: 'Review', schema: REVIEW_SCHEMA },
    ).catch(() => null),
  )

  reviews.push(
    agent(
      `Review the code in commit ${sha} (${label} of the plan at ${planPath}).

Brief yourself with \`nimbou-skills:request-review\`. Scope strictly to this commit.

Return every finding tagged by severity: \`review-critical\`, \`review-important\`,
or \`review-minor\`. Each carries a concrete \`file:line\` and a suggested next step.
Return an empty findings array when the commit is clean. Change nothing — this
review is advisory and execution has already moved past this wave.`,
      { label: `code review ${label}`, phase: 'Review', agentType: 'nimbou-skills:code-reviewer', schema: REVIEW_SCHEMA },
    ).catch(() => null),
  )
}

// ── Collect reviews ──────────────────────────────────────────────────────────

phase('Review')
log(`Waiting on ${reviews.length} background reviewer(s).`)

const findings = (await Promise.all(reviews))
  .filter(Boolean)
  .flatMap(r => r.findings ?? [])

if (stoppedAt) {
  return {
    stopped: stoppedAt,
    wavesCommitted: executed,
    findings,
    concerns,
    note: 'Execution stopped before the plan completed. No follow-ups artifact was written — fix the blocker and relaunch.',
  }
}

// ── Follow-ups ───────────────────────────────────────────────────────────────

const items = [
  ...findings,
  ...concerns.map(c => ({ tipo: 'concern', descricao: c, proximoPasso: 'a definir' })),
  ...(plan.posExecucao ?? []).map(p => ({ tipo: 'pos-execucao', descricao: p, proximoPasso: 'a definir' })),
]

if (!items.length) {
  return { wavesCommitted: executed, followups: null, message: 'Plano executado sem follow-ups pendentes.' }
}

phase('Follow-ups')
log(`${items.length} follow-up item(s) collected.`)

const artifact = await agent(
  `Write the follow-ups artifact for the plan at \`${planPath}\`.

Use the \`followups-template.md\` skeleton from the \`nimbou-skills:executing-plans\`
skill. Write to the same directory and basename as the plan, with the
\`.followups.md\` suffix. Get today's date with \`date +%F\`.

Items collected during execution:

${JSON.stringify(items, null, 2)}

Rules:
- One bullet per finding. Never merge two into one — each is independently actionable.
- Always carry the Origem so a reader can trace back to the wave/reviewer.
- Keep \`Ref:\` only when there is a concrete file:line. Do not invent paths.
- \`Próximo passo\` is required; write \`a definir\` when none was proposed.
- Inherit \`## Pos-execucao\` items verbatim.

Then split the items into two buckets and return them:
- automatable: items an agent can implement, each with the exact file paths it
  touches and the scoped verification command for those files
- manual: items needing a human decision, external system change, environment or
  infra adjustment. These must NOT appear in the file — they go to the caller.

Commit the artifact on its own as a docs commit. Stage it explicitly.`,
  {
    label: 'write followups',
    phase: 'Follow-ups',
    schema: {
      type: 'object',
      required: ['path', 'automatable', 'manual'],
      properties: {
        path: { type: 'string' },
        automatable: {
          type: 'array',
          items: {
            type: 'object',
            required: ['descricao', 'files'],
            properties: {
              descricao: { type: 'string' },
              tipo: { type: 'string' },
              files: { type: 'array', items: { type: 'string' } },
              verification: { type: 'string' },
            },
          },
        },
        manual: { type: 'array', items: { type: 'string' } },
      },
    },
  },
)

if (!artifact) return { wavesCommitted: executed, findings, concerns, error: 'Follow-ups artifact could not be written.' }

// Group automatable items by file so two agents never write the same file. An item
// spanning files that already sit in different groups merges those groups.
const byFile = new Map()
for (const item of artifact.automatable ?? []) {
  const files = (item.files ?? []).length ? item.files : ['<unassigned>']
  const merged = [item]
  for (const existing of new Set(files.map(f => byFile.get(f)).filter(Boolean))) {
    merged.push(...existing)
    for (const f of [...byFile.keys()]) if (byFile.get(f) === existing) byFile.set(f, merged)
  }
  for (const f of files) byFile.set(f, merged)
}
const fixGroups = [...new Set(byFile.values())]

const fixes = await parallel(
  fixGroups.map(group => () =>
    agent(
      `Resolve these follow-up findings. They all touch the same file set, so you own
it end to end — other agents are resolving disjoint file sets in parallel right now.

Findings, in the order you should address them (critical and spec issues first):

${JSON.stringify(group, null, 2)}

For each: read the finding and the affected files, implement the fix, then run the
scoped verification declared for those files — verbatim, never an unfiltered suite
run. If a finding turns out to need a human decision after all, skip it and say so
rather than guessing.

Do not commit; the caller commits all follow-up fixes together. Do not touch files
outside the ones listed in your findings.

Return what you fixed, what you skipped and why, and the verification output.`,
      { label: `fix ${group[0]?.files?.[0] ?? 'follow-ups'}`, phase: 'Follow-ups' },
    ),
  ),
)

const followupCommit = await agent(
  `Commit the follow-up fixes just applied for the plan at \`${planPath}\`.

What the fixers reported:
${fixes.filter(Boolean).join('\n\n---\n\n')}

Do this:
1. Stage the fixed files EXPLICITLY by path. Never \`git add -A\`.
2. Commit them together, mirroring the repo's commit style. One commit, unless the
   fixes are genuinely unrelated — then one per logical group.
3. Update \`${artifact.path}\`: mark each resolved entry with a one-line resolution
   note and the commit that fixed it. Commit that update too.
4. Return the SHAs and messages.

Do not push.`,
  { label: 'commit follow-ups', phase: 'Follow-ups', schema: COMMIT_SCHEMA },
)

const finalReview = await agent(
  `Review the follow-up fix commit(s) ${followupCommit?.sha ?? 'just created'} for the plan at
\`${planPath}\`. Confirm the fixes landed correctly and introduced nothing new.

Brief yourself with \`nimbou-skills:request-review\`. Return findings tagged
\`review-critical\` / \`review-important\` / \`review-minor\`, each with \`file:line\`.
Return an empty findings array when clean. Change nothing.`,
  { label: 'review follow-ups', phase: 'Follow-ups', agentType: 'nimbou-skills:code-reviewer', schema: REVIEW_SCHEMA },
).catch(() => null)

return {
  wavesCommitted: executed,
  followups: artifact.path,
  followupCommit,
  followUpRoundFindings: finalReview?.findings ?? [],
  manualActions: artifact.manual ?? [],
  message: (artifact.manual ?? []).length
    ? 'Plano executado. Follow-ups automatizáveis resolvidos. Ações manuais pendentes — ver manualActions.'
    : 'Plano executado. Todos os follow-ups automatizáveis resolvidos.',
}

// ── helpers ──────────────────────────────────────────────────────────────────

function implementerPrompt(group, waveLabel) {
  const multi = group.length > 1
  const files = [...new Set(group.flatMap(t => t.files ?? []))]

  return `You are implementing ${multi ? `${group.length} tasks that share a file` : 'exactly one task'} from an approved implementation plan (${waveLabel}).
Other implementers are working on other tasks of the same wave, in parallel, in this
same repository. Stay inside your file boundary.

## Your Task${multi ? 's' : ''}

${group.map((t, i) => `### ${multi ? `Task ${i + 1} — ` : ''}${t.title}\n\n${t.spec}`).join('\n\n')}

## Files You Own

${files.map(f => `- ${f}`).join('\n')}

You may READ anything in the repository. You may WRITE only to the files above. If
the task cannot be completed without writing outside that list, STOP and report the
blocker instead of widening the boundary — another implementer may own that file
right now.

## Contracts You Consume

${group.map(t => t.consumes).filter(Boolean).join('\n\n') || 'None declared — this task depends on no earlier wave.'}

Use these exactly as declared. Do not redefine, widen, or "improve" them. If a
contract you were given does not match what is on disk, STOP and report the
mismatch — it means an earlier wave diverged.

## Verification

Run these commands, verbatim, once your implementation is in place:

${group.map(t => `    ${t.verification}`).join('\n')}

Run them as written. Never widen to an unfiltered suite run (no bare \`pnpm test\`,
\`npm test\`, \`pytest\`). Do NOT commit — the controller commits the whole wave at
once. If verification fails, fix your implementation and run it again. If it keeps
failing for a reason outside your file boundary, STOP and report — do not edit files
you do not own to make it pass.

## Scope Discipline

DO implement what the task specifies, completely; follow the repository's existing
conventions in the files you touch; report anything you noticed but correctly left
alone.

DO NOT implement adjacent tasks because they look related — they belong to other
implementers running right now. Do not refactor code the task did not ask you to
change. Do not add flags, abstractions, or configuration the task did not request.
Do not fix pre-existing issues you spot nearby; report them as concerns instead.

## Report

Return status DONE, DONE_WITH_CONCERNS, or BLOCKED; the files you touched and what
changed in each; what is observably different now; the verification command and its
ACTUAL output (a claim that it passed is not evidence); and your concerns, one per
entry with file:line. When BLOCKED, state exactly what stopped you, which file or
contract is involved, and what you would need to proceed.`
}
