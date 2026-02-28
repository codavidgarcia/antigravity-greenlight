import { AcceptCommand, AutoApproveSetting } from './types';

// ─── Configuration Section ───────────────────────────────────────

export const CONFIG_SECTION = 'greenlight';

// ─── Accept Commands ─────────────────────────────────────────────
// Commands that accept/approve pending AI agent actions.
// Categorized so each type can be independently toggled.

export const ACCEPT_COMMANDS: AcceptCommand[] = [
    // ── Antigravity IDE — Agent / Tool Use ──
    // These are the primary commands for auto-accepting in Antigravity.
    {
        id: 'antigravity.agent.acceptAgentStep',
        category: 'chat',
        description: 'Accept an agent step (file access, tool use, etc.)',
    },
    {
        id: 'antigravity.command.accept',
        category: 'chat',
        description: 'Accept a pending Antigravity command',
    },

    // ── Antigravity IDE — File Edits ──
    {
        id: 'antigravity.prioritized.agentAcceptAllInFile',
        category: 'edits',
        description: 'Accept all agent changes in the current file',
    },
    {
        id: 'antigravity.prioritized.agentAcceptFocusedHunk',
        category: 'edits',
        description: 'Accept the focused hunk of agent changes',
    },
    {
        id: 'antigravity.acceptCompletion',
        category: 'edits',
        description: 'Accept an Antigravity code completion',
    },
    {
        id: 'antigravity.prioritized.supercompleteAccept',
        category: 'edits',
        description: 'Accept Antigravity supercomplete suggestion',
    },

    // ── Antigravity IDE — Terminal ──
    {
        id: 'antigravity.terminalCommand.accept',
        category: 'terminal',
        description: 'Accept a terminal command in Antigravity',
    },
    {
        id: 'antigravity.terminalCommand.run',
        category: 'terminal',
        description: 'Run a terminal command in Antigravity',
    },

    // ── VS Code Standard — File Edits ──
    {
        id: 'chatEditing.acceptAllFiles',
        category: 'edits',
        description: 'Accept all pending file edits from chat',
    },
    {
        id: 'chatEditing.acceptFile',
        category: 'edits',
        description: 'Accept the current file edit from chat',
    },
    {
        id: 'inlineChat.acceptChanges',
        category: 'edits',
        description: 'Accept inline chat changes in the editor',
    },

    // ── VS Code Standard — Terminal ──
    {
        id: 'workbench.action.terminal.chat.runCommand',
        category: 'terminal',
        description: 'Run a terminal command proposed by chat',
    },
    {
        id: 'workbench.action.terminal.acceptSelectedSuggestion',
        category: 'terminal',
        description: 'Accept the selected terminal suggestion',
    },

    // ── VS Code Standard — Notifications ──
    {
        id: 'notification.acceptPrimaryAction',
        category: 'notification',
        description: 'Accept the primary action of a notification',
    },
];

// ─── Auto-Approve Settings ──────────────────────────────────────
// VS Code settings that control built-in auto-approval behavior.
// Setting these avoids the need for command polling in most cases.
// The `maxRequests` setting reduces "Continue?" interruptions.

export const AUTO_APPROVE_SETTINGS: AutoApproveSetting[] = [
    // ── Chat / Tools — Global ──
    {
        section: 'chat.tools.global',
        key: 'autoApprove',
        valueWhenOn: true,
        category: 'chat',
    },

    // ── Terminal ──
    {
        section: 'chat.tools.terminal',
        key: 'enableAutoApprove',
        valueWhenOn: true,
        category: 'terminal',
    },
    {
        section: 'chat.tools.terminal',
        key: 'autoApprove',
        valueWhenOn: true,
        category: 'terminal',
    },

    // ── File Edits ──
    {
        section: 'chat.tools.edits',
        key: 'autoApprove',
        valueWhenOn: true,
        category: 'edits',
    },

    // ── Agent Max Requests ──
    // Reduces "Continue?" interruptions by increasing the limit.
    {
        section: 'chat.agent',
        key: 'maxRequests',
        valueWhenOn: 100,
        category: 'chat',
    },

    // ── Agent Auto-Approve (registered by our extension) ──
    {
        section: 'chat.agent',
        key: 'autoApprove',
        valueWhenOn: true,
        category: 'chat',
    },
    {
        section: 'chat.tools',
        key: 'autoApprove',
        valueWhenOn: true,
        category: 'chat',
    },
    {
        section: 'geminicodeassist',
        key: 'autoAcceptToolUse',
        valueWhenOn: true,
        category: 'chat',
    },

    // ── Antigravity IDE (God Mode Auto-Approvals) ──
    {
        section: 'antigravity',
        key: 'allowAgentAccessNonWorkspaceFiles',
        valueWhenOn: true,
        category: 'chat',
    },
    {
        section: 'antigravity',
        key: 'cascadeAutoExecutionPolicy',
        valueWhenOn: 'Turbo',
        category: 'chat',
    },
    {
        section: 'antigravity',
        key: 'browserJsExecutionPolicy',
        valueWhenOn: 'Turbo',
        category: 'chat',
    },
];

// ─── Adaptive Polling Thresholds ────────────────────────────────

export const ADAPTIVE_POLLING = {
    /** Multiplier when the editor is actively being used */
    ACTIVE_MULTIPLIER: 1,
    /** Multiplier after IDLE_THRESHOLD_MS of no activity */
    IDLE_MULTIPLIER: 2,
    /** Multiplier after DEEP_IDLE_THRESHOLD_MS of no activity */
    DEEP_IDLE_MULTIPLIER: 4,
    /** Milliseconds of no document changes before considered idle */
    IDLE_THRESHOLD_MS: 5_000,
    /** Milliseconds of no document changes before considered deeply idle */
    DEEP_IDLE_THRESHOLD_MS: 30_000,
};

// ─── Diagnostic Patterns ────────────────────────────────────────
// Regex patterns used by the diagnostics runner to discover
// relevant commands in the VS Code instance.

export const DIAGNOSTIC_COMMAND_PATTERNS: RegExp[] = [
    /accept/i,
    /approve/i,
    /confirm/i,
    /run.*terminal/i,
    /terminal.*run/i,
    /chat.*accept/i,
    /chat.*approve/i,
    /chat.*apply/i,
    /copilot.*accept/i,
    /copilot.*approve/i,
    /agent.*accept/i,
    /agent.*approve/i,
    /gemini.*accept/i,
    /gemini.*approve/i,
    /inline.*accept/i,
    /tool.*accept/i,
    /tool.*approve/i,
];
