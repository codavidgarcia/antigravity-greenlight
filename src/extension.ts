import * as vscode from 'vscode';
import { Logger } from './logger';
import { SettingsManager } from './settings-manager';
import { CommandDispatcher } from './command-dispatcher';
import { StatusBar } from './status-bar';
import { TerminalGuard } from './terminal-guard';
import { Controller } from './controller';
import { runDiagnostics } from './diagnostics';

let controller: Controller | undefined;

export function activate(context: vscode.ExtensionContext): void {
    try {
        // ── Create components ──────────────────────────────────────
        const logger = new Logger('Antigravity Greenlight');
        const statusBar = new StatusBar(logger);
        const settingsManager = new SettingsManager(logger);
        const dispatcher = new CommandDispatcher(logger, statusBar);
        const guard = new TerminalGuard(logger);

        controller = new Controller(logger, settingsManager, dispatcher, statusBar, guard);

        // ── Register commands ──────────────────────────────────────
        const toggleCmd = vscode.commands.registerCommand('greenlight.toggle', () => {
            try {
                controller?.toggle();
            } catch (err) {
                logger.error('Toggle command failed', err);
            }
        });

        const enableCmd = vscode.commands.registerCommand('greenlight.enable', () => {
            try {
                controller?.enable();
            } catch (err) {
                logger.error('Enable command failed', err);
            }
        });

        const disableCmd = vscode.commands.registerCommand('greenlight.disable', () => {
            try {
                controller?.disable();
            } catch (err) {
                logger.error('Disable command failed', err);
            }
        });

        const showMenuCmd = vscode.commands.registerCommand('greenlight.showMenu', () => {
            try {
                statusBar.showMenu();
            } catch (err) {
                logger.error('Show menu command failed', err);
            }
        });

        const toggleStatusBarCmd = vscode.commands.registerCommand('greenlight.toggleStatusBar', () => {
            try {
                statusBar.toggleVisibility();
            } catch (err) {
                logger.error('Toggle status bar command failed', err);
            }
        });

        const diagCmd = vscode.commands.registerCommand('greenlight.diagnostics', async () => {
            try {
                await runDiagnostics(logger);
            } catch (err) {
                logger.error('Diagnostics command failed', err);
            }
        });

        // ── Register disposables ───────────────────────────────────
        context.subscriptions.push(
            toggleCmd, enableCmd, disableCmd, showMenuCmd,
            toggleStatusBarCmd, diagCmd, controller, logger,
        );

        // ── Auto-start if configured ───────────────────────────────
        const config = settingsManager.readConfig();
        if (config.autoStart) {
            controller.start().catch(err => {
                logger.error('Auto-start failed', err);
            });
        }

        logger.info('Extension activated.');
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`Antigravity Greenlight: Activation failed — ${msg}`);
    }
}

export function deactivate(): void {
    try {
        if (controller) {
            controller.dispose();
            controller = undefined;
        }
    } catch (err) {
        console.error('Antigravity Greenlight: Deactivation error:', err);
    }
}
