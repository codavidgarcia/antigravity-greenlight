# Antigravity Greenlight

Full agent autonomy for Antigravity IDE with active terminal protection.

When you let an AI agent run freely, it needs access to everything: file edits, terminal commands, non-workspace folders, continuation prompts. Today you have two options: click "Allow" dozens of times per session, or flip on raw auto-approve settings and hope the agent doesn't run `rm -rf /` while you're away.

Greenlight gives you a third option. One toggle turns on every execution permission the agent needs. At the same time, a background process watches every terminal command the agent runs and kills anything that matches a configurable blacklist before it finishes executing.

<p align="center">
  <a href="https://github.com/codavidgarcia/antigravity-greenlight/releases/latest"><img src="https://img.shields.io/github/v/release/codavidgarcia/antigravity-greenlight?style=flat-square&color=2ea043&labelColor=333" alt="Release"></a>
  <a href="https://github.com/codavidgarcia/antigravity-greenlight/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-3b82f6?style=flat-square&labelColor=333" alt="MIT License"></a>
  <a href="https://github.com/codavidgarcia/antigravity-greenlight/stargazers"><img src="https://img.shields.io/github/stars/codavidgarcia/antigravity-greenlight?style=flat-square&color=e3b341&labelColor=333" alt="Stars"></a>
  <a href="https://open-vsx.org/extension/codavidgarcia/antigravity-greenlight"><img src="https://img.shields.io/open-vsx/dt/codavidgarcia/antigravity-greenlight?style=flat-square&color=e07c34&labelColor=333" alt="Open VSX Downloads"></a>
</p>

## Why not just edit settings.json?

You can set `chat.tools.terminal.autoApprove` and add `{"rm": false}` to block specific commands. This breaks in practice:

1. **Turbo policies override filters.** Antigravity's internal execution policies (`cascadeAutoExecutionPolicy`) bypass `chat.tools` dictionaries entirely.
2. **Static string matching misses real threats.** A shell alias, a chained pipe, or an `npm run clean` script that calls `rm -rf` internally will pass right through a dictionary check.
3. **Too many settings to manage.** Between `ussSettings`, workspace overrides, agent-level permissions, and IDE-level toggles, keeping everything in sync across projects is a headache.

## How Greenlight works

### TerminalGuard

Greenlight hooks into the `onDidStartTerminalShellExecution` API. Every command the agent sends to the terminal is checked against a configurable blacklist (`greenlight.blockedPatterns`).

Default blocked patterns include `rm -rf /`, `rm -rf ~`, `mkfs`, `dd if=`, `> /dev/sda`, fork bombs, and similar system-level destructives. Normal dev commands like `rm file.txt` or `rm -rf node_modules/` are not blocked.

If a match is found, Greenlight sends `\x03` (Ctrl+C / SIGINT) to the terminal within milliseconds, killing the process before it can do damage. A warning notification tells you what was blocked.

You can add your own patterns. Want to block `git push --force` or `drop database`? Add them to `greenlight.blockedPatterns` in your settings.

### Auto-approve injection

When you toggle Greenlight ON, it sets `chat.tools.edits.autoApprove`, `chat.agent.autoApprove`, and the Antigravity-specific execution policies (`cascadeAutoExecutionPolicy`, `browserJsExecutionPolicy`) all at once. When you toggle OFF, it restores your previous values.

For `Agent Non-Workspace File Access`, a one-time manual confirmation is required in Antigravity's settings UI. Greenlight will prompt you with instructions if this hasn't been done.

### Polling dispatcher

Some agent operations stall waiting for a "Continue?" confirmation that never auto-resolves. Greenlight polls `antigravity.command.accept` in the background to clear these locks automatically. Polling frequency scales down when the IDE is idle.

## Install

**From [Open VSX](https://open-vsx.org/extension/codavidgarcia/antigravity-greenlight):** search for **`Antigravity Greenlight @sort:name`** in the Extensions panel.

**From source:**
1. Download the `.vsix` from [Releases](https://github.com/codavidgarcia/antigravity-greenlight/releases/latest).
2. `Cmd+Shift+P` > **Extensions: Install from VSIX...**
3. Pick the file and reload.

## Settings

| Setting | Default | What it does |
|---|---|---|
| `greenlight.autoApprove.edits` | `true` | Auto-approve file edits from the agent. |
| `greenlight.terminal.protection` | `true` | Watch terminal commands and kill blocked patterns. |
| `greenlight.blockedPatterns` | `["rm -rf /", "mkfs", ...]` | Terminal sub-strings to block. Add your own entries here. |
| `greenlight.polling.adaptive` | `true` | Poll faster when the agent is active, slower when idle. |

## License

[MIT](https://github.com/codavidgarcia/antigravity-greenlight/blob/main/LICENSE)
