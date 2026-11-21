# Sync record and comparison

Store `design-sync.json` at the root of the app or package owning the guide. Use root-relative paths and keep the guide's naming rule stable between runs.

```json
{
  "source": "assets/css/tokens.css",
  "tool": "docs/design/guide/",
  "naming": "CSS custom property names from source",
  "synced": "2026-11-21",
  "tokens": { "--radius-md": "10px" },
  "components": { "ProjectCard": "drawn", "ProjectFilter": "in code only" }
}
```

Use the editable input path, or the UI package path if the source spans files. Keep an exact source location per item in the inventory and proposed diff. Use CSS variable names already emitted by the system and preserve the full source key when no emitted name exists. For themed values, distinguish the active theme when the same key has different values. Include aliases or scoped values only when the guide can round-trip them unambiguously.

| Last agreed | Guide and code now | Action |
|---|---|---|
| Any value or no entry | Equal | Record the shared value after verification. |
| A | Guide B, code A | Propose applying B to the code. |
| A | Guide A, code B | Offer to refresh the guide from the code. |
| A | Guide B, code C | Show all three values and ask which to keep. |
| No entry | Different | Ask which side should define the value. Apply a known, explicitly approved direction when present. |

Treat additions and removals as differences. A removal affects the source only when explicitly approved. When both sides have removed a token, remove the entry from the record. Keep the previous agreed value for unresolved entries and omit unsettled entries with no prior agreement. A component's status tracks whether it appears in the guide. Show any proposed component property change with its current guide and code values and the source file. Confirm the direction if no prior agreement establishes it. A proposed visual state or placeholder font stays in the guide.
