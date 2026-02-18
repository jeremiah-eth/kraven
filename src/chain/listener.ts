import { createPublicClient, webSocket, parseAbiItem } from 'viem';
import { base } from 'viem/chains';
import { config } from '../config';
import { logger } from '../logger';
import { CLANKER_FACTORY_ADDRESSES } from './contracts';
import { fetchClankerToken } from '../api/clanker';
import { isHandleWatched } from '../db';
import { sendTokenAlert, sendTelegramMessage } from '../telegram/alerts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PublicClient = any;

let wsConnected = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let client: PublicClient = null;
let unwatchFns: Array<() => void> = [];

export function isWsConnected(): boolean {
    return wsConnected;
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
 * Extracts the token address from the first indexed topic (topics[1]).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleTokenCreatedLog(log: any): Promise<void> {
    try {
        // The token address is the first indexed parameter (topics[1])
        const rawAddress: string | undefined = log.topics?.[1];
        if (!rawAddress) {
            logger.warn('TokenCreated log missing token address topic:', log);
            return;
        }

        // Convert from 32-byte padded topic to address (last 20 bytes)
        const contractAddress = ('0x' + rawAddress.slice(-40)) as `0x${string}`;
        logger.info(`New TokenCreated event! Token: ${contractAddress}, tx: ${log.transactionHash}`);

        // Fetch metadata from Clanker API
        const token = await fetchClankerToken(contractAddress);

        if (!token) {
            logger.warn(`Could not fetch metadata for ${contractAddress} after retries.`);
            await sendTelegramMessage(
                `⚠️ Could not fetch metadata for a new deployment at <code>${contractAddress}</code>. Check manually.`,
                'HTML'
            );
            return;
        }

        // If no X handle, skip silently
        if (!token.xHandle) {
            logger.info(`Token ${contractAddress} has no X handle — skipping.`);
            return;
        }

        // Check if the deployer is on the watchlist
        const isWatched = await isHandleWatched(token.xHandle);
        if (!isWatched) {
            logger.info(`Deployer @${token.xHandle} is not on watchlist — skipping.`);
            return;
        }

        logger.info(`🚨 MATCH! @${token.xHandle} deployed ${token.name} ($${token.symbol}) — sending alert!`);
        await sendTokenAlert(token);
    } catch (err) {
        logger.error('Error handling TokenCreated log:', err);
    }
}

/**
 * Starts watching all Clanker factory contracts for TokenCreated events.
 */
function startWatching(): void {
    if (!client) return;

    unwatchFns = [];

    for (const factoryAddress of CLANKER_FACTORY_ADDRESSES) {
        try {
            const unwatch = client.watchEvent({
                address: factoryAddress as `0x${string}`,
                event: parseAbiItem('event TokenCreated(address indexed tokenAddress, uint256 positionId, address indexed deployer, uint256 fid, string name, string symbol, uint256 supply, uint256 lockedLiquidityPercentage, string castHash)'),
                onLogs: async (logs: unknown[]) => {
                    for (const log of logs) {
                        await handleTokenCreatedLog(log);
                    }
                },
                onError: (error: unknown) => {
                    logger.error(`watchEvent error on ${factoryAddress}:`, error);
                },
            });
            unwatchFns.push(unwatch);
            logger.info(`Watching factory: ${factoryAddress}`);
        } catch (err) {
            logger.error(`Failed to watch factory ${factoryAddress}:`, err);
        }
    }
}

/**
 * Stops all active watchers.
 */
function stopWatching(): void {
    for (const unwatch of unwatchFns) {
        try { unwatch(); } catch { /* ignore */ }
    }
    unwatchFns = [];
}

/**
 * Attempts to reconnect the WebSocket client every 5 seconds until successful.
 */
async function scheduleReconnect(): Promise<void> {
    if (reconnectTimer) return; // Already scheduled

    reconnectTimer = setTimeout(async () => {
        reconnectTimer = null;
        logger.info('Attempting to reconnect WebSocket to Base mainnet...');

        try {
            stopWatching();
            client = createWsClient();
            startWatching();
            wsConnected = true;
            logger.info('✅ Reconnected to Base mainnet WebSocket.');
            await sendTelegramMessage('✅ Reconnected to Base mainnet.');
        } catch (err) {
            logger.error('Reconnect failed:', err);
            wsConnected = false;
            await scheduleReconnect();
        }
    }, 5000);
}

/**
 * Initialises the on-chain listener. Connects via WebSocket and starts
 * watching all Clanker factory contracts for TokenCreated events.
 */
export async function startChainListener(): Promise<void> {
    logger.info('Starting on-chain listener for Base mainnet...');

    try {
        client = createWsClient();

        // Test connectivity by fetching the latest block number
        const blockNumber: bigint = await client.getBlockNumber();
        logger.info(`Connected to Base mainnet. Latest block: ${blockNumber}`);
        wsConnected = true;

        startWatching();

        // Heartbeat: poll block number every 30s to detect silent WebSocket drops
        setInterval(async () => {
            if (!wsConnected) return;
            try {
                await client.getBlockNumber();
            } catch {
                if (wsConnected) {
                    wsConnected = false;
                    logger.warn('Lost connection to Base mainnet WebSocket.');
                    await sendTelegramMessage('⚠️ Lost connection to Base mainnet. Attempting to reconnect...');
                    await scheduleReconnect();
                }
            }
        }, 30_000);

    } catch (err) {
        logger.error('Failed to connect to Base mainnet:', err);
        wsConnected = false;
        await sendTelegramMessage('⚠️ Lost connection to Base mainnet. Attempting to reconnect...');
        await scheduleReconnect();
    }
}
