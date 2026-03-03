# Changelog

All notable changes to this project will be documented in this file.

## [1.2.1] - 2026-03-02
### Added
- **Quick-pick menu:** Clicking the status bar item now opens a contextual menu instead of toggling directly. Options include enable/disable, open settings, run diagnostics, and hide the status bar.
- **Command palette commands:** All controls are now accessible via `Cmd+Shift+P`:
  - `Antigravity Greenlight: Enable Auto Mode`
  - `Antigravity Greenlight: Disable Auto Mode`
  - `Antigravity Greenlight: Show Options`
  - `Antigravity Greenlight: Toggle Status Bar Visibility`
- **Status bar visibility setting:** New `greenlight.showStatusBar` setting to show/hide the status bar item. Can be toggled from the menu or the command palette.

### Changed
- Status bar click behavior changed from direct toggle to quick-pick menu for more control.
- Updated README with full Commands and Settings documentation, corrected setting key names, and added the terminal protection screenshot.

## [1.1.0] - 2026-02-28
### Added
- Rebuilt the core engine on top of Antigravity's internal configuration API. No more UI automation.
- TerminalGuard: active PTY monitoring that kills dangerous commands (`rm -rf /`, `mkfs`, etc.) before they execute.
- Configurable blocked patterns via `greenlight.blockedPatterns`.
- Antigravity-specific execution policy overrides (`cascadeAutoExecutionPolicy`, `browserJsExecutionPolicy`).

### Removed
- Legacy screen-based automation (OCR, accessibility hooks). Replaced by direct setting injection.

## [1.0.0] - 2026-02-26
- First release. Basic auto-approve toggle for agent file edits and terminal commands.
