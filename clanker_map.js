const axios = require('axios');
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function deepSearchClanker(query) {
    console.log(`--- Deep Search Clanker: ${query} ---`);
    try {
        const url = `https://www.clanker.world/api/tokens?search=${query}`;
        const res = await axios.get(url, { headers: { 'User-Agent': USER_AGENT } });
        const tokens = res.data?.data || [];
        console.log(`Found ${tokens.length} tokens.`);
        tokens.forEach((t, i) => {
            console.log(`\n[Token ${i + 1}] ${t.name} (${t.symbol})`);
            console.log(`  Address: ${t.contract_address}`);
            console.log(`  Deployer: ${t.msg_sender}`);
            // Extract handles from all possible fields
            const handles = [];
            if (t.requestor_handle) handles.push(`requestor:${t.requestor_handle}`);
            if (t.social_context) {
                if (t.social_context.handle) handles.push(`social_context.handle:${t.social_context.handle}`);
                if (t.social_context.username) handles.push(`social_context.username:${t.social_context.username}`);
            }
            if (t.description && t.description.includes('@')) {
                const mention = t.description.match(/@([A-Za-z0-9_]+)/);
                if (mention) handles.push(`description_mention:${mention[0]}`);
            }
            console.log(`  Found Handles: ${handles.join(', ') || 'None'}`);
        });
    } catch (err) {
        console.error('Clanker Error:', err.message);
    }
}

async function run() {
    await deepSearchClanker('whistler_agent');
    await deepSearchClanker('0xb0d7daad4172255f1bbf8d780dc785a679522002');
}

run();
