import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..', '..')
const skillsRoot = resolve(root, 'plugins/nimbou-skills/skills')
const shippedSkills = readdirSync(skillsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), 'utf8')
}

test('nuxt catalog skill files exist and describe validate-then-generate mode', () => {
  const files = [
    'plugins/nimbou-skills/skills/nuxt-catalog/SKILL.md',
    'bin/nb-catalog',
    'install.sh',
    'scripts/setup-codex-full-wrapper.sh',
    'plugins/nimbou-skills/skills/nuxt-catalog/scripts/generate-catalog.ts',
    'plugins/nimbou-skills/skills/nuxt-catalog/scripts/install.sh',
    'plugins/nimbou-skills/skills/nuxt-catalog/reference/catalog-schema.md',
    'plugins/nimbou-skills/skills/nuxt-catalog/reference/taxonomy.md',
  ]

  for (const file of files) {
    assert.equal(existsSync(resolve(root, file)), true, `${file} should exist`)
  }

  const skill = read('plugins/nimbou-skills/skills/nuxt-catalog/SKILL.md')
  assert.match(skill, /validate -> generate/)
  assert.match(skill, /catalog:generate/)
  assert.match(skill, /nb-catalog:validate/)
  assert.match(skill, /\/var\/www\/nimbou-skills\/install\.sh/)
  assert.match(skill, /nb-catalog validate/)
  assert.match(skill, /CATALOG_ROOT/)
  assert.match(skill, /npm --prefix/)
  assert.match(skill, /\.claude\/skills\/nuxt-catalog/)
  assert.match(skill, /install\.sh/)
  assert.match(skill, /Machine Bootstrap/)
  assert.match(skill, /machine-level/i)
  assert.match(skill, /skills\/nuxt-catalog\/scripts\/generate-catalog\.ts/)
  assert.match(skill, /components\.meta\.json/)
  assert.match(skill, /\.generated\/component-catalog\/components\.meta\.json/)
  assert.doesNotMatch(skill, /(^|\n)\s*catalog validate/m)
})

test('distribution manifests exist for Claude and Codex packaging', () => {
  assert.equal(existsSync(resolve(root, '.claude-plugin/marketplace.json')), true)
  assert.equal(existsSync(resolve(root, 'plugins/nimbou-skills/.codex-plugin/plugin.json')), true)
  assert.equal(existsSync(resolve(root, '.agents/plugins/marketplace.json')), true)
})

test('nuxt think and plan skills explain catalog-aware design and execution topology', () => {
  const files = [
    'plugins/nimbou-skills/skills/nuxt-think/SKILL.md',
    'plugins/nimbou-skills/skills/nuxt-plan/SKILL.md',
    'plugins/nimbou-skills/skills/nuxt-plan/reference/plan-format.md',
    'plugins/nimbou-skills/skills/nuxt-audit/reference/design-md-template.md',
    'plugins/nimbou-skills/skills/nuxt-audit/reference/guidelines-template.md',
  ]

  for (const file of files) {
    assert.equal(existsSync(resolve(root, file)), true, `${file} should exist`)
  }

  const think = read('plugins/nimbou-skills/skills/nuxt-think/SKILL.md')
  const plan = read('plugins/nimbou-skills/skills/nuxt-plan/SKILL.md')

  assert.match(think, /components\.meta\.json/)
  assert.match(think, /\.generated\/component-catalog\/components\.meta\.json/)
  assert.match(think, /tags`, `category`, and `domain/)
  assert.match(think, /## Think Output/)
  assert.match(think, /This skill owns discovery and design closure/i)
  assert.match(think, /`DESIGN\.md` and `GUIDELINES\.md`/i)
  assert.match(think, /loading, empty, error, and success states/i)
  assert.match(think, /responsive layout shifts/i)
  assert.match(think, /### Direcao visual/)
  assert.match(think, /anti-genericity guardrails/i)
  assert.match(think, /exact file paths and execution waves/i)
  assert.match(plan, /## Scope Check/)
  assert.match(plan, /## Minimal Clarifications Only/)
  assert.match(plan, /Assume `nuxt-think` already closed product and UI decisions\./)
  assert.match(plan, /exact route or page file path/i)
  assert.match(plan, /Do not reopen settled UX, reuse, state, interaction, or responsive decisions/i)
  assert.match(plan, /## Self-Review/)
  assert.match(plan, /## Ondas de Execução/)
  assert.match(plan, /DESIGN\.md/)
  assert.match(plan, /GUIDELINES\.md/)
  assert.match(plan, /catalog verification/i)
  assert.match(plan, /validate -> generate/)
  assert.match(plan, /wait for user approval/i)
  assert.match(plan, /executing-plans/)
})

test('shared specification skills are shipped with the tree', () => {
  assert.ok(shippedSkills.includes('doc-domain'))
  assert.ok(shippedSkills.includes('doc-gherkin'))
  assert.ok(shippedSkills.includes('doc-openapi'))
  assert.ok(shippedSkills.includes('change-spec'))
  assert.ok(shippedSkills.includes('feat-spec'))
  assert.ok(shippedSkills.includes('request-review'))
  assert.ok(shippedSkills.includes('apply-review'))
})

test('platform test skills are shipped with the tree', () => {
  assert.ok(shippedSkills.includes('nuxt-test'))
  assert.ok(shippedSkills.includes('nestjs-test'))
  assert.equal(shippedSkills.includes('nestjs-audit-http-tests'), false)
  assert.equal(shippedSkills.includes('nestjs-audit-prisma-repositories'), false)
})

test('core and audit skills document their new guardrails', () => {
  const files = [
    'plugins/nimbou-skills/skills/nestjs-think/SKILL.md',
    'plugins/nimbou-skills/skills/nestjs-plan/SKILL.md',
    'plugins/nimbou-skills/skills/executing-plans/SKILL.md',
    'plugins/nimbou-skills/skills/e2e-test-quality/SKILL.md',
    'plugins/nimbou-skills/skills/nestjs-debug/SKILL.md',
    'plugins/nimbou-skills/skills/nuxt-audit/SKILL.md',
    'plugins/nimbou-skills/skills/nuxt-audit/reference/quality-rules.md',
    'plugins/nimbou-skills/skills/nuxt-test/SKILL.md',
    'plugins/nimbou-skills/skills/nuxt-test/reference/test-conventions.md',
    'plugins/nimbou-skills/skills/nestjs-test/SKILL.md',
    'plugins/nimbou-skills/skills/nestjs-test/reference/test-conventions.md',
    'plugins/nimbou-skills/skills/nuxt-debug/SKILL.md',
  ]

  for (const file of files) {
    assert.equal(existsSync(resolve(root, file)), true, `${file} should exist`)
  }

  const nestjsThink = read('plugins/nimbou-skills/skills/nestjs-think/SKILL.md')
  const nestjsPlan = read('plugins/nimbou-skills/skills/nestjs-plan/SKILL.md')
  const execute = read('plugins/nimbou-skills/skills/executing-plans/SKILL.md')
  const e2eQuality = read('plugins/nimbou-skills/skills/e2e-test-quality/SKILL.md')
  const systematic = read('plugins/nimbou-skills/skills/nestjs-debug/SKILL.md')
  const nuxtAudit = read('plugins/nimbou-skills/skills/nuxt-audit/SKILL.md')
  const qualityRules = read('plugins/nimbou-skills/skills/nuxt-audit/reference/quality-rules.md')
  const testSkill = read('plugins/nimbou-skills/skills/nuxt-test/SKILL.md')
  const testRules = read('plugins/nimbou-skills/skills/nuxt-test/reference/test-conventions.md')
  const nestjsTest = read('plugins/nimbou-skills/skills/nestjs-test/SKILL.md')
  const nestjsTestRules = read('plugins/nimbou-skills/skills/nestjs-test/reference/test-conventions.md')
  const nuxtDebug = read('plugins/nimbou-skills/skills/nuxt-debug/SKILL.md')
  const designMdTemplate = read('plugins/nimbou-skills/skills/nuxt-audit/reference/design-md-template.md')
  const guidelinesTemplate = read('plugins/nimbou-skills/skills/nuxt-audit/reference/guidelines-template.md')
  assert.match(nestjsThink, /^---\nname: nestjs-think/m)
  assert.match(nestjsThink, /NestJS/)
  assert.match(nestjsThink, /Prisma/)
  assert.match(nestjsThink, /Clean Architecture/)
  assert.match(nestjsPlan, /^---\nname: nestjs-plan/m)
  assert.match(nestjsPlan, /repository contracts/i)
  assert.match(nestjsPlan, /Prisma adapters/i)
  assert.match(execute, /wave mode only/i)
  assert.match(execute, /parallel/)
  assert.match(execute, /nimbou-skills:nuxt-plan/)
  assert.match(execute, /wave-structured frontend plans/i)
  assert.match(execute, /spec-reviewer-prompt\.md/)
  assert.match(execute, /followups-template\.md/)
  // Commit cadence is a Step 2 rule, so it is asserted where it is normative. The
  // router restating every executor rule is what let the two drift apart before.
  assert.match(read('plugins/nimbou-skills/skills/executing-plans/prose-execution.md'), /commit once per wave/i)
  assert.doesNotMatch(execute, /task mode/i)
  assert.match(e2eQuality, /^---\nname: e2e-test-quality/m)
  assert.match(e2eQuality, /e2e-quality-auditor/)
  assert.match(e2eQuality, /Playwright/)
  assert.match(e2eQuality, /Cypress/)
  assert.match(e2eQuality, /bounded user flow/i)
  assert.match(e2eQuality, /nuxt-test/)
  assert.match(e2eQuality, /nestjs-test/)
  assert.match(systematic, /^---\nname: nestjs-debug/m)
  assert.match(systematic, /NestJS/)
  assert.match(systematic, /Prisma/)
  assert.match(systematic, /Clean Architecture/)
  assert.match(systematic, /request, module, use-case, repository, Prisma flow/i)
  assert.match(nuxtAudit, /^---\nname: nuxt-audit/m)
  assert.match(nuxtAudit, /single frontend review pass/i)
  assert.match(nuxtAudit, /nearest `DESIGN\.md` and `GUIDELINES\.md`/i)
  assert.match(nuxtAudit, /Hardening/i)
  assert.match(nuxtAudit, /Performance/i)
  assert.match(nuxtAudit, /Polish/i)
  assert.match(nuxtAudit, /Do not split the review into separate "harden", "extract", "optimize", or "polish" passes/i)
  assert.match(nuxtAudit, /Critico/)
  assert.match(qualityRules, /Design File First/)
  assert.match(qualityRules, /Extraction and Reuse/)
  assert.match(qualityRules, /Hardening/)
  assert.match(qualityRules, /Performance/)
  assert.match(qualityRules, /Polish/)
  assert.match(qualityRules, /Vuetify/)
  assert.match(testSkill, /module-bounded Playwright and E2E discipline/i)
  assert.match(testSkill, /test, the frontend, the environment\/setup/i)
  assert.match(testSkill, /critical happy path/i)
  assert.match(testSkill, /Use `nimbou-skills:nuxt-debug` when the main job is to investigate/i)
  assert.match(testRules, /getByRole\(\)/)
  assert.match(testRules, /getByTestId\(\)/)
  assert.match(testRules, /waitForTimeout\(\)/)
  assert.match(nestjsTest, /^---\nname: nestjs-test/m)
  assert.match(nestjsTest, /Read `reference\/test-conventions\.md` before changing tests\./i)
  assert.match(nestjsTest, /use `nestjs-debug` when the main task is to investigate runtime behavior before deciding how to test it/i)
  assert.match(nestjsTest, /Use this skill when the main job is:/i)
  assert.match(nestjsTest, /gherkin-driven mode/i)
  assert.match(nestjsTest, /audit mode/i)
  assert.match(nestjsTest, /stabilize mode/i)
  assert.match(nestjsTest, /## Workflow/)
  assert.match(nestjsTest, /nestjs-http-test-auditor/i)
  assert.match(nestjsTest, /prisma-repository-test-auditor/i)
  assert.match(nestjsTestRules, /bounded backend flow or persistence slice/i)
  assert.match(nestjsTestRules, /explicit HTTP status, payload shape, and database state assertions/i)
  assert.match(nestjsTestRules, /nestjs-debug/i)
  assert.match(nuxtDebug, /^---\nname: nuxt-debug/m)
  assert.match(nuxtDebug, /Chrome DevTools MCP/i)
  // The server this repo installs is `chrome-devtools`, so its tools are
  // `mcp__chrome-devtools__*`. An underscored prefix names a server that does not
  // exist, and every tool call in this skill silently fails to resolve.
  assert.match(nuxtDebug, /mcp__chrome-devtools__take_snapshot/)
  assert.doesNotMatch(nuxtDebug, /mcp__chrome_devtools__/)
  assert.match(nuxtDebug, /Playwright/)
  assert.match(nuxtDebug, /hydration/i)
  assert.match(nuxtDebug, /NO FRONTEND FIXES BEFORE LIVE BROWSER EVIDENCE/)
  assert.match(nuxtDebug, /QA inventory/i)
  assert.match(nuxtDebug, /Boundary With `nuxt-test`/)
  assert.match(designMdTemplate, /Nuxt Frontend DESIGN\.md Template/)
  assert.match(designMdTemplate, /version: alpha/)
  assert.match(designMdTemplate, /## Overview/)
  assert.match(designMdTemplate, /Primary register/i)
  assert.match(designMdTemplate, /## Colors/)
  assert.match(designMdTemplate, /## Components/)
  assert.match(designMdTemplate, /## Do's and Don'ts/)
  assert.match(guidelinesTemplate, /Nuxt Frontend GUIDELINES\.md Template/)
  assert.match(guidelinesTemplate, /primary register/i)
  assert.match(guidelinesTemplate, /## Component Architecture/)
  assert.match(guidelinesTemplate, /## Hardening Expectations/)
  assert.match(guidelinesTemplate, /## Audit Expectations/)
})

test('design, merge, and review agents remain scaffolded', () => {
  const designCommand = read('plugins/nimbou-skills/commands/design-md.md')
  const mergeCommand = read('plugins/nimbou-skills/commands/merge-pr.md')
  const designSkill = read('.codex/skills/design-md/SKILL.md')
  const mergeSkill = read('.codex/skills/merge-pr/SKILL.md')
  const explorer = read('plugins/nimbou-skills/agents/code-explorer.md')
  const architect = read('plugins/nimbou-skills/agents/code-architect.md')
  const reviewer = read('plugins/nimbou-skills/agents/code-reviewer.md')
  const guidelinesAnalyzer = read('plugins/nimbou-skills/agents/guidelines-gap-analyzer.md')
  const e2eAuditor = read('plugins/nimbou-skills/agents/e2e-quality-auditor.md')

  assert.match(designCommand, /^---\ndescription:/m)
  assert.match(designCommand, /DESIGN\.md/)
  assert.match(designCommand, /GUIDELINES\.md/)
  assert.match(designCommand, /register/i)
  assert.match(designCommand, /scan mode/i)
  assert.match(designCommand, /seed mode/i)
  assert.match(designCommand, /monorepo/i)
  assert.match(designCommand, /app root/i)
  assert.match(designCommand, /repository root/i)
  assert.match(designCommand, /design-md-template\.md/i)
  assert.match(designCommand, /guidelines-template\.md/i)
  assert.match(designCommand, /CSS custom properties/i)
  assert.match(designCommand, /Never silently overwrite/i)
  assert.match(designCommand, /design\.md lint/i)
  assert.match(designCommand, /npx @google\/design\.md lint/i)
  assert.match(designCommand, /create or refresh/i)
  assert.match(designSkill, /^---\nname: design-md/m)
  assert.match(designSkill, /Capture the target from the user's request/)
  assert.match(designSkill, /Ask only the missing high-impact strategic and qualitative questions/)
  assert.match(designSkill, /complement it instead of replacing it/i)
  assert.match(designSkill, /design\.md lint/i)
  assert.match(designSkill, /scan mode/i)
  assert.match(designSkill, /seed mode/i)
  assert.match(designSkill, /register/i)

  assert.match(mergeCommand, /^---\ndescription:/m)
  assert.match(mergeCommand, /Merge a single PR/i)
  assert.match(mergeCommand, /Never merge without showing the effective PR state first/)
  assert.match(mergeCommand, /Never merge a draft PR/)
  assert.match(mergeCommand, /auto-merge/i)
  assert.match(mergeCommand, /gh pr merge/)
  assert.match(mergeCommand, /1\. Merge now/)
  assert.match(mergeCommand, /merged/)
  assert.match(mergeCommand, /auto-merge enabled/)
  assert.match(mergeCommand, /skipped/)
  assert.match(mergeCommand, /failed/)
  assert.doesNotMatch(mergeCommand, /batch/i)
  assert.match(mergeSkill, /^---\nname: merge-pr/m)
  assert.match(mergeSkill, /Merge a single PR/i)
  assert.match(mergeSkill, /Never merge without showing the effective PR state first/)
  assert.doesNotMatch(mergeSkill, /batch/i)

  assert.match(explorer, /^---\nname: code-explorer/m)
  assert.match(explorer, /Key Files To Read/)
  assert.match(explorer, /path:line - why it matters/)

  assert.match(architect, /^---\nname: code-architect/m)
  assert.match(architect, /minimal changes/)
  assert.match(architect, /clean architecture/)
  assert.match(architect, /pragmatic balance/)

  assert.match(reviewer, /^---\nname: code-reviewer/m)
  assert.match(reviewer, /Only report issues with confidence `>= 80`/)
  assert.match(reviewer, /Optional Review Focus/)
  assert.match(reviewer, /Critical/)
  assert.match(reviewer, /Important/)

  assert.match(guidelinesAnalyzer, /^---\nname: guidelines-gap-analyzer/m)
  assert.match(guidelinesAnalyzer, /Only report findings with confidence `>= 80`/)
  assert.match(guidelinesAnalyzer, /AGENTS\.md/)
  assert.match(guidelinesAnalyzer, /GUIDELINES\.md/)
  assert.match(guidelinesAnalyzer, /`code-reviewer` remains the default reviewer/)

  assert.match(e2eAuditor, /^---\nname: 'e2e-quality-auditor'/m)
  assert.match(e2eAuditor, /Playwright, Cypress/)
  assert.match(e2eAuditor, /deterministic, trustworthy E2E confidence/i)
  assert.match(e2eAuditor, /Run only the target E2E tests/i)
  assert.match(e2eAuditor, /selectors tied to unstable markup/i)
  assert.match(e2eAuditor, /waitForTimeout/i)
})

test('role-specialized author agents are scaffolded for SDD routing', () => {
  const roleAgents = [
    {
      file: 'plugins/nimbou-skills/agents/prisma-schema-author.md',
      slug: 'prisma-schema-author',
      scopeMatch: /schema\.prisma/,
      boundaryMatch: /expand\/migrate\/contract/i,
    },
    {
      file: 'plugins/nimbou-skills/agents/prisma-repository-author.md',
      slug: 'prisma-repository-author',
      scopeMatch: /repository adapter/i,
      boundaryMatch: /Prisma stays here, port lives in application/i,
    },
    {
      file: 'plugins/nimbou-skills/agents/nestjs-usecase-author.md',
      slug: 'nestjs-usecase-author',
      scopeMatch: /one application use-case/i,
      boundaryMatch: /No imports from `@prisma\/client`/,
    },
    {
      file: 'plugins/nimbou-skills/agents/nestjs-controller-author.md',
      slug: 'nestjs-controller-author',
      // The only author whose task is pure transport wiring against a contract that
      // already exists: parse -> call the use-case -> map. No design decision is left
      // for it to make, so it runs a tier below the other authors.
      model: 'haiku',
      scopeMatch: /HTTP transport/,
      boundaryMatch: /3-step coordinator/i,
    },
    {
      file: 'plugins/nimbou-skills/agents/vue-component-author.md',
      slug: 'vue-component-author',
      scopeMatch: /Vue 3 SFC/,
      boundaryMatch: /component catalog/i,
    },
    {
      file: 'plugins/nimbou-skills/agents/nuxt-composable-author.md',
      slug: 'nuxt-composable-author',
      scopeMatch: /composable/,
      boundaryMatch: /no markup/i,
    },
    {
      file: 'plugins/nimbou-skills/agents/nuxt-page-author.md',
      slug: 'nuxt-page-author',
      scopeMatch: /Nuxt page, layout, or route/i,
      boundaryMatch: /No new component\/composable\/store crept in/i,
    },
  ]

  for (const { file, slug, model = 'sonnet', scopeMatch, boundaryMatch } of roleAgents) {
    assert.equal(existsSync(resolve(root, file)), true, `${file} should exist`)
    const body = read(file)
    assert.match(body, new RegExp(`^---\\nname: ${slug}`, 'm'), `${slug} frontmatter name`)
    // Every agent in this list is a code author: bounded work against a task the
    // plan already closed. `inherit` would put each one on the session model, which
    // on an opus setup means a full opus session per implementer dispatched. Sonnet
    // is the default; an entry may drop a tier, but never inherit and never opus.
    assert.match(body, new RegExp(`^model: ${model}$`, 'm'), `${slug} should pin model: ${model}`)
    assert.match(body, /memory: project/, `${slug} should set memory: project`)
    assert.match(body, /## Scope/, `${slug} should declare ## Scope`)
    assert.match(body, /## Mandatory Execution Order/, `${slug} should declare ## Mandatory Execution Order`)
    assert.match(body, /## You may not/, `${slug} should declare ## You may not`)
    assert.match(body, /## Delivery Format/, `${slug} should declare ## Delivery Format`)
    assert.match(body, /DONE_WITH_CONCERNS/, `${slug} should mention DONE_WITH_CONCERNS`)
    assert.match(body, /NEEDS_CONTEXT/, `${slug} should mention NEEDS_CONTEXT`)
    assert.match(body, /BLOCKED/, `${slug} should mention BLOCKED`)
    assert.match(body, scopeMatch, `${slug} body should mention its scope keyword`)
    assert.match(body, boundaryMatch, `${slug} body should mention its boundary rule`)
  }
})

test('planners and executing-plans wire the Role: routing contract', () => {
  const nestjsPlan = read('plugins/nimbou-skills/skills/nestjs-plan/SKILL.md')
  const nuxtPlan = read('plugins/nimbou-skills/skills/nuxt-plan/SKILL.md')
  const nuxtPlanFormat = read('plugins/nimbou-skills/skills/nuxt-plan/reference/plan-format.md')
  const execute = read('plugins/nimbou-skills/skills/executing-plans/prose-execution.md')
  const executeImplementer = read('plugins/nimbou-skills/skills/executing-plans/implementer-prompt.md')
  const executeSpec = read('plugins/nimbou-skills/skills/executing-plans/spec-reviewer-prompt.md')

  assert.match(nestjsPlan, /## Role Mapping/)
  assert.match(nestjsPlan, /\*\*Role:\*\*/)
  assert.match(nestjsPlan, /prisma-schema-author/)
  assert.match(nestjsPlan, /prisma-repository-author/)
  assert.match(nestjsPlan, /nestjs-usecase-author/)
  assert.match(nestjsPlan, /nestjs-controller-author/)

  assert.match(nuxtPlan, /## Role Mapping/)
  assert.match(nuxtPlan, /vue-component-author/)
  assert.match(nuxtPlan, /nuxt-composable-author/)
  assert.match(nuxtPlan, /nuxt-page-author/)
  assert.match(nuxtPlan, /\| Acao \| Caminho \| Onda \| Role \| Depende de \|/)

  assert.match(nuxtPlanFormat, /Role per file/)
  assert.match(nuxtPlanFormat, /vue-component-author/)
  assert.match(nuxtPlanFormat, /nuxt-composable-author/)
  assert.match(nuxtPlanFormat, /nuxt-page-author/)

  assert.match(execute, /## Role Routing/)
  for (const slug of [
    'prisma-schema-author',
    'prisma-repository-author',
    'nestjs-usecase-author',
    'nestjs-controller-author',
    'vue-component-author',
    'nuxt-composable-author',
    'nuxt-page-author',
  ]) {
    assert.match(execute, new RegExp(slug), `executing-plans prose path should list ${slug} in Role Routing`)
  }
  assert.match(execute, /Fallback:.*general-purpose/i)
  assert.match(execute, /Never infer a role from the file path/i)

  assert.match(executeImplementer, /\[ROLE\]/)
  assert.match(executeImplementer, /Task tool \(\[ROLE\]\):/)
  assert.match(executeSpec, /## Role Under Review/)
  assert.match(executeSpec, /\[ROLE\]/)
})

test('browser-smoke ships as a standalone skill and is wired into executing-plans', () => {
  const files = [
    'plugins/nimbou-skills/skills/browser-smoke/SKILL.md',
    'plugins/nimbou-skills/skills/browser-smoke/reference/environment-discovery.md',
  ]
  for (const file of files) {
    assert.equal(existsSync(resolve(root, file)), true, `${file} should exist`)
  }

  const smoke = read('plugins/nimbou-skills/skills/browser-smoke/SKILL.md')
  assert.match(smoke, /^---\nname: browser-smoke/m)
  assert.ok(shippedSkills.includes('browser-smoke'))

  // The two rules that keep the lens honest: it never invents a pass, and it never
  // blames the code for an environment that was never usable.
  assert.match(smoke, /health-check|Health check/i)
  assert.match(smoke, /route the change did NOT touch/i)
  assert.match(smoke, /Chrome DevTools MCP/)
  assert.match(smoke, /skip the smoke and say so loudly/i)
  assert.match(smoke, /do not\s+report the change as verified/i)
  assert.match(smoke, /screenshot/i)
  assert.match(smoke, /A claim that a flow worked is not evidence that it ran/)
  // Flows come from the promise, not the file list — the distinction the whole
  // skill exists for.
  assert.match(smoke, /Derive the flows from what was promised/i)
  assert.match(smoke, /`report`/)
  assert.match(smoke, /`fix`/)
  // Boundary against the three skills it would otherwise duplicate.
  assert.match(smoke, /nimbou-skills:nuxt-debug/)
  assert.match(smoke, /nimbou-skills:nuxt-test/)
  assert.match(smoke, /This skill writes no tests/)

  const env = read('plugins/nimbou-skills/skills/browser-smoke/reference/environment-discovery.md')
  assert.match(env, /Never assume 3000/i, 'a worktree collides with the main checkout on the default port')
  assert.match(env, /Cleanup/)
  assert.match(env, /Editing `\.env`/, 'mutating the project to make the app start makes the smoke its own variable')

  // Step 5 must exist in the normative prose, not only in the workflow — Codex runs
  // the prose path and would otherwise silently lose the lens.
  const prose = read('plugins/nimbou-skills/skills/executing-plans/prose-execution.md')
  assert.match(prose, /## Step 5: Browser Smoke/)
  assert.match(prose, /`report` mode/)
  assert.match(prose, /\*\*`SKIPPED` is not a failure\.\*\*/)
  assert.match(prose, /at most once/, 'the fix cycle reopens twice, not forever')
  assert.match(prose, /browser-issue/)

  const template = read('plugins/nimbou-skills/skills/executing-plans/followups-template.md')
  assert.match(template, /`browser-issue`/)

  const router = read('plugins/nimbou-skills/skills/executing-plans/SKILL.md')
  assert.match(router, /nimbou-skills:browser-smoke/)
})

test('planners require a task to declare every file it tells the implementer to edit', () => {
  // The 2026-08-09 run stopped on wave 1 because a task said to add the inverse side
  // of a relation in `file.prisma` and no task listed that file. The implementer was
  // right to refuse to widen its own boundary; the plan was wrong to make it choose.
  const planners = [
    'plugins/nimbou-skills/skills/nestjs-plan/SKILL.md',
    'plugins/nimbou-skills/skills/nuxt-plan/SKILL.md',
    'plugins/nimbou-skills/skills/fullstack-plan/SKILL.md',
  ]

  for (const file of planners) {
    const body = read(file)
    assert.match(body, /## Self-Review/, `${file} should have a self-review`)
    assert.match(body, /Write-set completeness/i, `${file} must check that Files covers every edited path`)
    assert.match(
      body,
      /every concrete file path[\s\S]{0,240}`Files`/i,
      `${file} must tie paths named in the task body to its Files field`,
    )
  }
})

test('planners forbid a task from consuming a sibling in its own wave', () => {
  // The 2026-08-10 fullstack plan put a shared composition service inside the task
  // that also implemented the first of its two consumers, and both consumers sat in
  // the same wave. Nothing in the self-reviews caught it: the only serialization check
  // compared frontend tasks against backend ones. Worse, `executing-plans` coalesces
  // same-Role tasks into one implementer that runs them in order, so the pair would
  // have worked whenever the cap put them in the same lane — a defect that passes and
  // returns after an unrelated reordering.
  const planners = [
    'plugins/nimbou-skills/skills/nestjs-plan/SKILL.md',
    'plugins/nimbou-skills/skills/nuxt-plan/SKILL.md',
    'plugins/nimbou-skills/skills/fullstack-plan/SKILL.md',
  ]

  for (const file of planners) {
    const body = read(file)
    assert.match(
      body,
      /same wave|its \*\*own\*\* wave|own wave/i,
      `${file} must tell the planner to check for a producer inside the same wave`,
    )
    assert.match(
      body,
      /same declarations as Task/i,
      `${file} must reject a Consome written as a pointer to a sibling task`,
    )
  }
})

test('planners forbid tombstone task headings and prose in the Role field', () => {
  // Both are parse hazards, not style: every `#### Task N` heading is dispatched, and
  // `Role` is copied verbatim into the agent type. A heading kept to explain removed
  // work opens an implementer to read the word "removed"; a justification written into
  // `Role` becomes a nonexistent agent type.
  const planners = [
    'plugins/nimbou-skills/skills/nestjs-plan/SKILL.md',
    'plugins/nimbou-skills/skills/nuxt-plan/SKILL.md',
    'plugins/nimbou-skills/skills/fullstack-plan/SKILL.md',
  ]

  for (const file of planners) {
    const body = read(file)
    assert.match(body, /tombstone/i, `${file} must forbid a task heading kept for removed work`)
    assert.match(
      body,
      /verbatim into the agent type/i,
      `${file} must say why the Role field cannot hold prose`,
    )
  }
})

test('fullstack-plan warns that dispatch count is not task count', () => {
  // `executing-plans` coalesces by Role (one implementer per Role per wave, cap three).
  // A planner that sizes a wave by counting tasks advises on a run that does not exist.
  const body = read('plugins/nimbou-skills/skills/fullstack-plan/SKILL.md')
  assert.match(body, /Dispatch is not task count/i)
  assert.match(
    body,
    /one implementer per `Role` per wave/i,
    'fullstack-plan must state the coalescing rule it is warning about',
  )
  assert.match(
    body,
    /hide an intra-wave dependency|can be masked|masked/i,
    'fullstack-plan must link coalescing to the intra-wave dependency hazard',
  )
})

test('fullstack-plan resolves the final-wave Role exception instead of leaving it to guesswork', () => {
  // fullstack-plan said every task carries every field; nestjs-plan said the nestjs-test
  // wave declares no Role. The contradiction was resolved by filling Role with prose.
  const body = read('plugins/nimbou-skills/skills/fullstack-plan/SKILL.md')
  assert.match(
    body,
    /one exception[\s\S]{0,400}nestjs-test final wave|nestjs-test` final wave declares \*\*no `Role`\*\*/i,
    'fullstack-plan must name the final-wave Role exception explicitly',
  )
})

test('apply-review requires an inventory before a "single point" fix', () => {
  const body = read('plugins/nimbou-skills/skills/apply-review/SKILL.md')
  assert.match(body, /Enumerate Before Fixing/i)
  assert.match(body, /grep the pattern/i, 'listing occurrences is the cheap step that gets skipped')
  assert.match(body, /assert the whole set/i, 'the test for this fix is the inventory, not the reported case')
})
