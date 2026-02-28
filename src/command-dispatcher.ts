import * as vscode from 'vscode';
import { AcceptCategory, AcceptCommand, DispatchStats, ExtensionConfig } from './types';
import { ACCEPT_COMMANDS, ADAPTIVE_POLLING } from './constants';
import { Logger } from './logger';
import { StatusBar } from './status-bar';

/**
 * Smart command dispatcher that polls VS Code for pending accept actions.
 *
 * Improvements over the original blind polling approach:
 * 1. **Discovery** — only dispatches commands that actually exist in this VS Code instance.
 * 2. **Category filtering** — skips commands for disabled categories (e.g. terminal).
 * 3. **Adaptive interval** — slows down when the editor is idle, speeds up during activity.
 * 4. **Extensibility** — supports user-defined additional commands via configuration.
 */
export class CommandDispatcher implements vscode.Disposable {
    private readonly log: Logger;
    private readonly statusBar: StatusBar;

    /** Commands confirmed to exist in this VS Code instance. */
    private availableCommands: AcceptCommand[] = [];
    /** User-supplied additional command IDs. */
    private additionalCommands: string[] = [];

    private pollTimer: ReturnType<typeof setTimeout> | undefined;
    private running = false;
    private disposed = false;

    /** Activity tracking for adaptive polling. */
    private lastActivityAt: number = Date.now();
    private activityListener: vscode.Disposable | undefined;

    /** Stats */
    private totalCycles = 0;

    constructor(logger: Logger, statusBar: StatusBar) {
        this.log = logger;
        this.statusBar = statusBar;
    }

    /**
     * Discover available commands and start the polling loop.
     */
    async start(config: ExtensionConfig, enabledCategories: Set<AcceptCategory>): Promise<void> {
        if (this.disposed || this.running) return;

        await this.discoverCommands(enabledCategories, config.additionalAcceptCommands);

        if (this.availableCommands.length === 0 && this.additionalCommands.length === 0) {
            this.log.warn('No accept commands found in this VS Code instance. Polling will only run additional commands if configured.');
        }

        // Start activity tracking for adaptive polling
        if (config.adaptivePolling) {
            this.startActivityTracking();
        }

        this.running = true;
        this.scheduleNext(config);
        this.log.info(
            `Command polling started: ${this.availableCommands.length} built-in + ${this.additionalCommands.length} additional commands, interval=${config.pollIntervalMs}ms`,
        );
    }

    stop(): void {
        if (!this.running) return;

        if (this.pollTimer !== undefined) {
            clearTimeout(this.pollTimer);
            this.pollTimer = undefined;
        }

        this.activityListener?.dispose();
        this.activityListener = undefined;

        this.running = false;
        this.totalCycles = 0;
        this.log.info('Command polling stopped.');
    }

    getStats(): DispatchStats {
        const categories = new Set(this.availableCommands.map(c => c.category));
        return {
            totalCycles: this.totalCycles,
            commandsAvailable: this.availableCommands.length + this.additionalCommands.length,
            lastCycleAt: this.totalCycles > 0 ? new Date() : null,
            activeCategories: [...categories],
        };
    }

    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        this.stop();
    }

    // ─── Internals ───────────────────────────────────────────────

    /**
     * Discover which accept commands actually exist in this VS Code instance.
     * This avoids blindly firing commands that will always fail.
     */
    private async discoverCommands(
        enabledCategories: Set<AcceptCategory>,
        additionalIds: string[],
    ): Promise<void> {
        try {
            const allRegistered = new Set(await vscode.commands.getCommands(true));

            this.availableCommands = ACCEPT_COMMANDS.filter(
                cmd => enabledCategories.has(cmd.category) && allRegistered.has(cmd.id),
            );

            // Additional commands: include if they exist, categorize as 'chat' fallback
            this.additionalCommands = additionalIds.filter(id => allRegistered.has(id));

            const skipped = ACCEPT_COMMANDS.filter(
                cmd => enabledCategories.has(cmd.category) && !allRegistered.has(cmd.id),
            );
            if (skipped.length > 0) {
                this.log.info(
                    `Skipped ${skipped.length} commands not registered in this VS Code: ${skipped.map(c => c.id).join(', ')}`,
                );
            }
        } catch (err) {
            this.log.error('Failed to discover commands', err);
            // Fall back to trying all commands for enabled categories
            this.availableCommands = ACCEPT_COMMANDS.filter(cmd =>
                enabledCategories.has(cmd.category),
            );
        }
    }

    /**
     * Execute one dispatch cycle: fire all available accept commands.
     */
    private async dispatchOnce(): Promise<void> {
        const commandIds = [
            ...this.availableCommands.map(c => c.id),
            ...this.additionalCommands,
        ];

        for (const cmdId of commandIds) {
            try {
                // Fire and forget — commands are no-ops when not applicable.
                // We use void to explicitly discard the promise; errors are not actionable.
                void vscode.commands.executeCommand(cmdId).then(undefined, () => { });
            } catch {
                // Synchronous errors from executeCommand are extremely rare — ignore.
            }
        }

        this.totalCycles++;
        this.statusBar.recordDispatchCycle();
    }

    /**
     * Schedule the next dispatch cycle with adaptive interval.
     */
    private scheduleNext(config: ExtensionConfig): void {
        if (!this.running || this.disposed) return;

        const interval = this.computeInterval(config);

        this.pollTimer = setTimeout(async () => {
            await this.dispatchOnce();
            this.scheduleNext(config);
        }, interval);
    }

    /**
     * Compute the polling interval based on editor activity.
     */
    private computeInterval(config: ExtensionConfig): number {
        if (!config.adaptivePolling) {
            return config.pollIntervalMs;
        }

        const idleMs = Date.now() - this.lastActivityAt;

        if (idleMs > ADAPTIVE_POLLING.DEEP_IDLE_THRESHOLD_MS) {
            return config.pollIntervalMs * ADAPTIVE_POLLING.DEEP_IDLE_MULTIPLIER;
        }
        if (idleMs > ADAPTIVE_POLLING.IDLE_THRESHOLD_MS) {
            return config.pollIntervalMs * ADAPTIVE_POLLING.IDLE_MULTIPLIER;
        }
        return config.pollIntervalMs * ADAPTIVE_POLLING.ACTIVE_MULTIPLIER;
    }

    /**
     * Track document changes to detect editor activity.
     */
    private startActivityTracking(): void {
        this.activityListener = vscode.workspace.onDidChangeTextDocument(() => {
            this.lastActivityAt = Date.now();
        });
    }
}
