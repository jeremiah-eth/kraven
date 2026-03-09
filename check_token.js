const axios = require('axios');
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function checkToken(address) {
    console.log(`--- Checking Token: ${address} ---`);
    try {
        const url = `https://www.clanker.world/api/tokens/get-clanker-by-address?address=${address}`;
        const res = await axios.get(url, { headers: { 'User-Agent': USER_AGENT } });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
}

// VisionClaw address from previous step
checkToken('0xF3eCaC4267B0De4954c9443C6d633823D9494b07');
