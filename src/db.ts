import { createClient } from '@supabase/supabase-js';
import { config } from './config';
import { logger } from './logger';

export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

export interface WatchedAccount {
    id: number;
    x_handle: string;
    added_at: string;
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
    alerted_at: string;
}

export interface WatchedWallet {
    id: number;
    x_handle: string;
    wallet_address: string;
    source: string | null;
    discovered_at: string;
}

export async function getWatchedAccounts(): Promise<WatchedAccount[]> {
    const { data, error } = await supabase
        .from('watched_accounts')
        .select('*')
        .order('added_at', { ascending: true });

    if (error) {
        logger.error('Error fetching watched accounts:', error);
        throw error;
    }

    return (data || []) as WatchedAccount[];
}

export async function addWatchedAccount(xHandle: string): Promise<boolean> {
    const handle = xHandle.toLowerCase();

    // Check if exists first to return false cleanly
    const { data } = await supabase
        .from('watched_accounts')
        .select('id')
        .eq('x_handle', handle)
        .maybeSingle();

    if (data) return false;

    const { error } = await supabase
        .from('watched_accounts')
        .insert([{ x_handle: handle }]);

    if (error) {
        logger.error('Error adding watched account:', error);
        throw error;
    }

    return true;
}

export async function removeWatchedAccount(xHandle: string): Promise<boolean> {
    const { error, count } = await supabase
        .from('watched_accounts')
        .delete({ count: 'exact' })
        .eq('x_handle', xHandle.toLowerCase());

    if (error) {
        logger.error('Error removing watched account:', error);
        throw error;
    }

    return (count || 0) > 0;
}

export async function isHandleWatched(xHandle: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('watched_accounts')
        .select('id')
        .eq('x_handle', xHandle.toLowerCase())
        .maybeSingle();

    if (error) {
        logger.error('Error checking if handle is watched:', error);
        throw error;
    }

    return !!data;
}

export async function saveAlertHistory(entry: Omit<AlertHistoryEntry, 'id' | 'alerted_at'>): Promise<void> {
    const { error } = await supabase
        .from('alert_history')
        .insert([entry]);

    if (error) {
        logger.error('Error saving alert history:', error);
        throw error;
    }
}

export async function getRecentAlerts(limit = 5): Promise<AlertHistoryEntry[]> {
    const { data, error } = await supabase
        .from('alert_history')
        .select('*')
        .order('alerted_at', { ascending: false })
        .limit(limit);

    if (error) {
        logger.error('Error fetching recent alerts:', error);
        throw error;
    }

    return (data || []) as AlertHistoryEntry[];
}

export async function getWatchedCount(): Promise<number> {
    const { count, error } = await supabase
        .from('watched_accounts')
        .select('*', { count: 'exact', head: true });

    if (error) {
        logger.error('Error getting watched count:', error);
        throw error;
    }

    return count || 0;
}

export async function saveWalletMapping(xHandle: string, walletAddress: string, source: string): Promise<boolean> {
    const handle = xHandle.toLowerCase();
    const address = walletAddress.toLowerCase();

    const { error } = await supabase
        .from('watched_wallets')
        .upsert(
            [{ x_handle: handle, wallet_address: address, source }],
            { onConflict: 'x_handle, wallet_address' }
        );

    if (error) {
        logger.error(`Error saving wallet mapping ${handle} -> ${address}:`, error);
        return false;
    }

    return true;
}

export async function getHandleByWallet(walletAddress: string): Promise<string | null> {
    const { data, error } = await supabase
        .from('watched_wallets')
        .select('x_handle')
        .eq('wallet_address', walletAddress.toLowerCase())
        .maybeSingle();

    if (error) {
        logger.error(`Error finding handle for wallet ${walletAddress}:`, error);
        return null;
    }

    return data?.x_handle || null;
}

export async function getWalletsForHandle(xHandle: string): Promise<string[]> {
    const { data, error } = await supabase
        .from('watched_wallets')
        .select('wallet_address')
        .eq('x_handle', xHandle.toLowerCase());

    if (error) {
        logger.error(`Error getting wallets for handle ${xHandle}:`, error);
        return [];
    }

    return (data || []).map((row: any) => row.wallet_address);
}

// ============================================================
// Access Control
// ============================================================

export async function isUserAuthorized(chatId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('authorized_users')
        .select('chat_id')
        .eq('chat_id', chatId)
        .maybeSingle();

    if (error) {
        logger.error(`Error checking if user ${chatId} is authorized:`, error);
        return false;
    }

    if (data) {
        // Update last active in the background
        supabase
            .from('authorized_users')
            .update({ last_active_at: new Date().toISOString() })
            .eq('chat_id', chatId)
            .then(({ error: updateErr }) => {
                if (updateErr) logger.error(`Failed to update last_active_at for ${chatId}`, updateErr);
            });
    }

    return !!data;
}

export async function validateAndUseAccessCode(code: string, chatId: string): Promise<{ success: boolean; message: string }> {
    // 1. Check if the code exists and is unused
    const { data: codeData, error: findError } = await supabase
        .from('access_codes')
        .select('*')
        .eq('code', code)
        .maybeSingle();

    if (findError) {
        logger.error(`Error finding access code ${code}:`, findError);
        return { success: false, message: 'Database error while checking code.' };
    }

    if (!codeData) {
        return { success: false, message: 'Invalid access code.' };
    }

    if (codeData.is_used) {
        return { success: false, message: 'This access code has already been used.' };
    }

    // 2. Mark the code as used in a transaction-like manner
    const { error: updateError } = await supabase
        .from('access_codes')
        .update({
            is_used: true,
            used_by: chatId,
            used_at: new Date().toISOString()
        })
        .eq('code', code)
        .eq('is_used', false); // Ensure it hasn't been sniped since our select

    if (updateError) {
        logger.error(`Error using access code ${code}:`, updateError);
        return { success: false, message: 'Code was already used or database error occurred.' };
    }

    // 3. Add to authorized users
    const { error: authError } = await supabase
        .from('authorized_users')
        .upsert([{ chat_id: chatId }]);

    if (authError) {
        logger.error(`Error authorizing user ${chatId}:`, authError);
        // Best effort: we consumed the code but failed to add them. They'll need a new code if this stays broken.
        return { success: false, message: 'Failed to authorize user in the database.' };
    }

    return { success: true, message: 'Successfully authorized.' };
}

export async function getAllAuthorizedChats(): Promise<string[]> {
    const { data, error } = await supabase
        .from('authorized_users')
        .select('chat_id');

    if (error) {
        logger.error('Error fetching authorized users:', error);
        return [];
    }

    return (data || []).map((row: any) => row.chat_id);
}
