const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function addWallet() {
    const handle = 'jerrydotdev';
    const wallet = '0xb0d7daad4172255f1bbf8d780dc785a679522002'.toLowerCase();

    console.log(`--- Manually adding wallet for @${handle}: ${wallet} ---`);

    // Check if handle is in watched_accounts
    const { data: accounts } = await supabase
        .from('watched_accounts')
        .select('*')
        .eq('x_handle', handle);

    if (!accounts || accounts.length === 0) {
        console.log(`Adding @${handle} to watched_accounts...`);
        await supabase.from('watched_accounts').insert({ x_handle: handle });
    }

    const { data, error } = await supabase
        .from('watched_wallets')
        .upsert({
            x_handle: handle,
            wallet_address: wallet,
            source: 'manual_manual_fix'
        }, { onConflict: 'x_handle,wallet_address' });

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Success! Wallet mapping saved.');
    }
}

addWallet();
