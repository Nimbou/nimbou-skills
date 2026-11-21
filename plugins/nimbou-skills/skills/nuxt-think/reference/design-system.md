# Design system decisions

Read the closest visual and implementation guides, the design tokens and shared components, and the related surfaces. In Nuxt, inspect the theme, local wrappers and the available component catalog. A local HTML guide can provide visual evidence for an existing system. Record differences between the guides and code for resolution.

## Start a system

Define roles for color, typography, spacing, shape, depth and motion from the product's needs. Define common interaction behavior for focus, selection, loading and feedback. Propose the first components in order of use. For each, document its purpose, anatomy, variants, state matrix and examples. Use `nimbou-skills:craft-setup` when the request includes writing the design and implementation guides.

## Change a shared piece

Check whether an existing component plus a variant covers the need. Specify the token or component change, its source location, current consumers and affected states. Include the smallest propagation scope and the visual or functional checks affected consumers need. Use `nimbou-skills:craft-sync` for an explicit import into a guide or export from the guide to code.

## Audit the system

Look for loose or near-duplicate values, missing semantic roles, missing focus or disabled states, visual drift, and one-off components that can reuse a shared piece. List findings by user impact with the source, affected consumers and proposed correction. Keep the work at the decision or audit level. Requests for a broad implementation review use `nimbou-skills:nuxt-audit`.
