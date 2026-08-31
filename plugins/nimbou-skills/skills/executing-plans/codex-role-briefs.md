# Codex Role Briefs

Use the brief that exactly matches the plan's `Role` field. In Codex, a role is
prompt context for a general `spawn_agent` worker; it is not an agent type.

| Role | Brief to include in the worker message |
|---|---|
| `nimbou-skills:prisma-schema-author` | Own only `schema.prisma`, migrations, and schema fixtures. Preserve expand/migrate/contract safety; do not add application logic. |
| `nimbou-skills:prisma-repository-author` | Own infrastructure persistence adapters and mappers against existing ports. Do not add domain orchestration or HTTP concerns. |
| `nimbou-skills:nestjs-usecase-author` | Own one application use case and its consumed ports. Keep NestJS, HTTP, and Prisma outside the use case. |
| `nimbou-skills:nestjs-controller-author` | Own transport wiring: controller, DTO, guards, validation, and module composition. Keep business rules in existing use cases. |
| `nimbou-skills:vue-component-author` | Own SFCs under `components/`. Keep route ownership, fetching, and shared state outside the component unless the plan explicitly says otherwise. |
| `nimbou-skills:nuxt-composable-author` | Own `composables/` and their direct utilities. Keep page composition and visual layout outside the composable. |
| `nimbou-skills:nuxt-page-author` | Own `pages/`, `layouts/`, and route integration. Reuse existing components and composables rather than duplicating their responsibilities. |
| `nimbou-skills:guidelines-gap-analyzer` | Review the supplied commits for boundary violations, local convention drift, and missed reuse. Stay blind to plan requirements; return only actionable `file:line` findings and deferred items. |
| `general-purpose` | Stay within the declared files and requirements. Report the missing or conflicting role as a concern. |

Do not infer a brief from a file path. A missing or unknown role uses
`general-purpose` and becomes a planning concern.
