const axios = require('axios');
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function search(handle) {
    console.log(`--- Searching Clanker for: ${handle} ---`);
    try {
        const url = `https://www.clanker.world/api/tokens?search=${handle}`;
        const res = await axios.get(url, { headers: { 'User-Agent': USER_AGENT } });
        const tokens = res.data?.data || [];
        console.log(`Found ${tokens.length} tokens.`);
        tokens.forEach((t, i) => {
            console.log(`\n[Token ${i + 1}] ${t.name} (${t.symbol})`);
            console.log(`  msg_sender: ${t.msg_sender}`);
            console.log(`  requestor_handle: ${t.requestor_handle}`);
            console.log(`  social_context: ${JSON.stringify(t.social_context)}`);
            if (t.msg_sender.toLowerCase() === '0xb0d7daad4172255f1bbf8d780dc785a679522002') {
                console.log(`  *** DIRECT MATCH with target wallet! ***`);
            }
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

search('jerrydotdev');
