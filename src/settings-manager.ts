import * as vscode from 'vscode';
import { AcceptCategory, AutoApproveSetting, ExtensionConfig } from './types';
import { AUTO_APPROVE_SETTINGS, CONFIG_SECTION } from './constants';
import { Logger } from './logger';

/**
 * Manages VS Code's built-in auto-approval settings.
 *
 * Responsibilities:
 * - Save original setting values before modifying them.
 * - Apply auto-approve settings filtered by enabled categories.
 * - Restore all settings to their original values on stop/dispose.
 */
export class SettingsManager implements vscode.Disposable {
    private readonly savedValues = new Map<string, unknown>();
    private readonly log: Logger;
    private applied = false;

    constructor(logger: Logger) {
        this.log = logger;
    }

    /**
     * Read the current extension configuration.
     */
    readConfig(): ExtensionConfig {
        const cfg = vscode.workspace.getConfiguration(CONFIG_SECTION);
        return {
            autoStart: cfg.get<boolean>('autoStart', true),
            autoApproveEdits: cfg.get<boolean>('autoApproveEdits', true),
            autoApproveTerminal: cfg.get<boolean>('autoApproveTerminal', true),
            autoApproveChat: cfg.get<boolean>('autoApproveChat', true),
            enableCommandPolling: cfg.get<boolean>('enableCommandPolling', true),
            pollIntervalMs: cfg.get<number>('pollIntervalMs', 1500),
            maxAgentRequests: cfg.get<number>('maxAgentRequests', 100),
            additionalAcceptCommands: cfg.get<string[]>('additionalAcceptCommands', []),
            adaptivePolling: cfg.get<boolean>('adaptivePolling', true),
            showNotifications: cfg.get<boolean>('showNotifications', true),
            showStatusBar: cfg.get<boolean>('showStatusBar', true),
            terminalProtection: cfg.get<boolean>('terminalProtection', true),
            blockedPatterns: cfg.get<string[]>('blockedPatterns', []),
        };
    }

    /**
     * Apply auto-approve settings for the given enabled categories.
     * Saves original values so they can be restored later.
     */
    async apply(enabledCategories: Set<AcceptCategory>): Promise<void> {
        this.savedValues.clear();

        const config = this.readConfig();
        const settingsToApply = this.filterByCategory(enabledCategories);
        let applied = 0;

        for (const setting of settingsToApply) {
            const fullKey = `${setting.section}.${setting.key}`;
            try {
                const sectionCfg = vscode.workspace.getConfiguration(setting.section);
                const inspect = sectionCfg.inspect(setting.key);

                // Save the current global value (may be undefined if never set)
                this.savedValues.set(fullKey, inspect?.globalValue);

                // For maxRequests, use the user-configured value instead of the constant
                const value = setting.key === 'maxRequests'
                    ? config.maxAgentRequests
                    : setting.valueWhenOn;

                await sectionCfg.update(setting.key, value, vscode.ConfigurationTarget.Global);
                this.log.info(`Applied ${fullKey} = ${JSON.stringify(value)}`);
                applied++;
            } catch (err) {
                // Non-fatal: the setting may not exist in this VS Code version
                const msg = err instanceof Error ? err.message : String(err);
                this.log.warn(`Could not apply ${fullKey} = ${JSON.stringify(setting.valueWhenOn)} — ${msg}`);
            }
        }

        this.applied = true;
        this.log.info(`Settings applied: ${applied}/${settingsToApply.length} succeeded`);
    }

    /**
     * Restore all settings to their original values.
     */
    restore(): void {
        if (!this.applied) return;

        let restored = 0;
        for (const [section, key] of AUTO_APPROVE_SETTINGS.map(s => [s.section, s.key] as const)) {
            const fullKey = `${section}.${key}`;
            try {
                const original = this.savedValues.get(fullKey);
                const sectionCfg = vscode.workspace.getConfiguration(section);
                sectionCfg.update(key, original, vscode.ConfigurationTarget.Global);
                this.log.info(`Restored ${fullKey} = ${JSON.stringify(original)}`);
                restored++;
            } catch (err) {
                this.log.warn(`Could not restore ${fullKey}`);
            }
        }

        this.savedValues.clear();
        this.applied = false;
        this.log.info(`Settings restored: ${restored} keys`);
    }

    dispose(): void {
        this.restore();
    }

    /**
     * Filter settings by enabled categories.
     */
    private filterByCategory(enabled: Set<AcceptCategory>): AutoApproveSetting[] {
        return AUTO_APPROVE_SETTINGS.filter(s => enabled.has(s.category));
    }
}
