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
const handle = 'whistler_agent';

async function run() {
    // Doppler attempts
    await probe(`https://doppler.lol/search/${handle}?chain_ids=8453`, 'Doppler (Root search)');
    await probe(`https://doppler.lol/search/${wallet}?chain_ids=8453`, 'Doppler (Wallet search)');

    // Clanker search for handle
    await probe(`https://www.clanker.world/api/tokens?search=${handle}`, 'Clanker (Handle search)');

    // Clanker search for wallet - already done but let's see if we missed anything
    await probe(`https://www.clanker.world/api/tokens?search=${wallet}`, 'Clanker (Wallet search)');
}

run();
