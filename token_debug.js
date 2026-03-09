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

// Project Airi address which matched the wallet search previously
checkToken('0x2c25720c970AD3555D6E141a0E2B4D88d70F7b07');
