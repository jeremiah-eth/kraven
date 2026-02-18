import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config';
import { logger } from '../logger';
import { ClankerToken } from '../api/clanker';
import { saveAlertHistory } from '../db';

let bot: TelegramBot | null = null;
export let alertsSentCount = 0;
export const startTime = new Date();

export function getBot(): TelegramBot {
    if (!bot) throw new Error('Telegram bot not initialized');
    return bot;
}

export function initBot(): TelegramBot {
    bot = new TelegramBot(config.telegramBotToken, { polling: true });
    logger.info('Telegram bot initialized with polling.');
    return bot;
}

/**
 * Escapes special HTML characters for Telegram HTML parse mode.
 */
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Sends a plain text or HTML message to the configured TELEGRAM_CHAT_ID.
 */
export async function sendTelegramMessage(
    text: string,
    parseMode: 'HTML' | 'MarkdownV2' | undefined = 'HTML'
): Promise<void> {
    try {
        const b = getBot();
        await b.sendMessage(config.telegramChatId, text, {
            parse_mode: parseMode,
            disable_web_page_preview: true,
        });
    } catch (err) {
        logger.error('Failed to send Telegram message:', err);
    }
}

/**
 * Formats and sends a token alert to the configured chat.
 * Also saves the alert to alert_history in the database.
 */
export async function sendTokenAlert(token: ClankerToken): Promise<void> {
    const now = new Date().toUTCString();
    const xHandle = token.xHandle!;
    const clankerUrl = `https://clanker.world/clanker/${token.contractAddress}`;

    const message = [
        `🚨 <b>Alpha Alert</b>`,
        ``,
        `💊 <b>Token:</b> ${escapeHtml(token.name)} $${escapeHtml(token.symbol)}`,
        `📄 <b>CA:</b> <code>${token.contractAddress}</code>`,
        `🏭 <b>Platform:</b> ${token.platform}`,
        `🐦 <b>Deployer:</b> @${escapeHtml(xHandle)} → <a href="https://x.com/${escapeHtml(xHandle)}">https://x.com/${escapeHtml(xHandle)}</a>`,
        `🔗 <b>View on Clanker:</b> <a href="${clankerUrl}">${clankerUrl}</a>`,
        `⏰ <b>Time:</b> ${now}`,
    ].join('\n');

    await sendTelegramMessage(message, 'HTML');
    alertsSentCount++;

    // Persist to alert_history
    try {
        await saveAlertHistory({
            token_name: token.name,
            token_symbol: token.symbol,
            contract_address: token.contractAddress,
            deployer_x_handle: xHandle,
            platform: token.platform,
            clanker_url: clankerUrl,
            tx_hash: token.txHash,
        });
    } catch (err) {
        logger.error('Failed to save alert to history:', err);
    }
}
