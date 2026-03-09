const axios = require('axios');
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function probe(url, name) {
    console.log(`--- Probing ${name} (${url}) ---`);
    try {
        const res = await axios.get(url, { headers: { 'User-Agent': USER_AGENT }, timeout: 5000 });
        console.log(`${name} Status: ${res.status}`);
        console.log(`${name} Data Sample: ${JSON.stringify(res.data).slice(0, 300)}`);
    } catch (err) {
        console.log(`${name} Error: ${err.response?.status || err.code || err.message}`);
    }
}

async function run() {
    // Doppler attempts
    await probe('https://indexer.doppler.lol/search/salvinoarmati?chain_ids=8453', 'Doppler Indexer (Indexer Subdomain)');
    await probe('https://doppler.lol/api/search/salvinoarmati?chain_ids=8453', 'Doppler (API path)');
    await probe('https://www.doppler.lol/api/search/salvinoarmati?chain_ids=8453', 'Doppler (WWW + API path)');

    // Bankr attempts
    await probe('https://api.bankr.bot/v1/launches', 'Bankr API (V1 path)');
    await probe('https://api.bankr.bot/launches', 'Bankr API (Root path)');
    await probe('https://bankr.bot/api/launches', 'Bankr (API path)');
}

run();
