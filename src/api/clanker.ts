import axios from 'axios';
import { logger } from '../logger';

const CLANKER_API_BASE = 'https://www.clanker.world/api/tokens/get-clanker-by-address';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export interface ClankerToken {
    name: string;
    symbol: string;
    contractAddress: string;
    xHandle: string | null;
    platform: 'via Bankr' | 'via Clanker';
    txHash: string;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Recursively searches an object for any field that looks like an X/Twitter handle.
 * Returns the handle (without @) or null.
 */
function extractXHandle(obj: unknown): string | null {
    if (!obj || typeof obj !== 'object') return null;

    const record = obj as Record<string, unknown>;

    // Priority fields to check first
    const priorityFields = [
        'x_handle', 'xHandle', 'twitter_handle', 'twitterHandle',
        'requestor_handle', 'requestorHandle', 'username', 'handle',
    ];

    for (const field of priorityFields) {
        if (typeof record[field] === 'string' && record[field]) {
            const val = (record[field] as string).replace(/^@/, '').trim();
            if (val.length > 0) return val.toLowerCase();
        }
    }

    // Check social_context, requestor, context objects
    const contextFields = ['social_context', 'requestor', 'context', 'metadata', 'creator'];
    for (const field of contextFields) {
        if (record[field] && typeof record[field] === 'object') {
            const nested = extractXHandle(record[field]);
            if (nested) return nested;
        }
    }

    // Look for any string field containing a twitter.com or x.com URL
    for (const [, value] of Object.entries(record)) {
        if (typeof value === 'string') {
            const urlMatch = value.match(/(?:twitter\.com|x\.com)\/([A-Za-z0-9_]{1,50})/i);
            if (urlMatch && urlMatch[1] && urlMatch[1].toLowerCase() !== 'i') {
                return urlMatch[1].toLowerCase();
            }
        }
    }

    return null;
}

/**
 * Determines the platform (Bankr or Clanker) from the API response.
 */
function extractPlatform(data: Record<string, unknown>): 'via Bankr' | 'via Clanker' {
    const fieldsToCheck = ['interface', 'platform', 'source', 'type', 'cast_hash'];
    for (const field of fieldsToCheck) {
        const val = data[field];
        if (typeof val === 'string' && val.toLowerCase().includes('bankr')) {
            return 'via Bankr';
        }
    }

    // Also check nested social_context
    const socialContext = data['social_context'];
    if (socialContext && typeof socialContext === 'object') {
        const sc = socialContext as Record<string, unknown>;
        for (const [, val] of Object.entries(sc)) {
            if (typeof val === 'string' && val.toLowerCase().includes('bankr')) {
                return 'via Bankr';
            }
        }
    }

    return 'via Clanker';
}

/**
 * Fetches Clanker token metadata for a given contract address.
 * Retries up to MAX_RETRIES times with RETRY_DELAY_MS between attempts.
 * Returns null if the token cannot be fetched after all retries.
 */
export async function fetchClankerToken(contractAddress: string): Promise<ClankerToken | null> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            logger.info(`Fetching Clanker metadata for ${contractAddress} (attempt ${attempt}/${MAX_RETRIES})`);

            const response = await axios.get(CLANKER_API_BASE, {
                params: { address: contractAddress },
                timeout: 10000,
            });

            const data = response.data;

            if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
                logger.warn(`Empty response for ${contractAddress}, attempt ${attempt}`);
                if (attempt < MAX_RETRIES) {
                    await sleep(RETRY_DELAY_MS);
                    continue;
                }
                return null;
            }

            // Handle both direct object and wrapped { token: {...} } responses
            const tokenData: Record<string, unknown> = (data.token ?? data) as Record<string, unknown>;

            const name = (tokenData['name'] as string) ?? 'Unknown';
            const symbol = (tokenData['symbol'] as string) ?? 'UNKNOWN';
            const txHash = (tokenData['tx_hash'] as string) ?? (tokenData['txHash'] as string) ?? '';

            const xHandle = extractXHandle(tokenData);
            const platform = extractPlatform(tokenData);

            logger.info(`Fetched token: ${name} ($${symbol}), deployer X: ${xHandle ?? 'none'}, platform: ${platform}`);

            return {
                name,
                symbol,
                contractAddress,
                xHandle,
                platform,
                txHash,
            };
        } catch (err) {
            logger.error(`Error fetching Clanker metadata for ${contractAddress} (attempt ${attempt}):`, err);
            if (attempt < MAX_RETRIES) {
                await sleep(RETRY_DELAY_MS);
            }
        }
    }

    return null;
}
/**
 * Searches Clanker history for a given X handle to find associated wallet addresses.
 */
export async function discoverWalletsFromClanker(xHandle: string): Promise<string[]> {
    try {
        logger.info(`Discovering Clanker wallets for @${xHandle}`);

        // Search by handle keyword
        const response = await axios.get('https://www.clanker.world/api/tokens', {
            params: { search: xHandle },
            timeout: 10000,
        });

        const data = response.data?.data || response.data || [];
        if (!Array.isArray(data)) return [];

        const wallets = new Set<string>();
        for (const token of data) {
            const sender = token.msg_sender || token.creator || token.admin || null;
            if (sender && typeof sender === 'string' && sender.startsWith('0x')) {
                wallets.add(sender.toLowerCase());
            }
        }

        logger.info(`Found ${wallets.size} wallets for @${xHandle} on Clanker`);
        return Array.from(wallets);
    } catch (err) {
        logger.error(`Error discovering Clanker wallets for ${xHandle}:`, err);
        return [];
    }
}
