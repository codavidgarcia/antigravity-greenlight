import * as vscode from 'vscode';
import { Logger } from './logger';

/**
 * Terminal Guard — monitors shell command execution and kills
 * commands that match blocked patterns.
 *
 * **How it works:**
 * Uses VS Code's Shell Integration API (1.93+) to listen for
 * `onDidStartTerminalShellExecution` events. When a command starts,
 * the guard checks its text against the configured blocked patterns.
 * If a match is found, it immediately sends Ctrl+C to the terminal
 * to kill the process, then notifies the user.
 *
 * **Limitations:**
 * - Reactive, not preventive — the command starts before we can kill it.
 *   For commands that need filesystem traversal (rm -rf), this is fast enough.
 *   For instant-effect commands (e.g. `echo > /dev/sda`), damage may occur.
 * - Requires VS Code 1.93+ for the Shell Integration API.
 *   On older versions, the guard logs a warning and gracefully degrades.
 * - Uses substring matching (case-insensitive), not regex, for simplicity.
 */
export class TerminalGuard implements vscode.Disposable {
    private readonly log: Logger;
    private patterns: string[] = [];
    private listener: vscode.Disposable | undefined;
    private disposed = false;
    private blockedCount = 0;

    constructor(logger: Logger) {
        this.log = logger;
    }

    /**
     * Start monitoring terminal execution with the given blocked patterns.
     * Gracefully degrades if the Shell Integration API is unavailable.
     */
    start(patterns: string[]): void {
        if (this.disposed) return;

        this.patterns = patterns.map(p => p.toLowerCase());

        if (this.patterns.length === 0) {
            this.log.info('Terminal protection: no blocked patterns configured — guard inactive.');
            return;
        }

        // Runtime check: onDidStartTerminalShellExecution requires VS Code 1.93+.
        // We target 1.90, so we check at runtime and use `any` to avoid type errors.
        const onDidStart = (vscode.window as any).onDidStartTerminalShellExecution;
        if (typeof onDidStart !== 'function') {
            this.log.warn(
                'Terminal protection requires VS Code 1.93+. ' +
                'Your version does not support shell execution events. ' +
                'Consider disabling terminal auto-approve (greenlight.autoApproveTerminal = false) for safety.',
            );
            return;
        }

        this.listener = onDidStart.call(vscode.window, (event: any) => {
            this.onShellExecution(event);
        });

        this.log.info(`Terminal protection active: monitoring ${this.patterns.length} blocked patterns.`);
    }

    stop(): void {
        this.listener?.dispose();
        this.listener = undefined;
        this.blockedCount = 0;
    }

    getBlockedCount(): number {
        return this.blockedCount;
    }

    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        this.stop();
    }

    // ─── Internals ───────────────────────────────────────────────

    private onShellExecution(event: any): void {
        try {
            const commandLine: string | undefined = event?.execution?.commandLine?.value;
            if (!commandLine) return;

            const lower = commandLine.toLowerCase().trim();
            const matchedPattern = this.patterns.find(pattern => lower.includes(pattern));

            if (!matchedPattern) return;

            this.blockedCount++;

            // Immediately kill the command with Ctrl+C (ASCII 0x03).
            // The `false` argument prevents appending a newline.
            const terminal: vscode.Terminal | undefined = event?.terminal;
            if (terminal) {
                terminal.sendText('\x03', false);
            }

            this.log.warn(`BLOCKED: "${commandLine}" — matched pattern "${matchedPattern}"`);

            vscode.window
                .showWarningMessage(
                    `Antigravity Greenlight: Blocked destructive command — "${commandLine}"`,
                    'View Log',
                    'Dismiss',
                )
                .then(action => {
                    if (action === 'View Log') {
                        this.log.show();
                    }
                });
        } catch (err) {
            // Guard errors must never crash the extension.
            this.log.error('Terminal guard error', err);
        }
    }
}
