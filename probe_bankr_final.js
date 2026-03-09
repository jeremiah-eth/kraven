const axios = require('axios');
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function probe() {
    const urls = [
        'https://api.bankr.bot/launches',
        'https://api.bankr.bot/v1/launches',
        'https://api.bankr.bot/v1/user/jerrydotdev',
        'https://api.bankr.bot/v1/address/0xb0d7daad4172255f1bbf8d780dc785a679522002',
        'https://bankr.bot/launches/data.json',
        'https://bankr.bot/api/v1/launches'
    ];

    for (const url of urls) {
        console.log(`--- Checking: ${url} ---`);
        try {
            const res = await axios.get(url, { headers: { 'User-Agent': USER_AGENT }, timeout: 5000 });
            console.log(`Status: ${res.status}`);
            console.log(`Data Type: ${typeof res.data === 'string' ? (res.data.trim().startsWith('<') ? 'HTML' : 'Text') : 'JSON'}`);
            if (typeof res.data !== 'string') {
                console.log(`Data Sample: ${JSON.stringify(res.data).slice(0, 500)}`);
            }
        } catch (err) {
            console.log(`Error: ${err.response?.status || err.message}`);
        }
    }
}

probe();
