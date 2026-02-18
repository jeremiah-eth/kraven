import dotenv from 'dotenv';
dotenv.config();

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

export const config = {
    telegramBotToken: requireEnv('TELEGRAM_BOT_TOKEN'),
    telegramChatId: requireEnv('TELEGRAM_CHAT_ID'),
    baseWssRpcUrl: requireEnv('BASE_WSS_RPC_URL'),
    baseHttpsRpcUrl: requireEnv('BASE_HTTPS_RPC_URL'),
    databaseUrl: requireEnv('DATABASE_URL'),
} as const;
