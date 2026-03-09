const axios = require('axios');
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function search(query) {
    console.log(`--- Searching Clanker for: ${query} ---`);
    try {
        const url = `https://www.clanker.world/api/tokens?search=${query}`;
        const res = await axios.get(url, { headers: { 'User-Agent': USER_AGENT } });
        const tokens = res.data?.data || [];
        console.log(`Found ${tokens.length} tokens.`);
        tokens.forEach((t, i) => {
            console.log(`\n--- Token ${i + 1}: ${t.name} (${t.symbol}) ---`);
            console.log(JSON.stringify(t, null, 2));
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

search('jerrydotdev');
