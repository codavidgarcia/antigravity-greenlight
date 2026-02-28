import * as vscode from 'vscode';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { AUTO_APPROVE_SETTINGS } from './constants';
import { DIAGNOSTIC_COMMAND_PATTERNS } from './constants';
import { Logger } from './logger';

/**
 * Diagnostic tool that discovers commands, inspects settings, and lists
 * installed AI extensions. Generates a markdown report.
 *
 * Run via Command Palette: "Greenlight: Run Diagnostics"
 */
export async function runDiagnostics(logger: Logger): Promise<void> {
    logger.show();
    logger.info('=== Starting Diagnostics ===');

    const lines: string[] = [];
    const log = (msg: string) => {
        lines.push(msg);
        logger.info(msg);
    };

    log('# Antigravity Greenlight — Diagnostics Report');
    log(`**Date:** ${new Date().toISOString()}`);
    log(`**VS Code Version:** ${vscode.version}`);
    log('');

    // ── Section 1: Discover commands ──────────────────────────────

    log('## 1. Discovered Commands');
    log('');

    try {
        const allCommands = await vscode.commands.getCommands(true);
        const matched = allCommands
            .filter(cmd => DIAGNOSTIC_COMMAND_PATTERNS.some(p => p.test(cmd)))
            .sort();

        if (matched.length === 0) {
            log('> No matching accept/approve commands found.');
        } else {
            log(`Found **${matched.length}** commands matching accept/approve patterns:`);
            log('');
            for (const cmd of matched) {
                log(`- \`${cmd}\``);
            }
        }

        log('');
        log('### All chat/copilot/agent/gemini commands');
        log('');

        const related = allCommands
            .filter(cmd =>
                /^(chat|copilot|github\.copilot|agent|gemini|google|workbench\.action\.chat|inlineChat)/i.test(cmd),
            )
            .sort();

        if (related.length === 0) {
            log('> No related commands found.');
        } else {
            for (const cmd of related) {
                log(`- \`${cmd}\``);
            }
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log(`> Error discovering commands: ${msg}`);
    }

    log('');

    // ── Section 2: Settings inspection ────────────────────────────

    log('## 2. Settings Inspection');
    log('');
    log('| Setting | Exists | Global Value | Effective Value | Default |');
    log('|---------|--------|-------------|-----------------|---------|');

    // Include additional speculative settings for diagnostics
    const diagnosticSettings = [
        ...AUTO_APPROVE_SETTINGS,
        { section: 'chat.agent', key: 'autoApprove', valueWhenOn: true, category: 'chat' as const },
        { section: 'github.copilot.chat.agent', key: 'autoApprove', valueWhenOn: true, category: 'chat' as const },
        { section: 'github.copilot.chat', key: 'autoApprove', valueWhenOn: true, category: 'chat' as const },
    ];

    for (const { section, key } of diagnosticSettings) {
        const fullKey = `${section}.${key}`;
        try {
            const cfg = vscode.workspace.getConfiguration(section);
            const inspect = cfg.inspect(key);

            if (inspect) {
                const globalVal = JSON.stringify(inspect.globalValue ?? 'unset');
                const effective = JSON.stringify(cfg.get(key));
                const defaultVal = JSON.stringify(inspect.defaultValue ?? 'none');
                log(`| \`${fullKey}\` | ✅ | ${globalVal} | ${effective} | ${defaultVal} |`);
            } else {
                log(`| \`${fullKey}\` | ❌ | — | — | — |`);
            }
        } catch {
            log(`| \`${fullKey}\` | ⚠️ error | — | — | — |`);
        }
    }

    log('');

    // ── Section 3: Installed AI extensions ────────────────────────

    log('## 3. Installed AI Extensions');
    log('');

    const aiExtensions = vscode.extensions.all.filter(ext => {
        const combined = `${ext.id} ${ext.packageJSON?.displayName ?? ''}`.toLowerCase();
        return (
            combined.includes('copilot') ||
            combined.includes('gemini') ||
            combined.includes('agent') ||
            combined.includes('chat') ||
            combined.includes('ai') ||
            combined.includes('antigravity') ||
            combined.includes('greenlight')
        );
    });

    if (aiExtensions.length === 0) {
        log('> No AI-related extensions found.');
    } else {
        log('| Extension ID | Display Name | Status |');
        log('|-------------|-------------|--------|');
        for (const ext of aiExtensions) {
            const displayName = ext.packageJSON?.displayName ?? 'N/A';
            const status = ext.isActive ? '🟢 Active' : '⚪ Inactive';
            log(`| \`${ext.id}\` | ${displayName} | ${status} |`);
        }
    }

    log('');
    log('---');
    log('*Share this report to help identify which commands and settings are available in your environment.*');

    // ── Write report to file ──────────────────────────────────────

    try {
        const reportPath = path.join(os.tmpdir(), 'greenlight-diagnostics.md');
        fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(reportPath));
        await vscode.window.showTextDocument(doc, { preview: false });
        logger.info(`Report saved to: ${reportPath}`);
    } catch (err) {
        logger.error('Could not open report file', err);
        logger.info('Full report is available in the Output Channel above.');
    }

    vscode.window.showInformationMessage('Antigravity Greenlight: Diagnostics complete — check the report.');
}
