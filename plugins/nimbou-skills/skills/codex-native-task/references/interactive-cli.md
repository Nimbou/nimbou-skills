# Start a persistent task through the interactive Codex CLI

This is the default creation route for a persistent task, including requests made from Codex Desktop. The CLI owns the first turn. Opening the saved session in Desktop later is a separate step.

1. Inspect the installed `codex --help` for the flags below and confirm that a terminal with a persistent interactive PTY is available. Use the terminal's process interface. Prepare and verify the isolated worktree at the intended revision. Copy the saved plan and the required uncommitted artifacts and include their source paths in the handoff.
2. Start the CLI **with an empty composer**. Use the worktree's absolute path. Substitute the selected model and level when the user chose them. The settings below are per invocation.

   ```text
   codex -C "<absolute-worktree-path>" -m gpt-6.2-sol -c model_reasoning_effort=low --sandbox danger-full-access --ask-for-approval never --no-alt-screen
   ```

3. Skip any optional CLI update offered at startup and wait for the composer. Enter `/status`. If the command is still in the composer, send Enter separately. Verify the effective checkout, model, reasoning, and Full Access policies before submitting the first prompt. Use supported status or permission displays in the running CLI if the initial view omits a value. Record the session ID and effective settings in the receipt as soon as they are visible. If the session reports different settings or the effective Full Access settings cannot be verified, leave the composer unsent and report the limitation.
4. Use `/rename` to apply the requested title when available. Enter the handoff prompt, verify it is in the composer, then submit it and confirm that the turn started in the owning terminal. Update the receipt with the observed status. If a launch or submission response is lost, locate the saved session by the same receipt before attempting any retry. Preserve the session for the user.
5. When a Desktop handoff is desired and the session is ready for interactive commands, `/app` opens the saved session in Desktop on macOS or Windows. If the turn is still running, preserve it and report the CLI-owned state. Use the Desktop inventory when available to verify visibility separately. `codex app <path>` opens the application and does not submit a first prompt.

The [official Codex command reference](https://learn.chatgpt.com/docs/developer-commands?surface=cli) describes the CLI flags and slash commands. The [local API guide](local-api.md) covers the separate route for an already-running App Server from a CLI-originated conversation.
