const { createClient } = require('@supabase/supabase-js');
// Load config manually since we can't easily import from .ts in a plain node script without ts-node
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
    console.log('--- Checking Database ---');
    const { data: accounts, error: err1 } = await supabase
        .from('watched_accounts')
        .select('*')
        .order('added_at', { ascending: false })
        .limit(5);

    if (err1) {
        console.error('Error fetching accounts:', err1);
    } else {
        console.log('Recent Watched Accounts:', JSON.stringify(accounts, null, 2));
    }

    const { data: wallets, error: err2 } = await supabase
        .from('watched_wallets')
        .select('*')
        .order('discovered_at', { ascending: false })
        .limit(10);

    if (err2) {
        console.error('Error fetching wallets:', err2);
    } else {
        console.log('Recent Discovered Wallets:', JSON.stringify(wallets, null, 2));
    }
}

checkDb();
