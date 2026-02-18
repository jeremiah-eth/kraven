import axios from 'axios';
import { logger } from '../logger';

const DOPPLER_INDEXER_BASE = 'https://api.doppler.lol/search';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export interface DopplerToken {
    name: string;
    symbol: string;
    contractAddress: string;
    description: string | null;
    creator: string | null;
    xHandle: string | null;
    image: string | null;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches Doppler token metadata for a given contract address.
 */
export async function fetchDopplerToken(contractAddress: string): Promise<DopplerToken | null> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            logger.info(`Fetching Doppler metadata for ${contractAddress} (attempt ${attempt}/${MAX_RETRIES})`);

            const response = await axios.get(`${DOPPLER_INDEXER_BASE}/${contractAddress}`, {
                params: { chain_ids: '8453' },
                timeout: 10000,
            });

            const data = response.data;

            if (!data || !Array.isArray(data) || data.length === 0) {
                logger.warn(`No result found for Doppler token ${contractAddress}, attempt ${attempt}`);
                if (attempt < MAX_RETRIES) {
                    await sleep(RETRY_DELAY_MS);
                    continue;
                }
                return null;
            }

            // Find the token in the results (usually the first one since we queried by address)
            const tokenData = data[0];

            const name = tokenData.name || 'Unknown';
            const symbol = tokenData.symbol || 'UNKNOWN';
            const creator = tokenData.creator || null;
            const description = tokenData.description || null;
            const image = tokenData.image || null;

            // Doppler metadata often includes social links
            let xHandle: string | null = null;
            if (tokenData.metadata && typeof tokenData.metadata === 'object') {
                const metadata = tokenData.metadata;
                // Check if 'x' or 'twitter' is in social links
                xHandle = metadata.x || metadata.twitter || null;
                if (xHandle && xHandle.includes('x.com/')) {
                    xHandle = xHandle.split('x.com/').pop()?.split('?')[0] || xHandle;
                } else if (xHandle && xHandle.includes('twitter.com/')) {
                    xHandle = xHandle.split('twitter.com/').pop()?.split('?')[0] || xHandle;
                }

                if (xHandle) {
                    xHandle = xHandle.replace(/^@/, '').trim().toLowerCase();
                }
            }

            logger.info(`Fetched Doppler token: ${name} ($${symbol}), creator: ${creator}, X: ${xHandle ?? 'none'}`);

            return {
                name,
                symbol,
                contractAddress,
                description,
                creator,
                xHandle,
                image,
            };
        } catch (err) {
            logger.error(`Error fetching Doppler metadata for ${contractAddress} (attempt ${attempt}):`, err);
            if (attempt < MAX_RETRIES) {
                await sleep(RETRY_DELAY_MS);
            }
        }
    }

    return null;
}

/**
 * Searches Doppler indexer for a given X handle to find associated creator addresses.
 */
export async function discoverWalletsFromDoppler(xHandle: string): Promise<string[]> {
    try {
        const handle = xHandle.replace(/^@/, '').toLowerCase();
        logger.info(`Discovering Doppler wallets for @${handle}`);

        const response = await axios.get(`${DOPPLER_INDEXER_BASE}/${handle}`, {
            params: { chain_ids: '8453' },
            timeout: 10000,
        });

        const data = response.data;
        if (!Array.isArray(data)) return [];

        const wallets = new Set<string>();
        const targetHandle = xHandle.replace(/^@/, '').toLowerCase();

        for (const token of data) {
            // STRICT VERIFICATION: Verify the handle in Doppler metadata
            let tokenHandle: string | null = null;
            if (token.metadata && typeof token.metadata === 'object') {
                const metadata = token.metadata;
                const x = metadata.x || metadata.twitter || null;
                if (x && typeof x === 'string') {
                    tokenHandle = x.split('/').pop()?.split('?')[0]?.replace(/^@/, '').toLowerCase() || null;
                }
            }

            if (tokenHandle !== targetHandle) {
                continue;
            }

            const creator = token.creator || null;
            if (creator && typeof creator === 'string' && creator.startsWith('0x')) {
                wallets.add(creator.toLowerCase());
            }
        }

        logger.info(`Found ${wallets.size} verified wallets for @${handle} on Doppler`);
        return Array.from(wallets);
    } catch (err) {
        logger.error(`Error discovering Doppler wallets for ${xHandle}:`, err);
        return [];
    }
}
