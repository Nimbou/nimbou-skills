export const meta = {
  name: 'run-waves',
  description: 'Run an approved wave-structured plan wave by wave: tasks in parallel per wave, one commit per wave, a single spec review at the end, follow-ups at the end',
  whenToUse:
    'After nimbou-skills:executing-plans Step 1 has loaded and approved a wave-structured plan. Pass the plan path as args. Step 1 stays in conversation — this script cannot ask the user anything mid-run.',
  phases: [
    { title: 'Parse', detail: 'read the plan and extract waves, tasks, file boundaries' },
    { title: 'Implement', detail: 'one implementer per task, parallel inside each wave' },
    { title: 'Commit', detail: 'one commit per wave, staged explicitly' },
    { title: 'Review', detail: 'spec compliance + boundary lens over every committed wave' },
    { title: 'Follow-ups', detail: 'collect findings, write the artifact, fix by file group' },
    { title: 'Smoke', detail: 'browser smoke over the promised flows, when the plan touched frontend' },
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
const allowDefaultBranch = typeof args === 'object' && args !== null && args.allowDefaultBranch === true

// Implementing on a project's long-lived branch is where stray writes land: it is
// the branch the main checkout is parked on, so an agent that resolves paths against
// the wrong root lands there and looks plausible doing it.
const DEFAULT_BRANCHES = ['main', 'master', 'dev', 'develop', 'staging', 'production']

if (!planPath) {
  return { error: 'No plan path. Call with args: "docs/plans/<plan>.md" (or { planPath }).' }
}

const PLAN_SCHEMA = {
  type: 'object',
  required: ['waves', 'repoRoot'],
  properties: {
    repoRoot: {
      type: 'string',
      description: 'absolute path of the checkout this run writes to — `git rev-parse --show-toplevel`',
    },
    branch: { type: 'string', description: '`git rev-parse --abbrev-ref HEAD` in that checkout' },
    worktrees: {
      type: 'array',
      items: { type: 'string' },
      description: 'every checkout of this repository, from `git worktree list --porcelain`, repoRoot included',
    },
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
              required: ['title', 'specLines', 'files', 'verification'],
              properties: {
                title: { type: 'string' },
                specLines: {
                  type: 'object',
                  required: ['start', 'end'],
                  description: '1-indexed line range of the task body inside the plan file',
                  properties: { start: { type: 'integer' }, end: { type: 'integer' } },
                },
                files: { type: 'array', items: { type: 'string' }, description: 'files this task writes' },
                verification: { type: 'string', description: 'declared verification command, verbatim' },
                red: {
                  type: 'string',
                  description:
                    'the RED field verbatim: the command that must FAIL before implementation, plus the failure class it must produce. The literal string "n/a — <reason>" when the task carries no testable behavior.',
                },
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
  required: ['status', 'filesTouched', 'redOutput', 'verification'],
  properties: {
    status: { type: 'string', enum: ['DONE', 'DONE_WITH_CONCERNS', 'BLOCKED'] },
    filesTouched: { type: 'array', items: { type: 'string' } },
    behaviorChanged: { type: 'string' },
    redOutput: {
      type: 'string',
      description:
        'the RED run: the command, its ACTUAL output, and why that output proves the test failed for the right reason. The literal string "n/a — <reason>" only when the task declared no RED.',
    },
    verification: { type: 'string', description: 'command run and its actual output' },
    concerns: { type: 'array', items: { type: 'string' } },
    blocker: { type: 'string' },
  },
}

const COMMIT_SCHEMA = {
  type: 'object',
  required: ['status'],
  properties: {
    status: {
      type: 'string',
      enum: ['COMMITTED', 'PARTIAL_WAVE'],
      description: 'PARTIAL_WAVE when a file an implementer reported as touched is absent from git status here',
    },
    sha: { type: 'string', description: 'omitted when status is PARTIAL_WAVE — nothing was committed' },
    message: { type: 'string' },
    missingReported: {
      type: 'array',
      items: { type: 'string' },
      description: 'files an implementer reported touching that this checkout shows no change for',
    },
    missingDeclared: {
      type: 'array',
      items: { type: 'string' },
      description: 'files the plan declared for this wave that nobody touched and nobody reported',
    },
    undeclaredChanged: { type: 'array', items: { type: 'string' }, description: 'changed files nobody declared' },
    strayIn: {
      type: 'array',
      items: { type: 'string' },
      description: 'sibling checkouts found holding uncommitted changes to the missing paths',
    },
  },
}

// What counts as frontend surface. The trigger is the committed diff, not the plan's
// declared origin: a backend plan that touched one SFC still put something on screen,
// and a frontend plan that only moved a util did not.
const FRONT_PATTERNS = [
  /\.vue$/,
  /(^|\/)(pages|components|layouts|composables|middleware|assets)\//,
  /(^|\/)nuxt\.config\.[cm]?[jt]s$/,
  /\.(css|scss|sass)$/,
]

const SMOKE_SCHEMA = {
  type: 'object',
  required: ['status'],
  properties: {
    status: {
      type: 'string',
      enum: ['PASS', 'FAIL', 'SKIPPED'],
      description:
        'SKIPPED when no browser driver was available or the app never came up — that is an environment gap, never a defect',
    },
    driver: { type: 'string', description: 'chrome-devtools | playwright | none' },
    flows: { type: 'integer', description: 'how many flows were actually exercised' },
    findings: {
      type: 'array',
      description: 'flows that failed against what the plan promised. Empty when status is PASS or SKIPPED.',
      items: {
        type: 'object',
        required: ['flow', 'descricao', 'files'],
        properties: {
          flow: { type: 'string', description: 'the flow sentence, as it was smoked' },
          descricao: { type: 'string', description: 'what was seen versus what was promised' },
          evidence: { type: 'string', description: 'screenshot path and the console line that matters' },
          files: { type: 'array', items: { type: 'string' }, description: 'files that likely own the defect' },
          verification: { type: 'string', description: 'scoped command to re-verify after a fix, if any applies' },
        },
      },
    },
    concerns: { type: 'array', items: { type: 'string' } },
  },
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
            enum: ['spec-issue', 'spec-deferred', 'guideline-issue', 'guideline-deferred'],
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

First, establish where this run writes. Run \`git rev-parse --show-toplevel\` and
\`git rev-parse --abbrev-ref HEAD\`, and return them as repoRoot and branch. Every
later agent in this run is anchored to that absolute path, so it must be the
checkout you are actually standing in — a worktree, when one was set up. Do not
guess it from the plan's prose or from any absolute path written inside the plan.

Also run \`git worktree list --porcelain\` and return every checkout path it names
as worktrees, repoRoot included. Later steps search the siblings for work that was
written into the wrong one.

Waves live under \`## Ondas de Execução\` (or the legacy \`## Grupos de Execucao\`).
Set waveStructured to false if neither heading exists — do not invent waves from a
serial task list.

Assign each task to a wave by its \`**Onda:**\` field, not by where the task text
happens to sit in the document. When a task has no \`**Onda:**\` field, fall back to
the heading it sits under.

Plans from \`nestjs-plan\` and \`nuxt-plan\` declare an Execution Contract per task —
five labelled fields directly under the task heading. **Read those fields; do not
re-derive them from the prose.** For every task in every wave, return:
- title: the task heading, verbatim, without its \`#\` markers
- specLines: the 1-indexed line range of the task's body in the plan file. \`start\`
  is the line of the task heading itself; \`end\` is the last line belonging to this
  task — the line before the next task heading, or the last line of the wave's
  section for the final task. **Do not return the task text.** An implementer will
  open the plan at this range and read it directly, so the range must cover the
  whole task and must not spill into the next one. Read the file with line numbers
  so these are exact; an off-by-one that truncates a task's body is a silent
  spec loss.
- files: the \`**Files:**\` field, split on commas. This is the write set.
- verification: the \`**Verificação:**\` field, verbatim. It is the command expecting
  PASS.
- red: the \`**RED:**\` field, verbatim — the same command run *before* implementation,
  expecting FAIL, plus the class of failure it must produce. It is a separate field
  from \`Verificação\` and must never be merged into it. Return it omitted only when
  the plan genuinely has no such field; when the plan wrote \`n/a — <motivo>\`, return
  that string as-is rather than dropping it, since the reason is what makes the
  exception reviewable.
- consumes: the \`**Consome:**\` field, verbatim. Return it omitted when the field
  says \`nada\`.

When a task is missing one of these fields, return what the field would hold if you
can read it unambiguously from the task body, and leave it out otherwise. Never
invent a \`consumes\` value: an empty one tells the implementer it depends on no
earlier wave, and a wrong one is worse than none.
- agentType: the \`**Role:**\` field. Copy it verbatim, including the
  \`nimbou-skills:\` prefix. Omit the field entirely when the plan declared no Role;
  never infer one from the file path, since the fallback to general-purpose is what
  surfaces the planning bug.

Set isNestjsTestWave on a wave whose job is to dispatch
\`nimbou-skills:nestjs-test\` as the plan's final verification. Only the last wave
can be one. Set it to false everywhere else — a wave that merely contains some
test tasks is not the final verification wave.

Also return planOrigin (nestjs-plan / nuxt-plan / other) and posExecucao: the
verbatim items under \`## Pos-execucao\` when that section exists.

Beyond the two \`git rev-parse\` reads, read only. Change nothing.`,
  { label: 'parse-plan', schema: PLAN_SCHEMA, model: 'haiku', effort: 'low' },
)

if (!plan) return { error: `Could not parse ${planPath}.` }
if (plan.waveStructured === false) {
  return {
    error: `${planPath} has no \`## Ondas de Execução\`. Regenerate it via nimbou-skills:nestjs-plan or nimbou-skills:nuxt-plan before executing.`,
  }
}

// Every write in this run is anchored here. Without it, implementers resolve the
// plan's paths against whatever checkout they inherited — which is how a wave gets
// half-written into the main checkout and committed as if it were complete.
const repoRoot = (plan.repoRoot ?? '').trim()
if (!repoRoot.startsWith('/')) {
  return {
    error:
      'Could not establish an absolute repoRoot for this run. Every implementer must be anchored to one checkout before any wave is dispatched.',
  }
}

const branch = (plan.branch ?? '').trim()
if (!allowDefaultBranch && DEFAULT_BRANCHES.includes(branch)) {
  return {
    error: `${repoRoot} is on \`${branch}\`, a long-lived branch. Create a worktree or a feature branch and relaunch — or pass { planPath, allowDefaultBranch: true } if implementing here is deliberate.`,
    reason:
      'A run on a project default branch is almost always the main checkout rather than the intended worktree, which is exactly how a wave ends up half-written in the wrong place.',
  }
}

// Sibling checkouts of the same repository. When a file goes missing from this one,
// this is the list to search — naming what is missing without naming where it went
// leaves the whole recovery to be done by hand.
const siblings = (plan.worktrees ?? []).filter(w => w && w !== repoRoot)
if (siblings.length) log(`${siblings.length} sibling checkout(s) will be searched if a wave's files go missing.`)

// Hand agents the plan by absolute path too: a relative one resolves against
// whatever directory the agent inherited, which is the same failure mode.
const planRef = planPath.startsWith('/') ? planPath : `${repoRoot}/${planPath.replace(/^\.\//, '')}`

const waves = plan.waves ?? []
const taskCount = waves.reduce((n, w) => n + (w.tasks?.length ?? 0), 0)
log(`Anchored at ${repoRoot}${plan.branch ? ` (${plan.branch})` : ''} — every write and every commit happens there.`)
log(`${waves.length} waves, ${taskCount} tasks. Waves run in order; tasks inside a wave run in parallel.`)

// Task count is not dispatch count and never was — the executor coalesces by Role,
// then adds phases the plan never mentions. Project the floor before spending it, so
// a plan that will open thirty agents says so while there is still time to reshape it.
const projectedImplementers = waves.reduce((n, w) => {
  const roles = new Set()
  let unrouted = 0
  for (const t of w.tasks ?? []) (t.agentType ? roles.add(t.agentType) : unrouted++)
  return n + Math.max(1, roles.size + unrouted)
}, 0)
log(
  `Projected floor: ~${projectedImplementers} implementer(s) + ${waves.length} commit(s) + 2 reviewers ` +
    `+ follow-up fixers + smoke. Both reviewers read every commit, so review cost tracks the ` +
    `total diff, not the wave count — which is why a plan is worth reshaping before launch rather than after.`,
)

// ── Execute ──────────────────────────────────────────────────────────────────

// Spec review payloads, one per committed wave. Collected during the run and
// spent on a SINGLE reviewer at the end instead of one Opus reviewer per wave:
// same lens, a fraction of the tokens. The trade is latency — the review no
// longer overlaps wave w+1 — which is the right trade when the waves carry
// their own test coverage.
const reviewInputs = []
const executed = []
const concerns = []
let stoppedAt = null

// What this run actually spends, by phase. A wave-structured plan hides its cost
// behind a task count that is not the dispatch count, and the phases after the
// waves — two reviewers over every commit, one fixer per file group, the smoke and
// its fixes — are invisible from the plan entirely. Counting them here is what makes
// "was the workflow worth it" answerable from the report instead of from a bill.
const tally = { parse: 1, implement: 0, commit: 0, review: 0, followups: 0, smoke: 0 }
const tallyTotal = () => Object.values(tally).reduce((a, b) => a + b, 0)

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

  // Step 2.1b: coalesce by Role. Every implementer pays the same setup before its
  // first write — CLAUDE.md, the nearest GUIDELINES.md, a neighbouring file for
  // style, the ports it consumes. On a task sized at one behavior that setup is a
  // large share of the cost, and two authors of the same Role in one wave pay it twice
  // for the same reads. Merging them pays it once. What is lost is overlap between
  // sibling tasks, which was cheap in wall-clock (the wave already waits on the
  // slowest Role) and expensive in tokens.
  //
  // Only groups where EVERY task declared the SAME Role merge. A group that fell
  // back to general-purpose — unrouted, or a collision with conflicting Roles —
  // stays on its own: it already carries a concern, and burying it inside a
  // coalesced agent makes a planning bug harder to act on.
  const COALESCE_LIMIT = 3
  const openByRole = new Map()
  const dispatchGroups = []
  let coalesced = 0
  for (const group of groups) {
    const roles = [...new Set(group.map(t => t.agentType))]
    const role = roles.length === 1 && roles[0] ? roles[0] : null
    const open = role ? openByRole.get(role) : undefined
    // A collision group is never split by the cap — it must stay with its file.
    if (open && open.length + group.length <= COALESCE_LIMIT) {
      open.push(...group)
      coalesced++
      continue
    }
    const fresh = [...group]
    dispatchGroups.push(fresh)
    if (role) openByRole.set(role, fresh)
  }

  // A nestjs-test wave carries no Role by contract — it routes through the test
  // auditors, not through implementers. Only other waves owe one.
  const unrouted = wave.isNestjsTestWave ? [] : tasks.filter(t => !t.agentType)

  tally.implement += dispatchGroups.length
  phase('Implement')
  log(
    `${label}: ${dispatchGroups.length} implementer(s) for ${tasks.length} task(s)` +
      (coalesced ? ` — ${coalesced} merged into a same-Role sibling` : '') +
      (unrouted.length ? ` — ${unrouted.length} without a declared Role, falling back to general-purpose` : ''),
  )
  for (const task of unrouted) {
    concerns.push(`${label}: "${task.title}" declared no Role; dispatched as general-purpose.`)
  }

  const reports = await parallel(
    dispatchGroups.map(group => () =>
      agent(implementerPrompt(group, label), {
        label: `${label} · ${group.map(t => t.title).join(' + ')}`,
        phase: 'Implement',
        schema: IMPL_SCHEMA,
        // A declared Role carries its own model. Without one the fallback is
        // general-purpose, which would inherit the session model — an Opus-tier
        // implementer for a task the plan simply forgot to route. Pin it.
        ...(groupRole(group, label) ? { agentType: groupRole(group, label) } : { model: 'sonnet' }),
      }),
    ),
  )

  for (const r of reports) {
    for (const c of r?.concerns ?? []) concerns.push(`${label}: ${c}`)
  }

  const blocked = reports.map((r, i) => ({ r, group: dispatchGroups[i] })).filter(({ r }) => !r || r.status === 'BLOCKED')
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
  tally.commit += 1
  const files = [...new Set(reports.flatMap(r => r.filesTouched ?? []))]

  // The implementers already ran their verifications. Re-running every one of them
  // here doubles the wave's test time on the sequential critical path, so only the
  // ones that came back as a bare claim get re-run. A transcript is long and carries
  // runner output; "passou" is not evidence of anything.
  const unproven = groups.flatMap((group, i) =>
    (reports[i]?.verification ?? '').length >= 200 ? [] : group.map(t => t.verification).filter(Boolean),
  )
  const declaredFiles = [...new Set(tasks.flatMap(t => t.files ?? []))]
  const commit = await agent(
    `Commit exactly one wave of an approved plan.

    WORKTREE_ROOT = ${repoRoot}

Run every git command in WORKTREE_ROOT. Confirm with \`git rev-parse --show-toplevel\`
before anything else; if it prints something different, \`cd\` there first. This wave
may have been implemented in a worktree rather than the project's main checkout, and
a status taken in the wrong one is what makes a half-written wave look complete.

Wave: ${label}
Tasks included:
${tasks.map(t => `- ${t.title}`).join('\n')}

Files reported as touched by the implementers:
${files.map(f => `- ${f}`).join('\n')}

Files the plan declared for this wave:
${declaredFiles.map(f => `- ${f}`).join('\n') || '- (none declared)'}

Do this:
1. Run \`git status --porcelain\` and reconcile it against both lists above. Paths in
   the lists are relative to WORKTREE_ROOT; an absolute path outside WORKTREE_ROOT is
   itself proof that an implementer wrote into another checkout.
   - **A file an implementer reported touching, with no change in \`git status\`** —
     return it in missingReported, set status to PARTIAL_WAVE, and COMMIT NOTHING.
     The work exists somewhere this run will never commit. This is a stop, not a note:
     committing the rest produces a wave that references code that is not there.
${
      siblings.length
        ? `     Then find it. Run \`git -C <checkout> status --porcelain\` in each sibling
     checkout below and return, in strayIn, the ones showing changes to the missing
     paths. Saying what is missing without saying where it went leaves the entire
     recovery to be done by hand.
${siblings.map(w => `       - ${w}`).join('\n')}`
        : '     This repository has no sibling checkouts, so leave strayIn empty.'
    }
   - A file the plan declared that nobody reported and nothing changed — return it in
     missingDeclared and carry on; it is a concern, not a stop.
   - A file changed that nobody declared — return it in undeclaredChanged and carry on.
     Do NOT revert it.
2. ${
      unproven.length
        ? `Re-run these verifications — their implementers reported a claim rather than
   runner output. Run them exactly as written, and nothing else. Never widen to an
   unfiltered suite run (no bare \`pnpm test\`, \`npm test\`, \`pytest\`).
${unproven.map(v => `   - ${v}`).join('\n')}`
        : `Skip verification. Every implementer in this wave returned actual runner
   output, so the suites already ran. Do not re-run them.`
    }
3. Stage the wave's files EXPLICITLY by path. Never \`git add -A\`.
4. Read \`git log\` on the current branch and mirror its message style. Reference
   the wave and list the tasks included.
5. Commit, then return status COMMITTED with the resulting SHA and the message you
   used. Skip steps 2 through 5 entirely when step 1 found a missingReported file:
   return status PARTIAL_WAVE with that list and no SHA.

Do not push. Do not commit anything outside this wave.`,
    { label: `commit ${label}`, phase: 'Commit', schema: COMMIT_SCHEMA, model: 'haiku', effort: 'low' },
  )

  if (!commit) {
    stoppedAt = { wave: label, blockers: [{ tasks: ['<commit>'], blocker: 'commit agent returned no result' }] }
    break
  }

  // A file reported as written that this checkout has no change for means the work
  // landed in another checkout. Committing the remainder would produce a wave whose
  // code references files that are not in the branch — the failure this guard exists
  // for, and one that only surfaces waves later as a "divergent contract".
  if (commit.status === 'PARTIAL_WAVE' || !commit.sha) {
    const missing = commit.missingReported ?? []
    const stray = commit.strayIn ?? []
    stoppedAt = {
      wave: label,
      blockers: [
        {
          tasks: tasks.map(t => t.title),
          blocker: missing.length
            ? `Wave written outside ${repoRoot}: ${missing.join(', ')} were reported as touched but show no change here.${
                stray.length ? ` Found uncommitted in: ${stray.join(', ')}.` : ''
              } Move those paths into this checkout before rerunning; committing the rest would land a partial wave.`
            : 'commit agent returned no SHA',
        },
      ],
    }
    log(`${label} PARTIAL — work landed outside ${repoRoot}; nothing committed, downstream waves stopped.`)
    break
  }

  for (const f of commit.missingDeclared ?? []) {
    concerns.push(`${label}: plan declared "${f}" for this wave but nothing changed it.`)
  }
  for (const f of commit.undeclaredChanged ?? []) {
    concerns.push(`${label}: "${f}" changed but no task declared it.`)
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
  // The reviewer is told to distrust these reports and read the diff instead, so
  // pasting each implementer's raw verification output would be paying for tokens
  // we instruct the model to ignore. Send the claims, not the transcript.
  collectSpecReview(
    label,
    commit.sha,
    `The wave's tasks are specified in the plan at \`${planRef}\`. Read each range
below before judging the diff — the spec is the plan's text, not this summary.

${tasks
  .map(
    t =>
      `- **${t.title}** — \`Read("${planRef}", offset: ${t.specLines?.start ?? 1}, limit: ${Math.max(1, (t.specLines?.end ?? 1) - (t.specLines?.start ?? 1) + 1)})\``,
  )
  .join('\n')}`,
    reports
      .map((r, i) => {
        const who = dispatchGroups[i].map(t => t.title).join(' + ')
        const claims = [
          `status: ${r.status}`,
          `files: ${(r.filesTouched ?? []).join(', ') || 'none reported'}`,
          `red run: ${r.redOutput || 'NOT REPORTED'}`,
          r.behaviorChanged ? `behavior: ${r.behaviorChanged}` : null,
          (r.concerns ?? []).length ? `concerns: ${r.concerns.join('; ')}` : null,
        ].filter(Boolean)
        return `### ${who}\n${claims.join('\n')}`
      })
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
  tally.implement += 1
  const testReport = await agent(
    `Run the plan's final verification wave using \`nimbou-skills:nestjs-test\`.

    WORKTREE_ROOT = ${repoRoot}

Work only inside WORKTREE_ROOT — confirm with \`git rev-parse --show-toplevel\` before
your first write, and build every path from WORKTREE_ROOT if your working directory
is elsewhere. This run may be happening in a worktree, and a test written into the
main checkout is a test this branch does not have. Report paths relative to it.

The plan at \`${planRef}\` came from \`nestjs-plan\` but declared no final
verification wave. You are that wave.

Scope: ONLY what this plan changed across every wave — these files and nothing
else:

${touched.map(f => `- ${f}`).join('\n')}

Use **final-wave mode**: every task in this plan was already driven by its own
failing test, so per-slice coverage exists. Re-asserting it here is rework, not
thoroughness.

Do this:
1. Derive the explicit suite/file paths that cover those files — the controllers,
   use-cases, repositories, Prisma adapters, and migrations they contain.
2. Invoke the runner with those paths and nothing wider, e.g.
   \`pnpm test -- --runInBand <suite-path>\`.
3. An unfiltered \`pnpm test\` is forbidden. If you cannot derive a scoped path
   set, report BLOCKED rather than widening the run.
4. Stabilize what is fragile when the plan's suites run together — order
   dependence, fixture leakage, timing. These pass per-task and break in company.
5. Write new tests ONLY for the seams between tasks: each task proved its slice in
   isolation, and nobody proved they compose. A route-level test exercising
   controller → use-case → repository is in scope for exactly that reason.
6. If you find plan behavior with no test at all, write it AND report it as a
   concern — the task's RED was fake or skipped, and that belongs in follow-ups
   rather than being silently patched here.

Do NOT commit — the caller commits this wave. Report status, the files you touched,
and the actual runner output. This wave stabilizes existing coverage rather than
driving out new behavior, so report \`redOutput\` as
\`n/a — onda final de verificação\`.`,
    { label, phase: 'Implement', schema: IMPL_SCHEMA, agentType: 'general-purpose', model: 'sonnet' },
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
          `Commit the final verification wave for the plan at \`${planRef}\`.

    WORKTREE_ROOT = ${repoRoot}

Run every git command there; confirm with \`git rev-parse --show-toplevel\` first.

Files touched by the nestjs-test wave:
${testFiles.map(f => `- ${f}`).join('\n')}

Run \`git status --porcelain\` and check each of those files against it. Any file
listed above with no change here was written into another checkout: return it in
missingReported with status PARTIAL_WAVE and commit nothing.

Otherwise stage them EXPLICITLY by path — never \`git add -A\`. Mirror the repo's
commit style from \`git log\`. Do not push. Return status COMMITTED with the SHA and
message.`,
          { label: `commit ${label}`, phase: 'Commit', schema: COMMIT_SCHEMA, model: 'haiku', effort: 'low' },
        )
      : null

    if (testCommit && testCommit.status === 'PARTIAL_WAVE') {
      stoppedAt = {
        wave: label,
        blockers: [
          {
            tasks: ['nestjs-test'],
            blocker: `Final wave written outside ${repoRoot}: ${(testCommit.missingReported ?? []).join(', ') || 'commit agent returned no SHA'}.`,
          },
        ],
      }
      log(`${label} PARTIAL — work landed outside ${repoRoot}; nothing committed.`)
    } else if (testCommit?.sha) {
      executed.push({
        wave: label,
        sha: testCommit.sha,
        message: testCommit.message,
        tasks: ['nestjs-test'],
        files: testFiles,
      })
      collectSpecReview(
        label,
        testCommit.sha,
        'Final verification wave: a scoped `nestjs-test` run over the files this plan changed. There is no plan task to read — judge the diff on its own terms.',
        [
          `status: ${testReport.status}`,
          `files: ${(testReport.filesTouched ?? []).join(', ') || 'none reported'}`,
          testReport.behaviorChanged ? `behavior: ${testReport.behaviorChanged}` : null,
          (testReport.concerns ?? []).length ? `concerns: ${testReport.concerns.join('; ')}` : null,
        ]
          .filter(Boolean)
          .join('\n'),
      )
    } else if (!testFiles.length) {
      log(`${label}: green with no file changes, nothing to commit.`)
    } else {
      stoppedAt = {
        wave: label,
        blockers: [{ tasks: ['nestjs-test'], blocker: 'commit agent returned no result for the final wave' }],
      }
    }
  }
}

// A write-set collision merges tasks into one implementer. Roles survive that merge
// only when every task in the group declared the SAME one — two different roles have
// no correct winner, so the group falls back and the loss is recorded.
function groupRole(group, waveLabel) {
  const roles = [...new Set(group.map(t => t.agentType).filter(Boolean))]

  if (roles.length === 1 && roles.length === group.length) return roles[0]
  if (roles.length === 1) return roles[0] // one role declared, the rest declared none

  if (roles.length > 1) {
    concerns.push(
      `${waveLabel}: "${group.map(t => t.title).join('" + "')}" were merged by a write-set collision but declare different Roles (${roles.join(', ')}). Dispatched as general-purpose — the specialized routing was lost. Split the file so each Role owns its own task.`,
    )
  }
  return null
}

function collectSpecReview(label, sha, requested, reported) {
  reviewInputs.push({ label, sha, requested, reported })
}

// ── Spec review ──────────────────────────────────────────────────────────────

phase('Review')

let findings = []

if (!reviewInputs.length) {
  log('No committed wave to review.')
} else {
  log(`Reviewing ${reviewInputs.length} committed wave(s): spec compliance + boundary lens.`)

  // Two lenses, concurrently. Spec compliance reads the plan and asks whether the
  // diff is what was asked for. The gap analyzer never sees the plan and asks
  // whether the diff respects the project's boundaries and conventions — the axis
  // a green test suite says nothing about, and the reason the run can stop paying
  // for a full `/code-review` on every plan.
  tally.review += 2
  const [review, gaps] = await parallel([
    () =>
      agent(
    `You are reviewing whether a plan's implementation matches its specification.
Follow the spec compliance reviewer contract in the \`nimbou-skills:executing-plans\`
skill (\`spec-reviewer-prompt.md\`).

The work was performed by one implementer subagent per task, running in parallel
within each wave. Each reported its own task done and its wave was committed on
that basis. Do not trust the reports — read the diffs.

Parallel implementers introduce failure modes a single executor does not have.
Check specifically for: two tasks that independently redefined the same type or
helper; a task that wrote outside its declared files; an earlier wave's contract
re-declared with a different shape by a later one; a gap each task assumed the
other would close. Because you are seeing every wave at once, cross-wave drift is
yours to catch — a contract established in wave 1 and quietly reshaped in wave 3
is exactly the finding this pass exists for.

Review the waves below, in order. Each is one commit.

${reviewInputs
  .map(
    r => `---

## ${r.label}

### What Was Requested

${r.requested}

### What the Implementers Claim Was Changed

${r.reported}

### Diff

Run \`git show ${r.sha}\`.`,
  )
  .join('\n\n')}

---

These commits live in \`${repoRoot}\` — run every git command and open every file
there, not in another checkout of the same project.

Open the touched files at \`file:line\` to confirm context. Review only these
commits.

Every task was supposed to be driven by a failing test. Each implementer reported a
\`red run\` claim above. Audit those claims against the diff: a task whose commit
introduces implementation with no corresponding test, or whose red run reports a
failure that could not have exercised the behavior (an import error, an unresolved
provider, a parse failure), did not do TDD. Report it as a \`spec-issue\`. A claim
of \`NOT REPORTED\` is itself the finding.

Return findings as \`spec-issue\` (Missing / Extra / Misunderstanding, or a broken
red-run claim) or \`spec-deferred\` (out-of-scope nits, nearby pre-existing issues).
Every finding carries a concrete \`file:line\`, names the wave it belongs to, and
suggests a next step. Vague findings are not actionable — concretize or drop them.
Return an empty findings array when the diffs match the spec. Change nothing.`,
        // Pinned to sonnet rather than left to inherit. This pass reads diffs against a
        // spec it is handed as line ranges — recognition, not design — and it was the
        // single most expensive agent in the run while it sat on opus. Inheriting is not
        // the cheaper alternative: on an opus session it is the same bill, silently.
        // Raise it back only if spec drift starts surviving this lens.
        { label: 'spec review', phase: 'Review', agentType: 'general-purpose', model: 'sonnet', schema: REVIEW_SCHEMA },
      ),
    () =>
      agent(
        `Review this plan's committed work for architecture boundaries, project
conventions, and missed reuse. You are the boundary lens — you do NOT have the plan
and you are not judging whether the right feature was built. Another reviewer does
that.

Commits under review, in order:

${reviewInputs.map(r => `- \`${r.sha}\` — ${r.label}`).join('\n')}

They live in \`${repoRoot}\`; run every git command and open every file there.

Run \`git show <sha>\` for each, and read the surrounding files to judge whether the
new code fits what is already there.

What matters here is precisely what a passing test suite cannot tell you: Prisma or
other infrastructure types leaking across the application boundary, a use-case that
duplicates one that already exists, a repository method that belongs on a port that
was never updated, naming that departs from the module's existing convention, a
controller that grew business logic, a component or composable rebuilt instead of
reused.

Return findings as \`guideline-issue\` (a boundary or convention actually violated)
or \`guideline-deferred\` (worth doing, not urgent). Every finding carries a concrete
\`file:line\` and a suggested next step. Do not report style preferences, and do not
report anything you cannot point at in the diff. Return an empty findings array when
the code fits the project. Change nothing.`,
        {
          label: 'boundary review',
          phase: 'Review',
          agentType: 'nimbou-skills:guidelines-gap-analyzer',
          schema: REVIEW_SCHEMA,
        },
      ),
  ])

  if (!review) {
    concerns.push('O spec review não retornou resultado. O plano foi executado sem essa verificação — revise o diff manualmente.')
  }
  if (!gaps) {
    concerns.push('O guidelines-gap-analyzer não retornou resultado. Fronteiras e convenções ficaram sem lente neste run — considere rodar `/code-review` sobre o branch.')
  }
  findings = [...(review?.findings ?? []), ...(gaps?.findings ?? [])]
}

if (stoppedAt) {
  return {
    stopped: stoppedAt,
    wavesCommitted: executed,
    agentsDispatched: { ...tally, total: tallyTotal() },
    findings,
    concerns,
    // Cached agent results describe edits on disk. After a rescue — files moved
    // between checkouts, a partial wave discarded — those edits no longer match, and
    // a resume replays "done" for work that is no longer there.
    note: 'Execution stopped before the plan completed. No follow-ups artifact was written — fix the blocker and relaunch. Do NOT relaunch with resumeFromRunId if any file was moved, reverted, or rescued between checkouts: the cache would replay implementer reports for edits that no longer exist. Start a fresh run instead.',
  }
}

// ── Follow-ups ───────────────────────────────────────────────────────────────

const items = [
  ...findings,
  ...concerns.map(c => ({ tipo: 'concern', descricao: c, proximoPasso: 'a definir' })),
  ...(plan.posExecucao ?? []).map(p => ({ tipo: 'pos-execucao', descricao: p, proximoPasso: 'a definir' })),
]

if (!items.length) {
  // A plan with nothing pending is exactly the one nobody thinks to open in a
  // browser, so the smoke runs on this path too.
  const browserSmoke = await runBrowserSmoke(executed.flatMap(e => e.files ?? []))
  return {
    wavesCommitted: executed,
    agentsDispatched: { ...tally, total: tallyTotal() },
    followups: null,
    browserSmoke,
    message: 'Plano executado sem follow-ups pendentes.',
  }
}

phase('Follow-ups')
log(`${items.length} follow-up item(s) collected.`)

tally.followups += 1
const artifact = await agent(
  `Write the follow-ups artifact for the plan at \`${planRef}\`.

    WORKTREE_ROOT = ${repoRoot}

Write and commit inside WORKTREE_ROOT — confirm with \`git rev-parse --show-toplevel\`
first. The artifact belongs to the same branch as the waves it reports on.

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
    model: 'haiku',
    effort: 'low',
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

if (!artifact)
  return {
    wavesCommitted: executed,
    findings,
    concerns,
    agentsDispatched: { ...tally, total: tallyTotal() },
    error: 'Follow-ups artifact could not be written.',
  }

const fixGroups = groupByFile(artifact.automatable ?? [])

tally.followups += fixGroups.length
const fixes = await parallel(
  fixGroups.map(group => () =>
    agent(
      `Resolve these follow-up findings. They all touch the same file set, so you own
it end to end — other agents are resolving disjoint file sets in parallel right now.

    WORKTREE_ROOT = ${repoRoot}

Every path you read or write resolves under WORKTREE_ROOT — confirm with
\`git rev-parse --show-toplevel\` before your first write and build paths from
WORKTREE_ROOT if your working directory is elsewhere. A fix written into another
checkout is a fix this branch does not have.

Findings, in the order you should address them (critical and spec issues first):

${JSON.stringify(group, null, 2)}

For each: read the finding and the affected files, implement the fix, then run the
scoped verification declared for those files — verbatim, never an unfiltered suite
run. If a finding turns out to need a human decision after all, skip it and say so
rather than guessing.

Do not commit; the caller commits all follow-up fixes together. Do not touch files
outside the ones listed in your findings.

Return the files you touched, what you fixed, and what you skipped and why.`,
      {
        label: `fix ${group[0]?.files?.[0] ?? 'follow-ups'}`,
        phase: 'Follow-ups',
        model: 'sonnet',
        schema: {
          type: 'object',
          required: ['filesTouched'],
          properties: {
            filesTouched: { type: 'array', items: { type: 'string' } },
            fixed: { type: 'array', items: { type: 'string' } },
            skipped: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    ),
  ),
)

const fixedFiles = [...new Set(fixes.filter(Boolean).flatMap(f => f.filesTouched ?? []))]

// Every item was manual, or every fixer skipped: there is nothing staged. Spawning a
// commit agent and a reviewer over an empty diff burns two agents for no work.
if (!fixedFiles.length) {
  log('No automatable follow-up produced a change — skipping the follow-up commit and its review.')
  const browserSmoke = await runBrowserSmoke(executed.flatMap(e => e.files ?? []))
  return {
    wavesCommitted: executed,
    agentsDispatched: { ...tally, total: tallyTotal() },
    followups: artifact.path,
    followupCommit: null,
    browserSmoke,
    manualActions: artifact.manual ?? [],
    skipped: fixes.filter(Boolean).flatMap(f => f.skipped ?? []),
    message: (artifact.manual ?? []).length
      ? 'Plano executado. Nenhum follow-up automatizável rendeu mudança. Ações manuais pendentes — ver manualActions.'
      : 'Plano executado. Nenhum follow-up automatizável rendeu mudança.',
  }
}

tally.commit += 1
const followupCommit = await agent(
  `Commit the follow-up fixes just applied for the plan at \`${planRef}\`.

    WORKTREE_ROOT = ${repoRoot}

Run every git command there; confirm with \`git rev-parse --show-toplevel\` first.

Files the fixers reported touching:
${fixedFiles.map(f => `- ${f}`).join('\n')}

Do this:
0. Run \`git status --porcelain\`. Any file listed above with no change here was
   written into another checkout — return it in missingReported with status
   PARTIAL_WAVE and commit nothing.
1. Stage exactly the files listed above, by path. Never \`git add -A\`.
2. Commit them together, mirroring the repo's commit style. One commit, unless the
   fixes are genuinely unrelated — then one per logical group.
3. Update \`${artifact.path}\`: mark each resolved entry with a one-line resolution
   note and the commit that fixed it. Commit that update too.
4. Return status COMMITTED with the SHAs and messages.

Do not push.`,
  { label: 'commit follow-ups', phase: 'Follow-ups', schema: COMMIT_SCHEMA, model: 'haiku', effort: 'low' },
)

const browserSmoke = await runBrowserSmoke([...executed.flatMap(e => e.files ?? []), ...fixedFiles])

log(
  `Run complete — ${tallyTotal()} agents dispatched: ${Object.entries(tally)
    .filter(([, n]) => n)
    .map(([k, n]) => `${n} ${k}`)
    .join(', ')}.`,
)

return {
  wavesCommitted: executed,
  agentsDispatched: { ...tally, total: tallyTotal() },
  followups: artifact.path,
  followupCommit,
  browserSmoke,
  manualActions: artifact.manual ?? [],
  message: (artifact.manual ?? []).length
    ? 'Plano executado. Follow-ups automatizáveis resolvidos. Ações manuais pendentes — ver manualActions.'
    : 'Plano executado. Todos os follow-ups automatizáveis resolvidos.',
  reviewNote: 'Code review is not part of this run — rode `/code-review` sobre o branch antes do merge.',
}

// ── helpers ──────────────────────────────────────────────────────────────────

// Group items by file so two agents never write the same one. An item spanning
// files that already sit in different groups merges those groups.
function groupByFile(items) {
  const byFile = new Map()
  for (const item of items) {
    const files = (item.files ?? []).length ? item.files : ['<unassigned>']
    const merged = [item]
    for (const existing of new Set(files.map(f => byFile.get(f)).filter(Boolean))) {
      merged.push(...existing)
      for (const f of [...byFile.keys()]) if (byFile.get(f) === existing) byFile.set(f, merged)
    }
    for (const f of files) byFile.set(f, merged)
  }
  return [...new Set(byFile.values())]
}

function isFrontFile(path) {
  return FRONT_PATTERNS.some(pattern => pattern.test(path))
}

// Step 5: the only lens in this run that looks at the application instead of at its
// source. Runs last, over the state the branch actually ends in, and only when the
// committed diff put something on screen.
async function runBrowserSmoke(touched) {
  const front = [...new Set(touched.filter(isFrontFile))]
  if (!front.length) return null

  phase('Smoke')
  log(`${front.length} frontend file(s) in the committed diff — smoking the flows this plan promised.`)

  let outcome = null
  let pending = []
  let recheck = null

  // Two rounds, not more: the first fix often reveals the defect behind it, and a
  // third round on a run this long buys less than it costs. What survives is a
  // follow-up, recorded as such.
  for (let round = 1; round <= 2; round += 1) {
    tally.smoke += 1
    const smoke = await agent(smokePrompt(front, recheck), {
      label: round === 1 ? 'browser smoke' : 'browser smoke (recheck)',
      phase: 'Smoke',
      schema: SMOKE_SCHEMA,
      model: 'sonnet',
    })

    if (!smoke) {
      concerns.push('Browser smoke: o agente não retornou resultado. A validação em browser não rodou neste plano.')
      outcome = { status: 'SKIPPED', driver: 'none', concerns: ['agente de smoke não retornou'] }
      break
    }

    outcome = smoke
    for (const c of smoke.concerns ?? []) concerns.push(`Browser smoke: ${c}`)
    pending = smoke.findings ?? []

    // SKIPPED means no driver or an environment that never came up. Neither is a
    // statement about the code, so neither may open a fix cycle.
    if (smoke.status === 'SKIPPED' || !pending.length || round === 2) break

    log(`${pending.length} flow(s) failed on screen — fixing and re-checking once.`)

    tally.smoke += groupByFile(pending).length
    const fixed = await parallel(
      groupByFile(pending).map(group => () =>
        agent(
          `Fix what the browser smoke found. These findings share a file set, so you own
it end to end — other agents are fixing disjoint sets in parallel right now.

    WORKTREE_ROOT = ${repoRoot}

Read and write only under WORKTREE_ROOT; confirm with \`git rev-parse --show-toplevel\`
before your first write.

Findings, each with what was observed on screen versus what the plan promised:

${JSON.stringify(group, null, 2)}

These are runtime defects seen in a real browser, not review opinions. Fix each at
the layer that owns it — a page that renders empty is rarely the page's fault. Run
any scoped verification a finding declares, verbatim; never widen to an unfiltered
suite run. Do not commit, and do not touch files outside the ones listed.

Return the files you touched, what you fixed, and what you skipped and why.`,
          {
            label: `fix browser ${group[0]?.files?.[0] ?? 'flows'}`,
            phase: 'Smoke',
            model: 'sonnet',
            schema: {
              type: 'object',
              required: ['filesTouched'],
              properties: {
                filesTouched: { type: 'array', items: { type: 'string' } },
                fixed: { type: 'array', items: { type: 'string' } },
                skipped: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        ),
      ),
    )

    const smokeFixed = [...new Set(fixed.filter(Boolean).flatMap(f => f.filesTouched ?? []))]
    if (!smokeFixed.length) {
      log('No smoke finding produced a change — nothing to re-check.')
      break
    }

    tally.commit += 1
    await agent(
      `Commit the browser-smoke fixes.

    WORKTREE_ROOT = ${repoRoot}

Run every git command there; confirm with \`git rev-parse --show-toplevel\` first.

Files the fixers reported touching:
${smokeFixed.map(f => `- ${f}`).join('\n')}

Run \`git status --porcelain\` and check each against it; a file listed above with no
change here was written into another checkout — report it and commit nothing. Stage
the rest EXPLICITLY by path, never \`git add -A\`. Mirror the repo's commit style, and
say in the message that these came from browser verification. Do not push. Return
status COMMITTED with the SHA and message.`,
      { label: 'commit browser fixes', phase: 'Smoke', schema: COMMIT_SCHEMA, model: 'haiku', effort: 'low' },
    )

    recheck = pending.map(f => f.flow)
  }

  // Anything still failing after the rounds, plus anything the smoke could not do at
  // all, has to leave a trace. A lens that ran and found something, or did not run,
  // is worse than useless if the run reports neither.
  const leftovers = (outcome?.concerns ?? []).length || pending.length
  if (leftovers) {
    tally.commit += 1
    await agent(
      `Record what the browser smoke left behind, in the plan's follow-ups artifact.

    WORKTREE_ROOT = ${repoRoot}

The artifact lives next to the plan at \`${planRef}\`, same basename, \`.followups.md\`
suffix. Create it from the \`followups-template.md\` skeleton of the
\`nimbou-skills:executing-plans\` skill if it does not exist yet; append to it if it
does. Get today's date with \`date +%F\`.

Flows still failing after the smoke's fix rounds — type \`browser-issue\`:

${pending.length ? JSON.stringify(pending, null, 2) : '(none)'}

Things the smoke could not do — type \`concern\`:

${(outcome?.concerns ?? []).map(c => `- ${c}`).join('\n') || '(none)'}

One bullet per item. Carry the flow sentence and the evidence path so a reader can
see what was observed. Origem is \`browser-smoke\`. Then commit the artifact on its
own, staged explicitly, and return status COMMITTED with the SHA and message.`,
      { label: 'record browser findings', phase: 'Smoke', schema: COMMIT_SCHEMA, model: 'haiku', effort: 'low' },
    )
  }

  return outcome
}

function smokePrompt(front, recheck) {
  return `Verify in a real browser that this plan's promised behavior actually works.

Use the \`nimbou-skills:browser-smoke\` skill, in **\`report\` mode** — you report, the
caller owns the fix cycle and every commit. Follow the skill; the context it needs is
below.

    WORKTREE_ROOT = ${repoRoot}

Run the dev server and every command inside WORKTREE_ROOT. A server started in
another checkout serves code this branch does not contain.

The plan is at \`${planRef}\`. Derive the flows from what it promises the user can do,
not from the file list — a route that renders is not a feature that works.

Frontend files this plan committed:
${front.map(f => `- ${f}`).join('\n')}

${
    recheck
      ? `This is a RE-CHECK after fixes. Run only these flows, which failed last round:
${recheck.map(f => `- ${f}`).join('\n')}`
      : 'Pick three to six flows, favouring the ones a user hits first.'
  }

Before any flow, health-check a route this plan did NOT touch. If it does not render,
the environment is broken rather than the code: return status SKIPPED with the reason
as a concern and no findings at all. The same applies when no browser driver is
available — SKIPPED with a concern, never a fabricated pass.

Every flow you report needs a screenshot path and its console output. A claim that a
flow worked is not evidence that it ran.`
}

function implementerPrompt(group, waveLabel) {
  const multi = group.length > 1
  const files = [...new Set(group.flatMap(t => t.files ?? []))]

  return `You are implementing ${multi ? `${group.length} tasks` : 'exactly one task'} from an approved implementation plan (${waveLabel}).
Other implementers are working on other tasks of the same wave, in parallel, in this
same checkout. Stay inside your file boundary.${
    multi
      ? `

You hold more than one task because they share an owner: the same Role, or the same
file. Do them **one at a time, in the order listed**, each complete — test first, then
implementation, then its verification — before you open the next. They are separate
tasks that happen to share your setup reads, not one merged task.`
      : ''
  }

## Where You Work

    WORKTREE_ROOT = ${repoRoot}

This run may be happening in a git worktree rather than the project's main checkout.
Before your first write, run \`git rev-parse --show-toplevel\`. If it does not print
WORKTREE_ROOT exactly, every path you use must be built as
\`WORKTREE_ROOT + '/' + <path relative to the repo>\` — do not rely on your working
directory.

Paths in the plan are repo-relative even when the plan wrote them as absolute. An
absolute path in the plan that does not start with WORKTREE_ROOT belongs to a
different checkout: strip its prefix and re-anchor it under WORKTREE_ROOT. Writing
to it as written puts your work in a checkout this run will never commit, and the
wave lands half-finished.

Report every path in \`filesTouched\` relative to WORKTREE_ROOT.

## Your Task${multi ? 's' : ''}

Your specification lives in the plan at \`${planRef}\`. Read ${multi ? 'each range below' : 'the range below'}
with the Read tool, using \`offset\` and \`limit\`, before doing anything else. Read
${multi ? 'those ranges' : 'that range'} and nothing else of the plan — the rest belongs to other implementers.

${group
  .map(
    (t, i) =>
      `${multi ? `${i + 1}. ` : ''}**${t.title}** — \`Read("${planRef}", offset: ${t.specLines?.start ?? 1}, limit: ${Math.max(1, (t.specLines?.end ?? 1) - (t.specLines?.start ?? 1) + 1)})\``,
  )
  .join('\n')}

If the first line you read is not the task heading named above, the range drifted:
\`Grep\` the plan for the heading and read from there instead. If you still cannot
find the task, STOP and report it as a blocker rather than implementing a guess.

## Files You Own

${
  multi
    ? group
        .map(t => `**${t.title}**\n${(t.files ?? []).map(f => `- ${f}`).join('\n') || '- none declared'}`)
        .join('\n\n') +
      `

The list is split per task on purpose. Writing task A's file while doing task B puts
a change in a commit whose message never mentions it, and the reviewer reads the two
as one edit. Finish a task before touching the next one's files.`
    : files.map(f => `- ${f}`).join('\n')
}

You may READ anything in the repository. You may WRITE only to the files above. If
the task cannot be completed without writing outside that list, STOP and report the
blocker instead of widening the boundary — another implementer may own that file
right now.

## Contracts You Consume

${group.map(t => t.consumes).filter(Boolean).join('\n\n') || 'None declared — this task depends on no earlier wave.'}

Use these exactly as declared. Do not redefine, widen, or "improve" them. If a
contract you were given does not match what is on disk, STOP and report the
mismatch — it means an earlier wave diverged.

## Test First — Do This Before Writing Any Implementation

${
  // A task drives out behavior only when the plan gave it a real RED command.
  // `n/a` is the declared exception; a missing field is a nuxt-plan task, which
  // has no RED contract at all. Both take the no-red branch — inventing a test to
  // satisfy a field the plan never wrote is worse than reporting its absence.
  group.every(t => !(t.red ?? '').trim() || (t.red ?? '').trim().toLowerCase().startsWith('n/a'))
    ? `${multi ? 'No task here declares a RED command' : 'This task declares no RED command'}${
        group.some(t => (t.red ?? '').trim())
          ? ' — the plan wrote `n/a`, meaning no testable behavior (schema/migration or pure module composition)'
          : ' — this plan carries no RED contract for this kind of task'
      }. Report that verbatim as \`redOutput\`, with the plan's stated reason when it
gave one. Do not invent a test to fill the field.`
    : `For each task that declares a RED command below: write the test first, run the
command, and confirm it fails **for the declared reason**.

${group
  .map(t => `- **${t.title}** — ${t.red ? `\`${t.red}\`` : 'no RED declared in the plan; say so in `redOutput` rather than inventing one'}`)
  .join('\n')}

A test that fails because a module cannot be imported, a provider cannot be
resolved, or the file does not parse proves nothing — it never exercised the
behavior. That is a red run you must fix before implementing, not a red run you
report. Fix the test until it fails for the behavior it is supposed to drive out.

Then implement, minimally, until it passes.

Report the ACTUAL output of the red run in \`redOutput\`, plus one line on why that
output proves the test was real. Do not paste the whole runner transcript — the
failing assertion or error and its reason are what matter. If you implemented before
running red, say so plainly in \`redOutput\`; an honest report is recoverable, a
fabricated one is not.`
}

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
