import axios from 'axios';
import { logger } from '../logger';

const BANKR_API_BASE = 'https://api.bankr.bot/launches';
const BANKR_API_FALLBACK = 'https://api.bankr.chat/launches';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export interface BankrSocial {
    tokenAddress: string;
    xHandle: string | null;
    isBankrLaunch: boolean;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Queries Bankr public API to find an X handle associated with a token.
 * This helps fill the gap when Doppler metadata is missing social context.
 */
export async function fetchBankrSocial(tokenAddress: string): Promise<BankrSocial> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            logger.info(`Checking Bankr API for social context ${tokenAddress} (attempt ${attempt}/${MAX_RETRIES})`);

            const response = await axios.get(BANKR_API_BASE, { timeout: 10000 });

            const launches = response.data;
            if (Array.isArray(launches)) {
                const match = launches.find((l: any) =>
                    l.token_address?.toLowerCase() === tokenAddress.toLowerCase() ||
                    l.address?.toLowerCase() === tokenAddress.toLowerCase()
                );

                if (match) {
                    let xHandle = match.x_handle || match.twitter_handle || match.deployer_handle || null;
                    if (xHandle) {
                        xHandle = xHandle.replace(/^@/, '').trim().toLowerCase();
                    }

                    logger.info(`Found Bankr match for ${tokenAddress}: @${xHandle}`);
                    return {
                        tokenAddress,
                        xHandle,
                        isBankrLaunch: true
                    };
                }
            }

            if (attempt === MAX_RETRIES) break;
            await sleep(RETRY_DELAY_MS);
        } catch (err) {
            logger.error(`Error checking Bankr API for ${tokenAddress} (attempt ${attempt}):`, err);
            if (attempt < MAX_RETRIES) {
                await sleep(RETRY_DELAY_MS);
            }
        }
    }

    return {
        tokenAddress,
        xHandle: null,
        isBankrLaunch: false
    };
}

/**
 * Scans Bankr's public launch history to find wallets linked to an X handle.
 */
export async function discoverWalletsFromBankr(xHandle: string): Promise<string[]> {
    try {
        const handle = xHandle.toLowerCase().replace(/^@/, '');
        logger.info(`Discovering Bankr wallets for @${handle}`);

        try {
            const response = await axios.get(BANKR_API_BASE, { timeout: 10000 });
            return await processLaunches(response.data, handle, xHandle);
        } catch (err: any) {
            logger.warn(`Primary Bankr API failed, trying fallback: ${err.message}`);
            try {
                const response = await axios.get(BANKR_API_FALLBACK, { timeout: 10000 });
                return await processLaunches(response.data, handle, xHandle);
            } catch (fallbackErr: any) {
                if (fallbackErr.response?.status === 403) {
                    logger.warn(`Bankr API returned 403 during discovery for @${xHandle}`);
                } else {
                    logger.error(`Error discovering Bankr wallets for ${xHandle}:`, fallbackErr);
                }
                return [];
            }
        }
    } catch (err: any) {
        logger.error(`Fatal error during Bankr discovery for ${xHandle}:`, err);
        return [];
    }
}

async function processLaunches(launches: any, handle: string, xHandle: string): Promise<string[]> {
    if (!Array.isArray(launches)) return [];

    const wallets = new Set<string>();
    for (const l of launches) {
        const lHandle = (l.x_handle || l.twitter_handle || l.deployer_handle || '').toLowerCase().replace(/^@/, '');
        if (lHandle === handle) {
            const deployer = l.deployer || l.creator || l.msg_sender || null;
            if (deployer && typeof deployer === 'string' && deployer.startsWith('0x')) {
                wallets.add(deployer.toLowerCase());
            }
        }
    }

    logger.info(`Found ${wallets.size} wallets for @${handle} on Bankr`);
    return Array.from(wallets);
}
