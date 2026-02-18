import 'dotenv/config';
import { config } from './config';
import { logger } from './logger';
import { initDatabase, pool } from './db';
import { initBot, sendTelegramMessage } from './telegram/alerts';
import { registerCommands } from './telegram/commands';
import { startChainListener } from './chain/listener';

async function main(): Promise<void> {
    logger.info('🚀 KRAVEN is starting up...');

    // 1. Validate config (throws if any env var is missing)
    logger.info('Config loaded. Validating environment variables...');
    // config is imported — if any var is missing, it throws at import time.
    // We log the chat ID (non-sensitive) for confirmation.
    logger.info(`Telegram chat ID: ${config.telegramChatId}`);

    // 2. Initialize Telegram bot first so we can send error messages
    logger.info('Initializing Telegram bot...');
    initBot();
    registerCommands();

    // 3. Connect to database and initialize schema
    logger.info('Connecting to Supabase database...');
    try {
        await initDatabase();
    } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        logger.error('FATAL: Database connection failed:', err);
        await sendTelegramMessage(
            `🔴 <b>KRAVEN startup failed</b>\n\nDatabase connection error:\n<code>${errMsg}</code>\n\nPlease check DATABASE_URL and restart.`,
            'HTML'
        );
        process.exit(1);
    }

    // 4. Start the on-chain WebSocket listener
    logger.info('Starting on-chain listener...');
    await startChainListener();

    // 5. Send startup confirmation
    const startupMsg = [
        `✅ <b>KRAVEN is online</b>`,
        ``,
        `Monitoring <b>6</b> Clanker factory contracts on Base mainnet.`,
        `Send /help to see available commands.`,
    ].join('\n');

    await sendTelegramMessage(startupMsg, 'HTML');
    logger.info('✅ KRAVEN is fully operational.');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    await pool.end();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    await pool.end();
    process.exit(0);
});

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (err: Error) => {
    logger.error('Uncaught exception:', err);
    process.exit(1);
});

main().catch((err) => {
    logger.error('Fatal error in main():', err);
    process.exit(1);
});
