import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), 'utf8')
}

test('skills tree ships the unified skill set directly', () => {
  const skillsRoot = resolve(root, 'plugins/nimbou-skills/skills')
  const shippedSkills = readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  assert.equal(existsSync(skillsRoot), true)
  assert.ok(shippedSkills.includes('nestjs-think'))
  assert.ok(shippedSkills.includes('nestjs-plan'))
  assert.ok(shippedSkills.includes('nestjs-refactor'))
  assert.ok(shippedSkills.includes('executing-plans'))
  assert.ok(shippedSkills.includes('fullstack-plan'))
  assert.ok(shippedSkills.includes('e2e-test-quality'))
  assert.ok(shippedSkills.includes('flow-audit'))
  assert.ok(shippedSkills.includes('change-plan'))
  assert.ok(shippedSkills.includes('laravel-think'))
  assert.ok(shippedSkills.includes('laravel-plan'))
  assert.equal(shippedSkills.includes('laravel-execute'), false)
  assert.ok(shippedSkills.includes('feat-spec'))
  assert.ok(shippedSkills.includes('doc-domain'))
  assert.ok(shippedSkills.includes('doc-gherkin'))
  assert.ok(shippedSkills.includes('doc-openapi'))
  assert.ok(shippedSkills.includes('request-review'))
  assert.ok(shippedSkills.includes('apply-review'))
  assert.ok(shippedSkills.includes('nuxt-think'))
  assert.ok(shippedSkills.includes('nuxt-plan'))
  assert.ok(shippedSkills.includes('nuxt-catalog'))
  assert.ok(shippedSkills.includes('nuxt-audit'))
  assert.ok(shippedSkills.includes('nuxt-performance'))
  for (const skill of ['nuxt-design', 'nuxt-component-harden', 'craft-setup', 'craft-sync', 'craft-explore']) {
    assert.ok(shippedSkills.includes(skill))
  }
  for (const retired of ['design-md', 'nuxt-components-redesign']) {
    assert.ok(!shippedSkills.includes(retired))
  }
  assert.ok(shippedSkills.includes('refinar-google-ads'))
  assert.ok(shippedSkills.includes('nuxt-test'))
  assert.ok(shippedSkills.includes('nestjs-debug'))
  assert.ok(shippedSkills.includes('nuxt-debug'))
  assert.ok(shippedSkills.includes('nestjs-test'))
  assert.equal(shippedSkills.includes('nestjs-audit-http-tests'), false)
  assert.equal(shippedSkills.includes('nestjs-audit-prisma-repositories'), false)

  for (const skillName of shippedSkills) {
    const skillFile = resolve(skillsRoot, skillName, 'SKILL.md')
    assert.equal(existsSync(skillFile), true, `Missing scaffold file: ${skillFile}`)
    assert.match(readFileSync(skillFile, 'utf8'), /^---\nname: /, `Missing frontmatter in ${skillFile}`)
  }

  assert.equal(existsSync(resolve(root, 'plugins/nimbou-skills/.codex-plugin/plugin.json')), true)
  assert.equal(existsSync(resolve(root, '.agents/plugins/marketplace.json')), true)

  const codexPlugin = JSON.parse(read('plugins/nimbou-skills/.codex-plugin/plugin.json'))
  const codexMarketplace = JSON.parse(read('.agents/plugins/marketplace.json'))

  assert.equal(codexPlugin.name, 'nimbou-skills')
  assert.equal(codexPlugin.skills, './skills/')
  assert.match(codexPlugin.description, /Laravel/i)
  assert.equal(codexMarketplace.name, 'nimbou-skills')
  assert.equal(codexMarketplace.plugins[0].policy.installation, 'INSTALLED_BY_DEFAULT')
  assert.equal(codexMarketplace.plugins[0].source.source, 'local')
  assert.equal(codexMarketplace.plugins[0].source.path, './plugins/nimbou-skills')
})

test('Codex skills and supporting templates are packaged', () => {
  const files = [
    'plugins/nimbou-skills/skills/craft-setup/SKILL.md',
    'plugins/nimbou-skills/skills/merge-pr/SKILL.md',
    'scripts/setup-chrome-devtools-wrapper.sh',
    'scripts/setup-codex-skills.sh',
    'plugins/nimbou-skills/skills/nuxt-audit/reference/design-md-template.md',
    'plugins/nimbou-skills/skills/nuxt-audit/reference/guidelines-template.md',
  ]

  for (const file of files) {
    assert.equal(existsSync(resolve(root, file)), true, `${file} should exist`)
  }
})

test('specification skills and think orchestrators document the domain-centered layout and gate', () => {
  const files = [
    'plugins/nimbou-skills/skills/doc-domain/SKILL.md',
    'plugins/nimbou-skills/skills/doc-gherkin/SKILL.md',
    'plugins/nimbou-skills/skills/doc-openapi/SKILL.md',
    'plugins/nimbou-skills/skills/change-plan/SKILL.md',
    'plugins/nimbou-skills/skills/laravel-think/SKILL.md',
    'plugins/nimbou-skills/skills/laravel-plan/SKILL.md',
    'plugins/nimbou-skills/skills/nuxt-think/SKILL.md',
    'plugins/nimbou-skills/skills/nestjs-think/SKILL.md',
    'plugins/nimbou-skills/skills/feat-spec/SKILL.md',
  ]

  for (const file of files) {
    assert.equal(existsSync(resolve(root, file)), true, `${file} should exist`)
  }

  const domainSkill = read('plugins/nimbou-skills/skills/doc-domain/SKILL.md')
  const gherkinSkill = read('plugins/nimbou-skills/skills/doc-gherkin/SKILL.md')
  const openapiSkill = read('plugins/nimbou-skills/skills/doc-openapi/SKILL.md')
  const changePlan = read('plugins/nimbou-skills/skills/change-plan/SKILL.md')
  const laravelThink = read('plugins/nimbou-skills/skills/laravel-think/SKILL.md')
  const nuxtThink = read('plugins/nimbou-skills/skills/nuxt-think/SKILL.md')
  const nestjsThink = read('plugins/nimbou-skills/skills/nestjs-think/SKILL.md')
  const featSpec = read('plugins/nimbou-skills/skills/feat-spec/SKILL.md')
  const fullstackPlan = read('plugins/nimbou-skills/skills/fullstack-plan/SKILL.md')

  assert.match(domainSkill, /docs\/domain\/<domain>\/domain\.md/)
  assert.match(domainSkill, /domain-centered/i)
  assert.match(domainSkill, /^---\nname: doc-domain/m)
  assert.match(gherkinSkill, /docs\/domain\/<domain>\/\*\.feature/)
  assert.match(gherkinSkill, /shared specification layer/i)
  assert.match(gherkinSkill, /^---\nname: doc-gherkin/m)
  assert.match(openapiSkill, /docs\/domain\/<domain>\/openapi\.yaml/)
  assert.match(openapiSkill, /canonical HTTP transport contract/i)
  assert.match(openapiSkill, /Do not ask the user to approve `openapi\.yaml`/i)
  assert.match(openapiSkill, /self-check traceability and consistency/i)
  assert.match(openapiSkill, /after the selected backend design skill/i)
  assert.match(openapiSkill, /^---\nname: doc-openapi/m)
  assert.match(nuxtThink, /docs\/domain\/<domain>\//)
  assert.match(nuxtThink, /confirm `docs\/domain\/<domain>\/domain\.md` is closed/i)
  assert.match(nuxtThink, /confirm the relevant `docs\/domain\/<domain>\/\*\.feature` files are closed/i)
  assert.match(nuxtThink, /confirm `docs\/domain\/<domain>\/openapi\.yaml` is closed/i)
  assert.match(nuxtThink, /do not redefine the HTTP contract inside `nuxt-think`; consume the closed `openapi\.yaml`/i)
  assert.match(nuxtThink, /`nuxt-plan` for frontend-only work/i)
  assert.match(nuxtThink, /do not hand off to implementation planning with stale domain, Gherkin, or applicable OpenAPI artifacts/i)
  assert.match(nuxtThink, /`docs\/domain\/<domain>\/domain\.md` closed\./i)
  assert.match(nuxtThink, /`docs\/domain\/<domain>\/\*\.feature` closed\./i)
  assert.match(nuxtThink, /`docs\/domain\/<domain>\/openapi\.yaml` closed when the feature changes HTTP\./i)
  assert.match(nuxtThink, /use `feat-spec` when the request changes both frontend and backend/i)
  assert.match(nuxtThink, /use `change-plan` when a small change or bugfix touches both frontend and backend/i)

  assert.match(nestjsThink, /docs\/domain\/<domain>\//)
  assert.match(nestjsThink, /use `doc-domain` to create or update `docs\/domain\/<domain>\/domain\.md`/i)
  assert.match(nestjsThink, /use `doc-gherkin` to create or update `docs\/domain\/<domain>\/\*\.feature`/i)
  assert.match(nestjsThink, /complete this gate before checklist step 1/i)
  assert.match(nestjsThink, /self-review the domain and Gherkin artifacts for consistency/i)
  assert.match(nestjsThink, /do not advance with stale domain or Gherkin artifacts/i)
  assert.match(nestjsThink, /if state transitions changed, regenerate the affected `\.feature` files before planning/i)
  assert.match(nestjsThink, /do not do the `domain\.md` or `\*\.feature` work inline inside `nestjs-think`/i)
  assert.match(nestjsThink, /close persistence viability .* repositories, transactions, Prisma boundaries, constraints, and schema impact/i)
  assert.match(nestjsThink, /if the request splits into multiple independent domains, split them and close one domain at a time/i)
  assert.match(nestjsThink, /`nestjs-plan` for backend-only work/i)
  assert.match(nestjsThink, /`docs\/domain\/<domain>\/domain\.md` closed\./i)
  assert.match(nestjsThink, /`docs\/domain\/<domain>\/\*\.feature` closed\./i)
  assert.match(nestjsThink, /`doc-openapi` is ready to publish `docs\/domain\/<domain>\/openapi\.yaml` when the feature changes HTTP\./i)
  assert.match(nestjsThink, /persistence viability, Prisma\/schema impact/i)
  assert.match(nestjsThink, /use `feat-spec` when the request changes both frontend and backend/i)
  assert.match(nestjsThink, /use `change-plan` when a small change or bugfix touches both frontend and backend/i)

  assert.match(changePlan, /^---\nname: change-plan/m)
  assert.match(changePlan, /\*\*small\*\* fullstack change/i)
  assert.match(changePlan, /replaces `change-spec`/i)
  assert.match(changePlan, /inline contract block/i)
  assert.match(changePlan, /touches backend and frontend of an existing flow/i)
  assert.match(changePlan, /Single entry point for a \*\*small\*\* fullstack change/i)
  assert.match(changePlan, /no domain-artifact gate/i)
  assert.match(changePlan, /Routing Gate/i)
  assert.match(changePlan, /`executing-plans`/i)
  assert.match(changePlan, /NestJS or Laravel backend and the Nuxt frontend/i)
  assert.match(changePlan, /no domain-artifact gate/i)
  assert.match(changePlan, /REQUIRED SUB-SKILL.*plan-generation\.md/i)
  assert.match(laravelThink, /^---\nname: laravel-think/m)
  assert.match(laravelThink, /Form Requests own transport validation/i)
  assert.match(laravelThink, /Use `nimbou-cms-think` for the Nimbou CMS shell/i)
  assert.match(laravelThink, /Do not pause for approval unless the user explicitly requests a review checkpoint/i)
  assert.match(nestjsThink, /Do not ask for approval of the spec or its next step/i)
  assert.match(nuxtThink, /Do not write production code/i)
  assert.match(nuxtThink, /Pause only for an explicit review checkpoint or a material decision/i)
  assert.match(fullstackPlan, /`docs\/domain\/<domain>\/openapi\.yaml` is closed when the feature changes HTTP/i)

  assert.match(featSpec, /^---\nname: feat-spec/m)
  assert.match(featSpec, /feature changes both frontend and backend/i)
  assert.match(featSpec, /use `doc-domain`/i)
  assert.match(featSpec, /use `doc-gherkin`/i)
  assert.match(featSpec, /`doc-openapi` when HTTP changes/i)
  assert.match(featSpec, /close the shared feature design, ownership boundary, and preliminary contract/i)
  assert.match(featSpec, /does not replace the platform-specific think skills/i)
  assert.match(featSpec, /generated specification artifacts/i)
})

test('feat-spec resolves whether to prototype before backend design and requires approval when it does', () => {
  const skill = (name, file = 'SKILL.md') => read(`plugins/nimbou-skills/skills/${name}/${file}`)
  const spec = skill('feat-spec')
  const think = skill('nuxt-think')
  const design = skill('nuxt-design')
  const openapi = skill('doc-openapi')
  const plan = skill('fullstack-plan')
  const execution = skill('executing-plans', 'prose-execution.md')
  const smoke = skill('browser-smoke')

  assert.match(spec, /`doc-gherkin` → `nuxt-think` → prototype decision → `nestjs-think` or `laravel-think` → `doc-openapi` when HTTP changes → `fullstack-plan`/)
  assert.match(spec, /If the choice is unspecified, ask the user[\s\S]*wait for the answer/i)
  assert.match(spec, /If the user explicitly skips the prototype[\s\S]*continue to backend design/i)
  assert.match(spec, /If the user chooses a prototype, use `nuxt-design`/i)
  assert.match(spec, /Wait for explicit user approval before starting backend design/i)
  assert.match(spec, /ask the user to approve the affected prototype again/i)
  assert.match(spec, /Save the joint plan and stop there unless the user also requested implementation/)
  assert.match(think, /`feat-spec`[\s\S]*OpenAPI is not a prerequisite for the prototype/i)
  assert.match(design, /every in-scope screen and every applicable state/i)
  assert.match(design, /map each Gherkin scenario/i)
  assert.match(think, /visual-critique\.md[\s\S]*repair[\s\S]*rerender/)
  assert.match(think, /existing visual pattern[\s\S]*reuse it as the reference/i)
  assert.match(openapi, /before `fullstack-plan`/i)
  assert.match(openapi, /existing HTTP contract unchanged/i)
  for (const backend of ['nestjs-think', 'laravel-think']) {
    assert.match(skill(backend), /When a prototype was built, use the user-approved revision/i)
  }
  assert.match(plan, /For `feat-spec` and escalated `change-plan` work, verify the recorded prototype decision and, when a prototype was made, the user approval/i)
  assert.match(plan, /## Referência visual[\s\S]*affected frontend task/)
  assert.match(execution, /frontend tasks.*`## Referência visual`/i)
  assert.match(smoke, /`## Referência visual`[\s\S]*matching viewport[\s\S]*`FAIL`/)
  assert.match(smoke, /visual checks without evidence as concerns/)
})

test('change-plan settles the prototype choice before closing the inline contract and saving the plan', () => {
  const skill = (path) => read(`plugins/nimbou-skills/skills/${path}`)
  const change = skill('change-plan/SKILL.md')
  const think = skill('nuxt-think/SKILL.md')
  const design = skill('nuxt-design/SKILL.md')
  const generation = skill('change-plan/plan-generation.md')
  const handoff = skill('executing-plans/plan-session-handoff.md')

  assert.match(change, /`nuxt-think` → prototype decision → lightweight backend design → saved plan/i)
  assert.match(change, /If the choice is unspecified, ask the user[\s\S]*wait for the answer/i)
  assert.match(change, /If the user explicitly skips the prototype[\s\S]*continue/i)
  assert.match(change, /Wait for explicit user approval before starting backend design/i)
  assert.match(change, /existing flow[\s\S]*feat-spec\/SKILL\.md#planning-path/i)
  assert.match(think, /small `change-plan` path[\s\S]*inline acceptance cases/i)
  assert.match(design, /map each Gherkin scenario or inline acceptance case/i)
  assert.match(generation, /recorded prototype decision[\s\S]*user-approved revision/i)
  assert.match(generation, /Inline contract instead of `openapi\.yaml`/i)
  assert.match(handoff, /For `change-plan`, prototype approval authorizes planning only/i)
})

test('platform test skills consume approved Gherkin and route backend audits', () => {
  const files = [
    'plugins/nimbou-skills/skills/nuxt-test/SKILL.md',
    'plugins/nimbou-skills/skills/nuxt-test/reference/test-conventions.md',
    'plugins/nimbou-skills/skills/nestjs-test/SKILL.md',
    'plugins/nimbou-skills/skills/nestjs-test/reference/test-conventions.md',
  ]

  for (const file of files) {
    assert.equal(existsSync(resolve(root, file)), true, `${file} should exist`)
  }

  const nuxtTest = read('plugins/nimbou-skills/skills/nuxt-test/SKILL.md')
  const nuxtRules = read('plugins/nimbou-skills/skills/nuxt-test/reference/test-conventions.md')
  const nestjsTest = read('plugins/nimbou-skills/skills/nestjs-test/SKILL.md')
  const nestjsRules = read('plugins/nimbou-skills/skills/nestjs-test/reference/test-conventions.md')

  assert.match(nuxtTest, /Read `reference\/test-conventions\.md` before changing tests\./i)
  assert.match(nuxtTest, /turn approved Gherkin into bounded Playwright coverage/i)
  assert.match(nuxtTest, /approved Gherkin/i)
  assert.match(nuxtTest, /docs\/domain\/<domain>\/\*\.feature/)
  assert.match(nuxtTest, /explicit gap report/i)
  assert.match(nuxtRules, /getByRole\(\)/)
  assert.match(nuxtRules, /getByTestId\(\)/)
  assert.match(nuxtRules, /waitForTimeout\(\)/)
  assert.match(nuxtRules, /one critical happy path/i)
  assert.match(nuxtRules, /meaningful non-happy-path state/i)
  assert.match(nestjsTest, /^---\nname: nestjs-test/m)
  assert.match(nestjsTest, /Read `reference\/test-conventions\.md` before changing tests\./i)
  assert.match(nestjsTest, /approved Gherkin/i)
  assert.match(nestjsTest, /Use this skill when the main job is:/i)
  assert.match(nestjsTest, /gherkin-driven mode/i)
  assert.match(nestjsTest, /audit mode/i)
  assert.match(nestjsTest, /stabilize mode/i)
  assert.match(nestjsTest, /## Workflow/)
  assert.match(nestjsTest, /bounded backend flow or persistence slice/i)
  assert.match(nestjsTest, /nestjs-http-test-auditor/i)
  assert.match(nestjsTest, /prisma-repository-test-auditor/i)
  assert.match(nestjsRules, /bounded backend flow or persistence slice/i)
  assert.match(nestjsRules, /explicit HTTP status, payload shape, and database state assertions/i)
  assert.match(nestjsRules, /nestjs-debug/i)
})

test('README and installer document Codex distribution', () => {
  const readme = read('README.md')
  const install = read('install.sh')
  assert.match(readme, /Codex skill library/)
  assert.match(readme, /Codex marketplace/)
  assert.match(readme, /craft-setup/)
  assert.match(readme, /merge-pr/)
  assert.match(install, /codex plugin marketplace add/)
  assert.match(install, /codex plugin add nimbou-skills@nimbou-skills/)
  assert.match(install, /setup-codex-skills\.sh/)
  assert.doesNotMatch(install, /claude|copilot/i)
})

test('Windows PowerShell installer mirrors the bootstrap flow', () => {
  assert.equal(existsSync(resolve(root, 'install.ps1')), true)
  assert.equal(existsSync(resolve(root, 'scripts/setup-codex-skills.ps1')), true)
  assert.equal(existsSync(resolve(root, 'scripts/setup-codex-full-wrapper.ps1')), true)
  assert.equal(existsSync(resolve(root, 'scripts/setup-python-docx.ps1')), true)

  const install = read('install.ps1')
  assert.match(install, /setup-codex-full-wrapper\.ps1/)
  assert.match(install, /setup-codex-skills\.ps1/)
  assert.match(install, /setup-python-docx\.ps1/)
  assert.match(install, /@google\/design\.md/)
  assert.match(install, /codex plugin marketplace/i)
  assert.match(install, /codex plugin add 'nimbou-skills@nimbou-skills'/)
  // The Wayland/X11 DevTools wrapper is Linux-only and must not be ported.
  assert.doesNotMatch(install, /setup-chrome-devtools-wrapper/)
  assert.doesNotMatch(install, /chrome-devtools-mcp-wayland/)
  assert.equal(existsSync(resolve(root, 'scripts/setup-chrome-devtools-wrapper.ps1')), false)

  const codexWrapper = read('scripts/setup-codex-full-wrapper.ps1')
  assert.match(codexWrapper, /dangerously-bypass-approvals-and-sandbox/)

  const readme = read('README.md')
  assert.match(readme, /install\.ps1/)
  assert.match(readme, /Installation \(Windows \/ PowerShell\)/)
})
