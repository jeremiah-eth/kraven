const axios = require('axios');
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function probe(url, name) {
    console.log(`--- Probing ${name} (${url}) ---`);
    try {
        const res = await axios.get(url, { headers: { 'User-Agent': USER_AGENT }, timeout: 5000 });
        console.log(`Status: ${res.status}`);
        if (typeof res.data === 'string') {
            console.log(`Data Type: HTML/String (Sample: ${res.data.slice(0, 100)}...)`);
        } else {
            console.log(`Data Type: JSON (Count: ${Array.isArray(res.data) ? res.data.length : 'Object'})`);
            console.log(`Data Sample: ${JSON.stringify(res.data).slice(0, 300)}`);
        }
    } catch (err) {
        console.log(`Error: ${err.response?.status || err.message}`);
    }
}

async function run() {
    await probe('https://bankr.bot/launches.json', 'bankr.bot root JSON');
    await probe('https://api.bankr.bot/v1/launches', 'api.bankr.bot V1 JSON');
    await probe('https://api.bankr.bot/v2/launches', 'api.bankr.bot V2 JSON');
    await probe('https://api.bankr.bot/info', 'api.bankr.bot Info');
    await probe('https://bankr.bot/api/tokens', 'bankr.bot API Tokens');
    await probe('https://bankr.bot/api/launches', 'bankr.bot API Launches');
}

run();
