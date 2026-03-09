const axios = require('axios');
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function crossCheck() {
    const handle = 'jerrydotdev';
    const targetWallet = '0xb0d7daad4172255f1bbf8d780dc785a679522002'.toLowerCase();

    console.log(`--- Searching Clanker for: ${handle} ---`);
    try {
        const url = `https://www.clanker.world/api/tokens?search=${handle}`;
        const res = await axios.get(url, { headers: { 'User-Agent': USER_AGENT } });
        const tokens = res.data?.data || [];
        console.log(`Found ${tokens.length} tokens for "${handle}".`);

        const matches = tokens.filter(t => t.msg_sender.toLowerCase() === targetWallet);
        if (matches.length > 0) {
            console.log(`\n!!! FOUND MATCHING TOKENS FOR WALLET ${targetWallet} !!!`);
            matches.forEach((t, i) => {
                console.log(`\nMatch ${i + 1}: ${t.name} (${t.symbol}) at ${t.contract_address}`);
                console.log(`  msg_sender: ${t.msg_sender}`);
                console.log(`  requestor_handle: ${t.requestor_handle}`);
                console.log(`  description: ${t.description}`);
                console.log(`  social_context: ${JSON.stringify(t.social_context)}`);
            });
        } else {
            console.log('\nNo matching tokens found in handle search results for that wallet.');
            // Check if it's in the description of other tokens
            tokens.forEach(t => {
                if (JSON.stringify(t).toLowerCase().includes(targetWallet)) {
                    console.log(`Wallet address found in JSON of token: ${t.name}`);
                }
            });
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

crossCheck();
