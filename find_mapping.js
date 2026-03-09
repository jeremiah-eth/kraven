const axios = require('axios');
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function findInRaw(query, target) {
    console.log(`--- Searching for "${target}" in results for query "${query}" ---`);
    try {
        const url = `https://www.clanker.world/api/tokens?search=${query}`;
        const res = await axios.get(url, { headers: { 'User-Agent': USER_AGENT } });
        const tokens = res.data?.data || [];

        tokens.forEach((t, i) => {
            const str = JSON.stringify(t);
            if (str.toLowerCase().includes(target.toLowerCase())) {
                console.log(`\nMatch in Token ${i + 1} (${t.name})`);
                // Find which key contains it
                Object.keys(t).forEach(key => {
                    const val = JSON.stringify(t[key]);
                    if (val.toLowerCase().includes(target.toLowerCase())) {
                        console.log(`  Key [${key}] contains match: ${val}`);
                    }
                });
            }
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

const handle = 'whistler_agent';
findInRaw(handle, 'whistler');
