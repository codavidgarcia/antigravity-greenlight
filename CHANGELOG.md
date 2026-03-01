# Changelog

All notable changes to this project will be documented in this file.

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
