import * as vscode from 'vscode';

/**
 * Centralized logger that wraps a VS Code OutputChannel.
 * All extension modules log through this to ensure consistent formatting.
 */
export class Logger implements vscode.Disposable {
    private readonly channel: vscode.OutputChannel;
    private disposed = false;

    constructor(channelName: string) {
        this.channel = vscode.window.createOutputChannel(channelName);
    }

    info(message: string): void {
        this.write('INFO', message);
    }

    warn(message: string): void {
        this.write('WARN', message);
    }

    error(message: string, err?: unknown): void {
        const suffix = err instanceof Error ? `: ${err.message}` : err ? `: ${String(err)}` : '';
        this.write('ERROR', `${message}${suffix}`);
    }

    /** Show the output channel panel to the user. */
    show(): void {
        if (!this.disposed) {
            this.channel.show(true);
        }
    }

    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        this.channel.dispose();
    }

    private write(level: string, message: string): void {
        if (this.disposed) return;
        try {
            const ts = new Date().toISOString();
            this.channel.appendLine(`[${ts}] [${level}] ${message}`);
        } catch {
            // Channel may already be disposed — ignore.
        }
    }
}
