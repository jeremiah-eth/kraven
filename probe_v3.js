const axios = require('axios');
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function probe(url, name) {
    console.log(`--- Probing ${name} (${url}) ---`);
    try {
        const res = await axios.get(url, { headers: { 'User-Agent': USER_AGENT }, timeout: 5000 });
        console.log(`${name} Status: ${res.status}`);
        if (name.includes('Tokens')) {
            console.log(`${name} Sample: ${JSON.stringify(res.data).slice(0, 300)}`);
        }
    } catch (err) {
        console.log(`${name} Error: ${err.response?.status || err.code || err.message}`);
    }
}

async function run() {
    // Bankr common paths
    await probe('https://api.bankr.bot/tokens', 'Bankr Tokens');
    await probe('https://api.bankr.bot/v1/tokens', 'Bankr v1 Tokens');
    await probe('https://api.bankr.bot/agent/metadata', 'Bankr Agent Metadata');

    // Doppler root - maybe it's the indexer itself
    await probe('https://doppler.lol/graphql', 'Doppler GraphQL');

    // One more Doppler guess
    await probe('https://api.doppler.market/search/salvinoarmati', 'Doppler Market API');
}

run();
