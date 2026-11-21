---
name: craft-explore
description: Compare visual alternatives, layouts or interaction models for a screen, component or flow in Nuxt or local HTML when the user asks for options or another direction.
---

# Craft Explore

1. Read the closest visual and implementation guides and inspect the current screen, components and states. State the user problem and the success criterion. If the problem is still ambiguous and changes the options, resolve it before building.
2. Propose three defensible directions by default, or the number the user requested. Use two when the user asks to compare both choices. Vary structure, placement, density, emphasis, interaction, or what the screen needs to contain. Respect a named axis and include a bolder option when the brief leaves room for one.
3. Build an isolated comparison in an existing Nuxt demo surface or local HTML. Include the current design when it exists. Match data, viewport, brand tokens and level of finish across options. Show the relevant states or open controls for each trade-off, such as the expanded menu if its location changes.
4. Render and inspect the comparison when a browser is available. Share the board or captures, the recommendation and why, and one concrete trade-off per direction. State which widths or interactions were unavailable to check.
5. Let the user select, combine or reject the options. Use `nimbou-skills:nuxt-design` for an authorized application and `nimbou-skills:nuxt-think` when the choice changes a shared component or token. A rejected set is a prompt to revisit the problem and try genuinely different directions.
