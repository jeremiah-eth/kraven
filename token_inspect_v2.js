const axios = require('axios');
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function checkToken(address) {
    console.log(`--- Checking Token: ${address} ---`);
    try {
        const url = `https://www.clanker.world/api/tokens?search=${address}`;
        const res = await axios.get(url, { headers: { 'User-Agent': USER_AGENT } });
        const tokens = res.data?.data || [];
        if (tokens.length > 0) {
            console.log(JSON.stringify(tokens[0], null, 2));
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

async function run() {
    await checkToken('0x39c48929D17D239D4Ed6B084848EeA3AC6025b07');
    console.log('\n=================================\n');
    await checkToken('0xAD4ceB2208E082684339Abf6Ac892e73D86E7b07');
}

run();
