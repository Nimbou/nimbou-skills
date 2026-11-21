# Interface state inventory

For each group, mark states as applicable, irrelevant to the scope, or open. For applicable states, specify what changes, what remains visible, and the next action. Base permission and concurrency behavior on the product contract. Reuse the component's real props, slots and existing variants.

| Group | States and conditions to consider |
|---|---|
| Data | Default, first-use empty, no filter results, one item, many items, long or translated text, missing optional fields. |
| System | First load, refresh with data visible, slow request, failed load, partial failure, offline if supported, stale data, concurrent changes, expired session or link. |
| Operations | In progress, waiting for someone else, success, undo and undo failure if supported, intentionally paused, failed and retryable. |
| People | First-time and returning users, role-based availability, pending approval, an action already completed by another person. |
| Interaction | Default, hover, pressed, keyboard focus, disabled, loading and selected, according to the shared component's matrix. Show screen-level examples when a state changes content or layout. |

For prototypes, make the main sample realistic enough to expose truncation, scrolling and wrapping. In wide-scope design work, cover the cases that affect the user journey. In isolated component validation, use the dedicated skill's state and viewport matrix.
