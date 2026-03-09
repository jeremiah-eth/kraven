const axios = require('axios');
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Minimal implementation of the updated discoverWalletsFromClanker logic
async function verifyDiscovery(xHandle) {
    const handle = xHandle.toLowerCase().replace(/^@/, '');
    console.log(`--- Verifying Discovery for: @${handle} ---`);

    try {
        // Search by handle keyword
        const url = 'https://www.clanker.world/api/tokens';
        const res = await axios.get(url, {
            params: { search: handle },
            headers: { 'User-Agent': USER_AGENT },
            timeout: 10000
        });

        const data = res.data?.data || res.data || [];
        console.log(`Found ${data.length} tokens in search results.`);

        const wallets = new Set();
        for (const token of data) {
            // THE NEW LOOSENED LOGIC:
            const description = token.description || '';
            const isBankr = description.toLowerCase().includes('bankr') ||
                JSON.stringify(token).toLowerCase().includes('bankr');

            // Check if handle matches ANYWHERE in the JSON for Bankr tokens
            const isMatch = JSON.stringify(token).toLowerCase().includes(handle);

            if (isMatch || isBankr) {
                const sender = token.msg_sender || token.creator || token.admin || null;
                if (sender && typeof sender === 'string' && sender.startsWith('0x')) {
                    wallets.add(sender.toLowerCase());
                }
            }
        }

        console.log(`Discovered Wallets:`, Array.from(wallets));
        const targetWallet = '0xb0d7daad4172255f1bbf8d780dc785a679522002'.toLowerCase();
        if (wallets.has(targetWallet)) {
            console.log('SUCCESS! Target wallet was found via loosened discovery logic.');
        } else {
            console.log('FAIL: Target wallet still not found via search results.');
            // Note: This might be because the search results don't include those specific tokens anymore
            // but the logic itself is now more inclusive.
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

verifyDiscovery('jerrydotdev');
