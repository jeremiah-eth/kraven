import { createPublicClient, webSocket, parseAbiItem } from 'viem';
import { base } from 'viem/chains';
import { config } from '../config';
import { logger } from '../logger';
import {
    CLANKER_FACTORY_ADDRESSES,
    DOPPLER_AIRLOCK_ADDRESS,
    CLANKER_TOKEN_CREATED_ABI,
    DOPPLER_TOKEN_CREATED_ABI
} from './contracts';
import { fetchClankerToken } from '../api/clanker';
import { fetchDopplerToken } from '../api/doppler';
import { fetchBankrSocial } from '../api/bankr';
import { isHandleWatched, getHandleByWallet, saveWalletMapping } from '../db';
import { sendTokenAlert, sendTelegramMessage } from '../telegram/alerts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PublicClient = any;

let clankerWsConnected = false;
let dopplerWsConnected = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let client: PublicClient = null;
let unwatchFns: Array<() => void> = [];

export function isClankerWsConnected(): boolean {
    return clankerWsConnected;
}

export function isDopplerWsConnected(): boolean {
    return dopplerWsConnected;
}

/**
 * Creates a viem public client with WebSocket transport on Base mainnet.
 */
function createWsClient(): PublicClient {
    return createPublicClient({
        chain: base,
        transport: webSocket(config.baseWssRpcUrl, {
            reconnect: false, // We handle reconnection manually
            timeout: 30_000,
        }),
    });
}

/**
 * Handles a raw event log from any Clanker factory contract.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleClankerTokenCreatedLog(log: any): Promise<void> {
    try {
        const rawAddress: string | undefined = log.topics?.[1];
        if (!rawAddress) return;

        const contractAddress = ('0x' + rawAddress.slice(-40)) as `0x${string}`;
        const deployerAddress = ('0x' + log.topics?.[2]?.slice(-40))?.toLowerCase();

        logger.info(`New Clanker Token! ${contractAddress}, tx: ${log.transactionHash}`);

        // PATH A: Instant Match (via Wallet)
        if (deployerAddress) {
            const cachedHandle = await getHandleByWallet(deployerAddress);
            if (cachedHandle) {
                logger.info(`🚨 INSTANT CLANKER MATCH! Wallet ${deployerAddress} (@${cachedHandle})`);

                // Fetch basic metadata for the alert (name/symbol only, skip retries since we alert instantly)
                const token = await fetchClankerToken(contractAddress);
                await sendTokenAlert({
                    name: token?.name || 'Unknown',
                    symbol: token?.symbol || 'UNKNOWN',
                    contractAddress: contractAddress,
                    xHandle: cachedHandle,
                    platform: token?.platform || 'via Clanker',
                    txHash: log.transactionHash,
                });
                return;
            }
        }

        // PATH B: Fallback (Wait for Indexer)
        // Set higher retry count to handle indexing lag
        const token = await fetchClankerToken(contractAddress);
        if (!token) {
            logger.warn(`Could not fetch Clanker metadata for ${contractAddress} after retries.`);
            return;
        }

        if (!token.xHandle) return;

        const isWatched = await isHandleWatched(token.xHandle);
        if (!isWatched) return;

        logger.info(`🚨 CLANKER MATCH (Indexer)! @${token.xHandle} deployed ${token.name}`);

        // LEARN: Store this mapping for future instant alerts
        if (deployerAddress) {
            await saveWalletMapping(token.xHandle, deployerAddress, 'Learned (Clanker)');
        }

        await sendTokenAlert({
            name: token.name,
            symbol: token.symbol,
            contractAddress: token.contractAddress,
            xHandle: token.xHandle,
            platform: token.platform,
            txHash: token.txHash,
        });
    } catch (err) {
        logger.error('Error handling Clanker log:', err);
    }
}

/**
 * Handles a raw event log from the Doppler Airlock contract.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleDopplerTokenCreatedLog(log: any): Promise<void> {
    try {
        // topics[1] is tokenAddress, topics[2] is creator
        const rawAddress: string | undefined = log.topics?.[1];
        const rawCreator: string | undefined = log.topics?.[2];
        if (!rawAddress) return;

        const contractAddress = ('0x' + rawAddress.slice(-40)) as `0x${string}`;
        const deployerAddress = rawCreator ? ('0x' + rawCreator.slice(-40)).toLowerCase() : null;

        logger.info(`New Doppler Token! ${contractAddress}, tx: ${log.transactionHash}`);

        // PATH A: Instant Match (via Wallet)
        if (deployerAddress) {
            const cachedHandle = await getHandleByWallet(deployerAddress);
            if (cachedHandle) {
                logger.info(`🚨 INSTANT DOPPLER MATCH! Wallet ${deployerAddress} (@${cachedHandle})`);

                const dopplerToken = await fetchDopplerToken(contractAddress);
                await sendTokenAlert({
                    name: dopplerToken?.name || 'Unknown',
                    symbol: dopplerToken?.symbol || 'UNKNOWN',
                    contractAddress: contractAddress,
                    xHandle: cachedHandle,
                    platform: 'Doppler',
                    txHash: log.transactionHash,
                    clankerUrl: `https://app.doppler.lol/token/${contractAddress}`,
                });
                return;
            }
        }

        // PATH B: Fallback (Wait for Indexer)
        const dopplerToken = await fetchDopplerToken(contractAddress);

        let xHandle = dopplerToken?.xHandle || null;
        let platform = 'Doppler';

        // 2. Supplement with Bankr social context
        const bankrSocial = await fetchBankrSocial(contractAddress);
        if (bankrSocial.xHandle) {
            xHandle = bankrSocial.xHandle;
            platform = 'Bankr via Doppler';
        } else if (dopplerToken?.xHandle) {
            platform = 'Doppler';
        }

        if (!xHandle) {
            logger.info(`Doppler token ${contractAddress} has no social context after retries — skipping.`);
            return;
        }

        const isWatched = await isHandleWatched(xHandle);
        if (!isWatched) return;

        logger.info(`🚨 DOPPLER MATCH (Indexer)! @${xHandle} deployed ${dopplerToken?.name || 'Unknown'}`);

        // LEARN: Store this mapping
        if (deployerAddress) {
            await saveWalletMapping(xHandle, deployerAddress, 'Learned (Doppler)');
        }

        // Format for alert
        await sendTokenAlert({
            name: dopplerToken?.name || 'Unknown',
            symbol: dopplerToken?.symbol || 'UNKNOWN',
            contractAddress: contractAddress,
            xHandle: xHandle,
            platform: platform,
            clankerUrl: `https://app.doppler.lol/token/${contractAddress}`,
            txHash: log.transactionHash,
        });

    } catch (err) {
        logger.error('Error handling Doppler log:', err);
    }
}

/**
 * Starts watching both Clanker and Doppler contracts.
 */
function startWatching(): void {
    if (!client) return;

    unwatchFns = [];

    // Clanker Watchers
    for (const factoryAddress of CLANKER_FACTORY_ADDRESSES) {
        try {
            const unwatch = client.watchEvent({
                address: factoryAddress as `0x${string}`,
                event: parseAbiItem(CLANKER_TOKEN_CREATED_ABI),
                onLogs: async (logs: unknown[]) => {
                    for (const log of logs) {
                        await handleClankerTokenCreatedLog(log);
                    }
                },
                onError: () => { clankerWsConnected = false; },
            });
            unwatchFns.push(unwatch);
            logger.info(`Watching Clanker factory: ${factoryAddress}`);
        } catch (err) {
            logger.error(`Failed to watch Clanker factory ${factoryAddress}:`, err);
        }
    }
    clankerWsConnected = true;

    // Doppler Watcher
    try {
        const unwatch = client.watchEvent({
            address: DOPPLER_AIRLOCK_ADDRESS,
            event: parseAbiItem(DOPPLER_TOKEN_CREATED_ABI),
            onLogs: async (logs: unknown[]) => {
                for (const log of logs) {
                    await handleDopplerTokenCreatedLog(log);
                }
            },
            onError: () => { dopplerWsConnected = false; },
        });
        unwatchFns.push(unwatch);
        dopplerWsConnected = true;
        logger.info(`Watching Doppler Airlock: ${DOPPLER_AIRLOCK_ADDRESS}`);
    } catch (err) {
        logger.error(`Failed to watch Doppler Airlock:`, err);
        dopplerWsConnected = false;
    }
}

function stopWatching(): void {
    for (const unwatch of unwatchFns) {
        try { unwatch(); } catch { /* ignore */ }
    }
    unwatchFns = [];
}

async function scheduleReconnect(): Promise<void> {
    if (reconnectTimer) return;

    reconnectTimer = setTimeout(async () => {
        reconnectTimer = null;
        logger.info('Attempting to reconnect WebSocket...');

        try {
            stopWatching();
            client = createWsClient();
            startWatching();
            logger.info('✅ WebSocket reconnected.');
            await sendTelegramMessage('✅ Reconnected to Base mainnet.');
        } catch (err) {
            logger.error('Reconnect failed:', err);
            clankerWsConnected = false;
            dopplerWsConnected = false;
            await scheduleReconnect();
        }
    }, 5000);
}

export async function startChainListener(): Promise<void> {
    logger.info('Starting on-chain listeners for Base mainnet...');

    try {
        client = createWsClient();
        const blockNumber: bigint = await client.getBlockNumber();
        logger.info(`Connected. Latest block: ${blockNumber}`);

        startWatching();

        setInterval(async () => {
            try {
                await client.getBlockNumber();
                // If we reach here, connection is active
            } catch {
                clankerWsConnected = false;
                dopplerWsConnected = false;
                logger.warn('Lost WebSocket connection.');
                await scheduleReconnect();
            }
        }, 30_000);

    } catch (err) {
        logger.error('Failed to start listeners:', err);
        clankerWsConnected = false;
        dopplerWsConnected = false;
        await scheduleReconnect();
    }
}
