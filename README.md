# Antigravity Greenlight

100% native, ultra-lightweight, and secure **"God Mode"** for Antigravity IDE. One simple toggle that grants your AI agent full autonomy—accepting file edits, bypassing annoying external folder prompt dialogs, automatically running terminal commands—while keeping your system safe from catastrophic terminal errors.

<p align="center">
  <a href="https://github.com/codavidgarcia/antigravity-greenlight/releases/latest"><img src="https://img.shields.io/github/v/release/codavidgarcia/antigravity-greenlight?style=flat-square&color=2ea043&labelColor=333" alt="Release"></a>
  <a href="https://github.com/codavidgarcia/antigravity-greenlight/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-3b82f6?style=flat-square&labelColor=333" alt="MIT License"></a>
  <a href="https://github.com/codavidgarcia/antigravity-greenlight/stargazers"><img src="https://img.shields.io/github/stars/codavidgarcia/antigravity-greenlight?style=flat-square&color=e3b341&labelColor=333" alt="Stars"></a>
  <a href="https://open-vsx.org/extension/codavidgarcia/antigravity-greenlight"><img src="https://img.shields.io/open-vsx/dt/codavidgarcia/antigravity-greenlight?style=flat-square&color=e07c34&labelColor=333" alt="Open VSX Downloads"></a>
</p>

Turn on `Greenlight` via the Status Bar or `Cmd+Shift+U` to immediately sync *all* required execution policies!

---

## Why Antigravity Greenlight?

Giving an AI agent complete autonomy natively in VS Code requires digging through 8+ different undocumented settings and manually overriding execution and privacy policies. Changing your mind later requires finding those 8 variables again.

**Greenlight** acts as your central **Master Switch**: it sets the deepest, undocumented Antigravity "Turbo" policies so the agent is completely uninterrupted, but guarantees it doesn't run destructive commands.

## Key Features

### 1. ⚡ Complete God Mode
Enabling Greenlight immediately overrides multiple native settings including:
- Auto-approves file edits (`chat.tools.edits.autoApprove`)
- Auto-approves agent queries (`chat.agent.autoApprove`)
- Bypasses "Allow this conversation to access outside folders" natively via Antigravity `ussSettings`.
- Injects Turbo Execution Mode policies (`antigravity.cascadeAutoExecutionPolicy`, `browserJsExecutionPolicy`).

*(Note: To unlock external folder access, check `Agent Non-Workspace File Access` 1 time in Antigravity's UI)*

### 2. 🛡️ Terminal Guard
With complete autonomy comes complete risk. An agent left unchecked could format a drive. **Greenlight incorporates a native `TerminalGuard`**. 
- It monitors PTY streams invisibly inside VS Code.
- It immediately aborts the terminal process if the AI tries to launch dangerous operations like `rm -rf /`, overriding the auto-execute logic. 

### 3. 🤖 Command Polling 
Even in Turbo mode, AI agents often stall under hard-limit loops waiting for you to click "Continue". 
- Greenlight uses background Command Polling (`antigravity.command.accept`) to click "Continue" for you behind the scenes. 
- You can truly walk away and let the IDE code itself.

## Lightweight & Local

Just like other Antigravity tools (e.g. `Pulse`), Greenlight is:
- **Zero background bloated dependencies**: Runs completely native to the extension APIs.
- **Microscopic**: Extremely tiny packed vsix.
- **Privacy First**: Operates 100% locally. Zero telemetry, zero analytics tracking.

## Install

**Install from [Open VSX](https://open-vsx.org/extension/codavidgarcia/antigravity-greenlight)**. In the Extensions panel, search for **`Antigravity Greenlight @sort:name`** to find the extension directly, then click Install. Updates happen automatically via VSX.

<details>
<summary>Manual install (no auto-updates)</summary>

1. Download the `.vsix` from [Releases](https://github.com/codavidgarcia/antigravity-greenlight/releases/latest)
2. `Cmd+Shift+P` → **Extensions: Install from VSIX...**
3. Select the file and reload

</details>

## Configuration Settings

You can fully customize which parts of Greenlight you want active. Search `greenlight` in preferences:

| Setting | Default | Description |
|---|---|---|
| `greenlight.autoApprove.edits` | `true` | Approves inline file edits and merges automatically. |
| `greenlight.terminal.protection` | `true` | Blocks dangerous terminal combinations immediately (`rm -rf`). |
| `greenlight.polling.adaptive` | `true` | Fast-polls while agents are busy, sleeps when agents rest. |

## Contributing

Pull requests are fiercely welcome. Let's make complete automation more bulletproof! 

If Greenlight saves your project from endless manual mouse-clicking, consider giving it a ⭐ to help others find it on the [GitHub repo](https://github.com/codavidgarcia/antigravity-greenlight).

## License

[MIT](https://github.com/codavidgarcia/antigravity-greenlight/blob/main/LICENSE)
