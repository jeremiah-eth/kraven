const axios = require('axios');
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function rawSearch(query) {
    console.log(`--- Raw Search: ${query} ---`);
    try {
        const url = `https://www.clanker.world/api/tokens?search=${query}`;
        const res = await axios.get(url, { headers: { 'User-Agent': USER_AGENT } });
        const tokens = res.data?.data || [];
        fmt(tokens);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

function fmt(data) {
    data.forEach((t, i) => {
        console.log(`\n--- Item ${i + 1} ---`);
        console.log(JSON.stringify(t, null, 2));
    });
}

const handle = 'whistler_agent';
rawSearch(handle);
