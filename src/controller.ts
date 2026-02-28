import * as vscode from 'vscode';
import { AcceptCategory, ExtensionState } from './types';
import { CONFIG_SECTION } from './constants';
import { Logger } from './logger';
import { SettingsManager } from './settings-manager';
import { CommandDispatcher } from './command-dispatcher';
import { StatusBar } from './status-bar';
import { TerminalGuard } from './terminal-guard';

/**
 * Main orchestrator that wires together all extension components.
 *
 * Responsibilities:
 * - Lifecycle: start / stop / toggle / dispose
 * - Read user config and derive enabled categories
 * - Coordinate SettingsManager, CommandDispatcher, and TerminalGuard
 * - React to configuration changes at runtime
 */
export class Controller implements vscode.Disposable {
    private readonly log: Logger;
    private readonly settings: SettingsManager;
    private readonly dispatcher: CommandDispatcher;
    private readonly statusBar: StatusBar;
    private readonly guard: TerminalGuard;

    private state: ExtensionState = 'inactive';
    private configChangeListener: vscode.Disposable | undefined;
    private disposed = false;

    constructor(
        logger: Logger,
        settingsManager: SettingsManager,
        commandDispatcher: CommandDispatcher,
        statusBar: StatusBar,
        terminalGuard: TerminalGuard,
    ) {
        this.log = logger;
        this.settings = settingsManager;
        this.dispatcher = commandDispatcher;
        this.statusBar = statusBar;
        this.guard = terminalGuard;
    }

    // ─── Public API ────────────────────────────────────────────────

    async start(): Promise<void> {
        if (this.disposed || this.state === 'active' || this.state === 'starting') return;

        try {
            this.state = 'starting';
            this.statusBar.update('starting');

            const config = this.settings.readConfig();
            const enabledCategories = this.resolveCategories(config);

            this.log.info(`Starting with categories: ${[...enabledCategories].join(', ')}`);

            // 1. Apply VS Code's built-in auto-approve settings
            await this.settings.apply(enabledCategories);

            // 2. Start command polling if enabled
            if (config.enableCommandPolling) {
                await this.dispatcher.start(config, enabledCategories);
            } else {
                this.log.info('Command polling is disabled — relying on settings-based auto-approve only.');
            }

            // 3. Start terminal protection if enabled
            if (config.terminalProtection && enabledCategories.has('terminal')) {
                this.guard.start(config.blockedPatterns);
            }

            // 4. Listen for config changes
            this.watchConfigChanges();

            this.state = 'active';
            this.statusBar.update('active');

            if (config.showNotifications) {
                vscode.window.showInformationMessage(
                    'Antigravity Greenlight: Active — agent actions will be auto-approved.',
                );
            }

            this.log.info('Auto-accept started successfully.');
        } catch (err) {
            this.state = 'error';
            this.statusBar.update('error');
            this.log.error('Failed to start auto-accept', err);

            const msg = err instanceof Error ? err.message : String(err);
            vscode.window.showWarningMessage(`Antigravity Greenlight: Failed to start — ${msg}`);
        }
    }

    stop(): void {
        if (this.disposed || this.state === 'inactive') return;

        try {
            this.log.info('Stopping auto-accept...');

            this.dispatcher.stop();
            this.guard.stop();
            this.settings.restore();
            this.configChangeListener?.dispose();
            this.configChangeListener = undefined;

            this.state = 'inactive';
            this.statusBar.update('inactive');
            this.statusBar.resetStats();

            const config = this.settings.readConfig();
            if (config.showNotifications) {
                vscode.window.showInformationMessage(
                    'Antigravity Greenlight: Stopped — original settings restored.',
                );
            }

            this.log.info('Auto-accept stopped. Settings restored.');
        } catch (err) {
            this.state = 'error';
            this.statusBar.update('error');
            this.log.error('Error during stop', err);
        }
    }

    toggle(): void {
        if (this.disposed) {
            this.log.warn('Cannot toggle: controller is disposed.');
            return;
        }

        if (this.state === 'active') {
            this.stop();
        } else {
            void this.start();
        }
    }

    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;

        try { this.dispatcher.dispose(); } catch { /* best-effort */ }
        try { this.guard.dispose(); } catch { /* best-effort */ }
        try { this.settings.dispose(); } catch { /* best-effort */ }
        try { this.statusBar.dispose(); } catch { /* best-effort */ }
        try { this.configChangeListener?.dispose(); } catch { /* best-effort */ }
    }

    // ─── Internals ─────────────────────────────────────────────────

    /**
     * Derive enabled AcceptCategories from user config.
     */
    private resolveCategories(config: ReturnType<SettingsManager['readConfig']>): Set<AcceptCategory> {
        const categories = new Set<AcceptCategory>();

        if (config.autoApproveEdits) categories.add('edits');
        if (config.autoApproveTerminal) categories.add('terminal');
        if (config.autoApproveChat) {
            categories.add('chat');
            categories.add('notification'); // notifications are tied to chat actions
        }

        return categories;
    }

    /**
     * Watch for configuration changes and restart if relevant settings changed.
     */
    private watchConfigChanges(): void {
        this.configChangeListener = vscode.workspace.onDidChangeConfiguration(e => {
            if (!e.affectsConfiguration(CONFIG_SECTION)) return;

            this.log.info('Configuration changed — restarting with new settings...');
            this.stop();
            void this.start();
        });
    }
}
