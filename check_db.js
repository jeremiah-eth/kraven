const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkDb() {
    const handles = ['jerrydotdev', 'whistler_agent'];
    console.log(`--- Checking DB for: ${handles.join(', ')} ---`);

    const { data: wallets, error } = await supabase
        .from('watched_wallets')
        .select('*')
        .in('x_handle', handles);

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    console.log(`Found ${wallets.length} wallets.`);
    wallets.forEach(w => {
        console.log(`- ${w.x_handle}: ${w.wallet_address} (Source: ${w.source})`);
    });
}

checkDb();
