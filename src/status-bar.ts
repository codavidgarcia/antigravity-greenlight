import * as vscode from 'vscode';
import { ExtensionState } from './types';
import { Logger } from './logger';

/**
 * Manages the status bar item that shows current auto-accept state.
 */
export class StatusBar implements vscode.Disposable {
    private readonly item: vscode.StatusBarItem;
    private readonly log: Logger;
    private disposed = false;
    private dispatchCycles = 0;
    private currentState: ExtensionState = 'inactive';

    constructor(logger: Logger) {
        this.log = logger;
        this.item = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100,
        );
        this.item.command = 'greenlight.toggle';

        // Ensure it always has text right after creation to be visible if needed
        this.item.text = '$(circle-slash) Greenlight: OFF';
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
                    this.item.tooltip = 'God Mode Active. Click to switch to Manual.';
                    this.item.backgroundColor = undefined;
                    this.item.command = 'greenlight.toggle';
                    break;
                case 'inactive':
                    this.item.text = '$(account) Manual';
                    this.item.tooltip = 'Manual Mode. Click to switch to Auto (God Mode).';
                    this.item.command = 'greenlight.toggle';
                    this.item.backgroundColor = undefined;
                    break;
                case 'starting':
                    this.item.text = '$(sync~spin) Auto...';
                    this.item.tooltip = 'Starting Auto Mode...';
                    this.item.command = undefined;
                    this.item.backgroundColor = undefined;
                    break;
                case 'error':
                    this.item.text = '$(warning) Auto: ERROR';
                    this.item.tooltip = 'Auto Mode encountered an error. Click to retry.';
                    this.item.command = 'greenlight.toggle';
                    this.item.backgroundColor = new vscode.ThemeColor(
                        'statusBarItem.errorBackground'
                    );
                    break;
            }
            this.item.show();
        } catch {
            // Status bar may have been disposed
        }
    }
}
