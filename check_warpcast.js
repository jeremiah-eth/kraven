const axios = require('axios');
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function checkWarpcast() {
    console.log('--- Searching Warpcast for @jerrydotdev ---');
    try {
        const url = 'https://client.warpcast.com/v2/user-by-username?username=jerrydotdev';
        const res = await axios.get(url, { headers: { 'User-Agent': USER_AGENT } });
        console.log(`Status: ${res.status}`);
        console.log(`Data: ${JSON.stringify(res.data).slice(0, 1000)}`);
    } catch (err) {
        console.log(`Error: ${err.response?.status || err.message}`);
    }
}

checkWarpcast();
