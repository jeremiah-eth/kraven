const axios = require('axios');
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function probe(url, name) {
    console.log(`--- Probing ${name} (${url}) ---`);
    try {
        const res = await axios.get(url, { headers: { 'User-Agent': USER_AGENT }, timeout: 5000 });
        console.log(`${name} Status: ${res.status}`);
        console.log(`${name} Data Sample: ${JSON.stringify(res.data).slice(0, 500)}`);
    } catch (err) {
        console.log(`${name} Error: ${err.response?.status || err.code || err.message}`);
    }
}

const wallet = '0xb0d7daad4172255f1bbf8d780dc785a679522002';

async function run() {
    // Doppler attempts
    await probe(`https://doppler.lol/search/${wallet}?chain_ids=8453`, 'Doppler Root (Wallet)');
    await probe(`https://doppler.lol/api/search/${wallet}?chain_ids=8453`, 'Doppler /api/ (Wallet)');
    await probe(`https://doppler.lol/api/v1/search/${wallet}?chain_ids=8453`, 'Doppler /api/v1/ (Wallet)');

    // Clanker direct token lookup
    // Token 10 from previous raw search had id: 1140639
    await probe(`https://www.clanker.world/api/tokens/1140639`, 'Clanker Token by ID');
}

run();
