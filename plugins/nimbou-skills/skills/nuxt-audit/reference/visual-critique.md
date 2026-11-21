# Visual critique in the browser

Use the nearest `DESIGN.md` and `GUIDELINES.md` as the baseline. Render at a representative desktop width and at a narrow width when responsive. Check the states that differ in content, available actions or layout. Treat dimensions inferred from an image as estimates.

- **Hierarchy and copy.** The first glance should reveal the screen's job and primary action. Inspect awkward wraps, vague feedback, and whether the copy explains the next step. Keep necessary content accessible on narrow screens.
- **Spacing and alignment.** Check visual groups, occupied space and alignment of repeated controls. Inspect long data in the real container.
- **Stability.** Check layout across loading, label changes, selection and data refresh. Verify that shared controls keep their position and available focus when their state changes.
- **Interaction.** Exercise hover, keyboard focus, activation, disabled and selected states where applicable. Check accessible native controls or existing project primitives.
- **Contrast and motion.** Check text and controls on real surfaces, including tinted variants. Verify that focus remains visible and motion respects reduced-motion preferences.
- **Consistency.** Check repeated patterns against shared components. Put failures near their scope and identify all affected consumers before proposing a shared fix.

Rank findings by user impact. Record the screen or component, viewport, state, observed behavior and smallest correction. For an authorized visual fix, rerender using the same inputs and compare against the original capture. For a review request, report the findings.
