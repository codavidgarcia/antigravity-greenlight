import * as vscode from 'vscode';
import { ExtensionState } from './types';
import { CONFIG_SECTION } from './constants';
import { Logger } from './logger';

/**
 * Manages the status bar item that shows current auto-accept state.
 *
 * Click behavior:
 * - Shows a QuickPick menu with contextual options based on current state.
 * - Users can also trigger the menu via Cmd+Shift+P → "Greenlight: Show Options".
 *
 * Visibility:
 * - Controlled by the `greenlight.showStatusBar` setting.
 * - Can be toggled from the command palette even when hidden.
 */
export class StatusBar implements vscode.Disposable {
    private readonly item: vscode.StatusBarItem;
    private readonly log: Logger;
    private disposed = false;
    private dispatchCycles = 0;
    private currentState: ExtensionState = 'inactive';
    private visible = true;

    constructor(logger: Logger) {
        this.log = logger;
        this.item = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100,
        );
        this.item.command = 'greenlight.showMenu';

        // Read initial visibility setting
        const cfg = vscode.workspace.getConfiguration(CONFIG_SECTION);
        this.visible = cfg.get<boolean>('showStatusBar', true);

        // Ensure it always has text right after creation to be visible if needed
        this.item.text = '$(circle-slash) Greenlight: OFF';

        if (this.visible) {
            this.item.show();
        }
    }

    /**
     * Update the status bar based on the current extension state.
     */
    update(state: ExtensionState): void {
        if (this.disposed) return;
        this.currentState = state;
        this.render();
    }

    /**
     * Get the current extension state (used by the menu to decide options).
     */
    getState(): ExtensionState {
        return this.currentState;
    }

    /**
     * Show or hide the status bar item.
     */
    setVisible(visible: boolean): void {
        if (this.disposed) return;
        this.visible = visible;

        if (visible) {
            this.render();
            this.item.show();
        } else {
            this.item.hide();
        }
    }

    /**
     * Toggle status bar visibility and persist the preference.
     */
    async toggleVisibility(): Promise<void> {
        const newValue = !this.visible;
        this.setVisible(newValue);

        // Persist the preference
        const cfg = vscode.workspace.getConfiguration(CONFIG_SECTION);
        await cfg.update('showStatusBar', newValue, vscode.ConfigurationTarget.Global);

        if (!newValue) {
            vscode.window.showInformationMessage(
                'Greenlight status bar hidden. Use Cmd+Shift+P → "Antigravity Greenlight: Toggle Status Bar Visibility" to show it again.',
            );
        }
    }

    /**
     * Show the QuickPick options menu.
     * This is called when the status bar item is clicked or via the command palette.
     */
    async showMenu(): Promise<void> {
        if (this.disposed) return;

        interface MenuItem extends vscode.QuickPickItem {
            action: string;
        }

        const items: MenuItem[] = [];

        // Contextual toggle option
        if (this.currentState === 'active') {
            items.push({
                label: '$(stop) Disable Auto Mode',
                description: 'Switch to Manual — agent actions require approval',
                action: 'disable',
            });
        } else {
            items.push({
                label: '$(rocket) Enable Auto Mode',
                description: 'Auto-approve agent actions with terminal protection',
                action: 'enable',
            });
        }

        items.push(
            {
                label: '$(gear) Open Greenlight Settings',
                description: 'Configure blocked patterns, polling, and more',
                action: 'settings',
            },
            {
                label: '$(tools) Run Diagnostics',
                description: 'Discover available accept commands in this environment',
                action: 'diagnostics',
            },
            {
                label: '$(eye-closed) Hide Status Bar',
                description: 'Remove from status bar (use Cmd+Shift+P to show again)',
                action: 'hideStatusBar',
            },
        );

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Antigravity Greenlight',
            title: `Greenlight — ${this.stateLabel()}`,
        });

        if (!selected) return;

        switch (selected.action) {
            case 'enable':
                await vscode.commands.executeCommand('greenlight.enable');
                break;
            case 'disable':
                await vscode.commands.executeCommand('greenlight.disable');
                break;
            case 'settings':
                await vscode.commands.executeCommand(
                    'workbench.action.openSettings',
                    '@ext:codavidgarcia.antigravity-greenlight',
                );
                break;
            case 'diagnostics':
                await vscode.commands.executeCommand('greenlight.diagnostics');
                break;
            case 'hideStatusBar':
                await this.toggleVisibility();
                break;
        }
    }

    /**
     * Increment the dispatch cycle counter (called by CommandDispatcher).
     */
    recordDispatchCycle(): void {
        this.dispatchCycles++;
    }

    /**
     * Reset statistics (e.g. on stop).
     */
    resetStats(): void {
        this.dispatchCycles = 0;
    }

    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        this.item.dispose();
    }

    // ── Rendering ─────────────────────────────────────────────────

    private render(): void {
        if (this.disposed) return;

        try {
            switch (this.currentState) {
                case 'active':
                    this.item.text = '$(robot) Auto';
                    this.item.tooltip = 'Greenlight: Auto Mode active — click for options';
                    this.item.backgroundColor = undefined;
                    break;
                case 'inactive':
                    this.item.text = '$(account) Manual';
                    this.item.tooltip = 'Greenlight: Manual Mode — click for options';
                    this.item.backgroundColor = undefined;
                    break;
                case 'starting':
                    this.item.text = '$(sync~spin) Auto...';
                    this.item.tooltip = 'Greenlight: Starting Auto Mode...';
                    this.item.backgroundColor = undefined;
                    break;
                case 'error':
                    this.item.text = '$(warning) Auto: ERROR';
                    this.item.tooltip = 'Greenlight: Error — click for options';
                    this.item.backgroundColor = new vscode.ThemeColor(
                        'statusBarItem.errorBackground'
                    );
                    break;
            }

            // Always keep the command pointing to the menu
            this.item.command = 'greenlight.showMenu';

            if (this.visible) {
                this.item.show();
            }
        } catch {
            // Status bar may have been disposed
        }
    }

    /**
     * Human-readable label for the current state.
     */
    private stateLabel(): string {
        switch (this.currentState) {
            case 'active': return 'Auto Mode Active';
            case 'inactive': return 'Manual Mode';
            case 'starting': return 'Starting...';
            case 'error': return 'Error';
        }
    }
}
