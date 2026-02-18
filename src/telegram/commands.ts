import TelegramBot from 'node-telegram-bot-api';
import { getBot, alertsSentCount, startTime, sendTelegramMessage } from './alerts';
import { isClankerWsConnected, isDopplerWsConnected } from '../chain/listener';
import {
    addWatchedAccount,
    removeWatchedAccount,
    getWatchedAccounts,
    getWatchedCount,
    getRecentAlerts,
    saveWalletMapping,
} from '../db';
import { discoverWalletsFromClanker } from '../api/clanker';
import { discoverWalletsFromDoppler } from '../api/doppler';
import { discoverWalletsFromBankr } from '../api/bankr';
import { logger } from '../logger';

/**
 * Parses an X handle from a URL or plain handle string.
 * Accepts: https://x.com/username, https://twitter.com/username, @username, username
 */
function parseXHandle(input: string): string | null {
    const trimmed = input.trim();

    // URL format
    const urlMatch = trimmed.match(/(?:twitter\.com|x\.com)\/([A-Za-z0-9_]{1,50})/i);
    if (urlMatch) return urlMatch[1].toLowerCase();

    // @handle or plain handle
    const handleMatch = trimmed.match(/^@?([A-Za-z0-9_]{1,50})$/);
    if (handleMatch) return handleMatch[1].toLowerCase();

    return null;
}

/**
 * Formats uptime duration into a human-readable string.
 */
function formatUptime(start: Date): string {
    const ms = Date.now() - start.getTime();
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / 60000) % 60;
    const hours = Math.floor(ms / 3600000) % 24;
    const days = Math.floor(ms / 86400000);
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}

function escapeHtml(text: string): string {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Registers all Telegram bot command handlers.
 */
export function registerCommands(): void {
    const bot: TelegramBot = getBot();

    // /add [url or handle]
    bot.onText(/^\/add(?:\s+(.+))?$/, async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
        const chatId = msg.chat.id.toString();
        const input = match?.[1]?.trim();

        if (!input) {
            await bot.sendMessage(chatId, '❌ Usage: /add [X profile URL or handle]\nExample: /add @username or /add https://x.com/username');
            return;
        }

        const handle = parseXHandle(input);
        if (!handle) {
            await bot.sendMessage(chatId, `❌ Could not parse an X handle from: <code>${escapeHtml(input)}</code>`, { parse_mode: 'HTML' });
            return;
        }

        try {
            const added = await addWatchedAccount(handle);
            const statusMsg = added
                ? `✅ Now watching @${escapeHtml(handle)}`
                : `⚠️ @${escapeHtml(handle)} is already in your watchlist. Running wallet discovery...`;

            const initialMsg = await bot.sendMessage(chatId, `${statusMsg}\n\n<i>Searching for associated wallets...</i>`, { parse_mode: 'HTML' });

            // Wallet Discovery Pass
            const [clWallets, dpWallets, bkWallets] = await Promise.all([
                discoverWalletsFromClanker(handle),
                discoverWalletsFromDoppler(handle),
                discoverWalletsFromBankr(handle)
            ]);

            const allWallets = new Set([...clWallets, ...dpWallets, ...bkWallets]);
            const discovered: string[] = [];

            for (const wallet of allWallets) {
                const saved = await saveWalletMapping(handle, wallet, 'Initial Discovery');
                if (saved) discovered.push(wallet);
            }

            let resultMsg = `${statusMsg}\n\n`;
            if (discovered.length > 0) {
                resultMsg += `🕵️ <b>Discovered ${discovered.length} wallets:</b>\n` +
                    discovered.map(w => `<code>${w}</code>`).join('\n') +
                    `\n\n⚡ <i>Instant alerts active for these wallets!</i>`;
            } else {
                resultMsg += `🔎 No historical wallets found. Alerts will activate once the first token is indexed.`;
            }

            await bot.editMessageText(resultMsg, {
                chat_id: chatId,
                message_id: initialMsg.message_id,
                parse_mode: 'HTML'
            });

            if (added) {
                logger.info(`Added @${handle} to watchlist with ${discovered.length} wallets.`);
            }
        } catch (err) {
            logger.error('Error in /add command:', err);
            await bot.sendMessage(chatId, '❌ Database error. Please try again.');
        }
    });

    // /remove [handle]
    bot.onText(/^\/remove(?:\s+(.+))?$/, async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
        const chatId = msg.chat.id.toString();
        const input = match?.[1]?.trim();

        if (!input) {
            await bot.sendMessage(chatId, '❌ Usage: /remove [handle]\nExample: /remove @username');
            return;
        }

        const handle = parseXHandle(input);
        if (!handle) {
            await bot.sendMessage(chatId, `❌ Could not parse an X handle from: <code>${escapeHtml(input)}</code>`, { parse_mode: 'HTML' });
            return;
        }

        try {
            const removed = await removeWatchedAccount(handle);
            if (removed) {
                await bot.sendMessage(chatId, `✅ Removed @${escapeHtml(handle)} from your watchlist.`, { parse_mode: 'HTML' });
                logger.info(`Removed @${handle} from watchlist.`);
            } else {
                await bot.sendMessage(chatId, `⚠️ @${escapeHtml(handle)} was not found in your watchlist.`, { parse_mode: 'HTML' });
            }
        } catch (err) {
            logger.error('Error in /remove command:', err);
            await bot.sendMessage(chatId, '❌ Database error. Please try again.');
        }
    });

    // /list
    bot.onText(/^\/list$/, async (msg: TelegramBot.Message) => {
        const chatId = msg.chat.id.toString();
        try {
            const accounts = await getWatchedAccounts();
            if (accounts.length === 0) {
                await bot.sendMessage(chatId, 'Your watchlist is empty. Use /add to add accounts.');
                return;
            }

            const lines = accounts.map((a, i) => `${i + 1}. @${escapeHtml(a.x_handle)}`);
            const message = `👀 <b>Watched Accounts (${accounts.length})</b>\n\n${lines.join('\n')}`;
            await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
        } catch (err) {
            logger.error('Error in /list command:', err);
            await bot.sendMessage(chatId, '❌ Database error. Please try again.');
        }
    });

    // /status
    bot.onText(/^\/status$/, async (msg: TelegramBot.Message) => {
        const chatId = msg.chat.id.toString();
        try {
            const watchedCount = await getWatchedCount();
            const clankerStatus = isClankerWsConnected() ? '🟢 Connected' : '🔴 Reconnecting...';
            const dopplerStatus = isDopplerWsConnected() ? '🟢 Connected' : '🔴 Reconnecting...';
            const uptime = formatUptime(startTime);

            const message = [
                `📊 <b>KRAVEN Status</b>`,
                ``,
                `⏱ <b>Uptime:</b> ${uptime}`,
                `🔌 <b>Clanker WS:</b> ${clankerStatus}`,
                `🔌 <b>Doppler WS:</b> ${dopplerStatus}`,
                `👀 <b>Watching:</b> ${watchedCount} account${watchedCount !== 1 ? 's' : ''}`,
                `🚨 <b>Alerts sent:</b> ${alertsSentCount}`,
            ].join('\n');

            await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
        } catch (err) {
            logger.error('Error in /status command:', err);
            await bot.sendMessage(chatId, '❌ Error fetching status.');
        }
    });

    // /recent
    bot.onText(/^\/recent$/, async (msg: TelegramBot.Message) => {
        const chatId = msg.chat.id.toString();
        try {
            const alerts = await getRecentAlerts(5);
            if (alerts.length === 0) {
                await bot.sendMessage(chatId, '📭 No alerts have been sent yet.');
                return;
            }

            const lines = alerts.map((a, i) => {
                const time = new Date(a.alerted_at).toUTCString();
                return [
                    `<b>${i + 1}. ${escapeHtml(a.token_name)} $${escapeHtml(a.token_symbol)}</b>`,
                    `   📄 CA: <code>${a.contract_address}</code>`,
                    `   🐦 @${escapeHtml(a.deployer_x_handle)} · ${escapeHtml(a.platform)}`,
                    `   ⏰ ${time}`,
                ].join('\n');
            });

            const message = `📋 <b>Recent Alerts</b>\n\n${lines.join('\n\n')}`;
            await bot.sendMessage(chatId, message, { parse_mode: 'HTML', disable_web_page_preview: true });
        } catch (err) {
            logger.error('Error in /recent command:', err);
            await bot.sendMessage(chatId, '❌ Database error. Please try again.');
        }
    });

    // /help
    bot.onText(/^\/help$/, async (msg: TelegramBot.Message) => {
        const chatId = msg.chat.id.toString();
        const message = [
            `🤖 <b>KRAVEN — Command Reference</b>`,
            ``,
            `<b>/add</b> [URL or handle] — Add an X account to your watchlist`,
            `  Example: <code>/add @username</code> or <code>/add https://x.com/username</code>`,
            ``,
            `<b>/remove</b> [handle] — Remove an account from your watchlist`,
            `  Example: <code>/remove @username</code>`,
            ``,
            `<b>/list</b> — Show all currently watched accounts`,
            ``,
            `<b>/status</b> — Show bot uptime, WebSocket status, and alert count`,
            ``,
            `<b>/recent</b> — Show the last 5 alerts sent`,
            ``,
            `<b>/help</b> — Show this help message`,
            ``,
            `KRAVEN monitors Clanker, Doppler &amp; Bankr token deployments on Base and alerts you when a watched account deploys a token.`,
        ].join('\n');

        await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    });

    logger.info('All Telegram command handlers registered.');
}
