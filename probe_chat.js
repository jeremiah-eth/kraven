const axios = require('axios');
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function probeChat() {
    const urls = [
        'https://api.bankr.chat/launches',
        'https://api.bankr.chat/v1/launches',
        'https://bankr.chat/launches.json',
        'https://api.bankr.chat/user/jerrydotdev'
    ];

    for (const url of urls) {
        console.log(`--- Checking: ${url} ---`);
        try {
            const res = await axios.get(url, { headers: { 'User-Agent': USER_AGENT }, timeout: 5000 });
            console.log(`Status: ${res.status}`);
            console.log(`Data Sample: ${JSON.stringify(res.data).slice(0, 500)}`);
        } catch (err) {
            console.log(`Error: ${err.response?.status || err.message}`);
        }
    }
}

probeChat();
