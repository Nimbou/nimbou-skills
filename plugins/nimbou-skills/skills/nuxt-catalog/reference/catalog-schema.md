# Catalog Schema

Each Vue SFC may include:

~~~vue
<catalog lang="json">
{
  "title": "Project Status Badge",
  "category": "display",
  "domain": "projects",
  "tags": ["project", "status", "badge"],
  "purpose": "Displays the lifecycle status of a project.",
  "useWhen": "Use in project lists, cards, and headers.",
  "avoidWhen": "Avoid for generic statuses; use StatusChip instead.",
  "status": "experimental",
  "replaces": "OldStatusBadge"
}
</catalog>
~~~

Required fields: `title`, `category`, `domain`, `tags`, `purpose`, `useWhen`, `avoidWhen`, `status`.

Optional fields: `replaces` (string or null, defaults to `null`).

Derived fields (computed by `nb-catalog generate`, not authored):
- `related` — grouped by folder/prefix convention
- `usedBy` — scanned from template references in components and pages

Allowed `status` values: `draft`, `experimental`, `stable`, `deprecated`.

Generated outputs:

- Rich catalog: `components.meta.json`
- Slim compatibility mirror: `.generated/component-catalog/components.meta.json`

Generation modes:

- `nb-catalog generate` builds semantic metadata, `related` and `usedBy` without
  loading TypeScript. The rich aggregate declares `metadataMode: "semantic"`;
  its `meta` arrays are empty because technical metadata was not extracted.
- `nb-catalog generate --full` also extracts props, emits, slots and exposed
  members using `vue-component-meta`. The aggregate declares `metadataMode: "full"`.
  Workers run sequentially with 50 components per process by default;
  `--batch-size=10` reduces the batch size. Project ambient declarations and
  transitive imports can still load other components.
- `nb-catalog generate projects --full` filters before technical extraction.
  As before, domain generation replaces the aggregate and per-component outputs
  with only the selected domain; it is not an incremental merge.
- `nb-catalog validate` checks all semantic blocks without loading TypeScript or
  writing output. Use it before generation.

A worker failure (including out-of-memory) aborts before replacing generated
outputs. Per-component extraction errors keep the existing syntax-only props
fallback and emit a warning. No persistent type cache is used, so shared type
changes are resolved on every full generation.
