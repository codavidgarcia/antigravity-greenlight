/**
 * Category of auto-accept actions.
 * Each category can be independently enabled/disabled by the user.
 */
export type AcceptCategory = 'edits' | 'terminal' | 'chat' | 'notification';

/**
 * Current state of the extension.
 */
export type ExtensionState = 'active' | 'inactive' | 'starting' | 'error';

/**
 * A VS Code command that accepts an AI agent action.
 */
export interface AcceptCommand {
    /** The full command identifier, e.g. 'chatEditing.acceptAllFiles' */
    id: string;
    /** Which category this command belongs to */
    category: AcceptCategory;
    /** Human-readable description */
    description: string;
}

/**
 * A VS Code setting that controls auto-approval behavior.
 */
export interface AutoApproveSetting {
    /** Configuration section, e.g. 'chat.tools' */
    section: string;
    /** Configuration key within the section, e.g. 'autoApprove' */
    key: string;
    /** The value to set when auto-accept is ON */
    valueWhenOn: unknown;
    /** Which category this setting belongs to */
    category: AcceptCategory;
}

/**
 * Statistics tracked by the command dispatcher.
 */
export interface DispatchStats {
    /** Total number of command dispatch cycles */
    totalCycles: number;
    /** Number of unique commands available in this VS Code instance */
    commandsAvailable: number;
    /** Timestamp of the last dispatch cycle */
    lastCycleAt: Date | null;
    /** Currently active categories */
    activeCategories: AcceptCategory[];
}

/**
 * Resolved extension configuration.
 */
export interface ExtensionConfig {
    autoStart: boolean;
    autoApproveEdits: boolean;
    autoApproveTerminal: boolean;
    autoApproveChat: boolean;
    enableCommandPolling: boolean;
    pollIntervalMs: number;
    maxAgentRequests: number;
    additionalAcceptCommands: string[];
    adaptivePolling: boolean;
    showNotifications: boolean;
    terminalProtection: boolean;
    blockedPatterns: string[];
}
