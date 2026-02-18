import { Pool } from 'pg';
import { config } from './config';
import { logger } from './logger';

export const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

export interface WatchedAccount {
    id: number;
    x_handle: string;
    added_at: Date;
}

export interface AlertHistoryEntry {
    id: number;
    token_name: string;
    token_symbol: string;
    contract_address: string;
    deployer_x_handle: string;
    platform: string;
    clanker_url: string;
    tx_hash: string;
    alerted_at: Date;
}

export async function initDatabase(): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query(`
      CREATE TABLE IF NOT EXISTS watched_accounts (
        id SERIAL PRIMARY KEY,
        x_handle TEXT UNIQUE NOT NULL,
        added_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

        await client.query(`
      CREATE TABLE IF NOT EXISTS alert_history (
        id SERIAL PRIMARY KEY,
        token_name TEXT,
        token_symbol TEXT,
        contract_address TEXT,
        deployer_x_handle TEXT,
        platform TEXT,
        clanker_url TEXT,
        tx_hash TEXT,
        alerted_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

        logger.info('Database tables initialized successfully.');
    } finally {
        client.release();
    }
}

export async function getWatchedAccounts(): Promise<WatchedAccount[]> {
    const result = await pool.query<WatchedAccount>(
        'SELECT * FROM watched_accounts ORDER BY added_at ASC'
    );
    return result.rows;
}

export async function addWatchedAccount(xHandle: string): Promise<boolean> {
    try {
        await pool.query(
            'INSERT INTO watched_accounts (x_handle) VALUES ($1)',
            [xHandle.toLowerCase()]
        );
        return true;
    } catch (err: unknown) {
        // Unique violation = already exists
        if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === '23505') {
            return false;
        }
        throw err;
    }
}

export async function removeWatchedAccount(xHandle: string): Promise<boolean> {
    const result = await pool.query(
        'DELETE FROM watched_accounts WHERE x_handle = $1',
        [xHandle.toLowerCase()]
    );
    return (result.rowCount ?? 0) > 0;
}

export async function isHandleWatched(xHandle: string): Promise<boolean> {
    const result = await pool.query(
        'SELECT 1 FROM watched_accounts WHERE x_handle = $1',
        [xHandle.toLowerCase()]
    );
    return (result.rowCount ?? 0) > 0;
}

export async function saveAlertHistory(entry: Omit<AlertHistoryEntry, 'id' | 'alerted_at'>): Promise<void> {
    await pool.query(
        `INSERT INTO alert_history
      (token_name, token_symbol, contract_address, deployer_x_handle, platform, clanker_url, tx_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
            entry.token_name,
            entry.token_symbol,
            entry.contract_address,
            entry.deployer_x_handle,
            entry.platform,
            entry.clanker_url,
            entry.tx_hash,
        ]
    );
}

export async function getRecentAlerts(limit = 5): Promise<AlertHistoryEntry[]> {
    const result = await pool.query<AlertHistoryEntry>(
        'SELECT * FROM alert_history ORDER BY alerted_at DESC LIMIT $1',
        [limit]
    );
    return result.rows;
}

export async function getWatchedCount(): Promise<number> {
    const result = await pool.query('SELECT COUNT(*) FROM watched_accounts');
    return parseInt(result.rows[0].count, 10);
}
