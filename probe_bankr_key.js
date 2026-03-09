const axios = require('axios');
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function probe() {
    const urls = [
        'https://api.bankr.bot/agent/launches', // I got 401 earlier, which is GOOD (means it exists)
        'https://api.bankr.bot/v1/user/search?q=jerrydotdev',
        'https://api.bankr.bot/v1/address/0xb0d7daad4172255f1bbf8d780dc785a679522002',
        'https://api.bankr.bot/launches'
    ];

    for (const url of urls) {
        console.log(`--- Checking: ${url} ---`);
        try {
            const res = await axios.get(url, {
                headers: {
                    'User-Agent': USER_AGENT,
                    'X-API-Key': 'bk_invalid_test' // Try with a dummy key to see if 401 changes to 403 or 404
                },
                timeout: 5000
            });
            console.log(`Status: ${res.status}`);
            console.log(`Data Sample: ${JSON.stringify(res.data).slice(0, 500)}`);
        } catch (err) {
            console.log(`Error: ${err.response?.status || err.message}`);
            if (err.response?.status === 401) {
                console.log('  -> Confirmed: Requires valid API key.');
            }
        }
    }
}

probe();
