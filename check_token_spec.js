const axios = require('axios');
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function checkToken(address) {
    console.log(`--- Checking Token: ${address} ---`);
    try {
        const url = `https://www.clanker.world/api/tokens?search=${address}`;
        const res = await axios.get(url, { headers: { 'User-Agent': USER_AGENT } });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
}

// MOLTBOTAI address
checkToken('0x2264CD6e3395cC88Ae9dD2E0a476d9926e922B07');
