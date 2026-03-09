const axios = require('axios');
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function deepInspectWallet(wallet) {
    console.log(`--- Deep Inspect Wallet: ${wallet} ---`);
    try {
        const url = `https://www.clanker.world/api/tokens?search=${wallet}`;
        const res = await axios.get(url, { headers: { 'User-Agent': USER_AGENT } });
        const tokens = res.data?.data || [];
        console.log(`Found ${tokens.length} tokens.`);
        tokens.forEach((t, i) => {
            console.log(`\n[Token ${i + 1}] ${t.name} (${t.symbol})`);
            console.log(`  social_context: ${JSON.stringify(t.social_context)}`);
            console.log(`  requestor_handle: ${t.requestor_handle}`);
            console.log(`  description: ${t.description}`);
            console.log(`  img_url: ${t.img_url}`);
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

const wallet = '0xb0d7daad4172255f1bbf8d780dc785a679522002';
deepInspectWallet(wallet);
