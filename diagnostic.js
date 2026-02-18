const axios = require('axios');
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function checkBasescan(wallet) {
    console.log(`--- Probing Basescan for Wallet: ${wallet} ---`);
    try {
        // We'll use the public explorer interface if we don't have an API key, or just probe the API
        const url = `https://api.basescan.org/api?module=account&action=txlist&address=${wallet}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc`;
        const res = await axios.get(url, { headers: { 'User-Agent': USER_AGENT } });
        console.log(`Basescan Status:`, res.data?.status);
        if (res.data?.result && Array.isArray(res.data.result)) {
            console.log(`Found ${res.data.result.length} recent transactions.`);
            res.data.result.forEach((tx, i) => {
                console.log(`TX ${i + 1}: To ${tx.to} | Method: ${tx.methodId || 'transfer'}`);
            });
        } else {
            console.log(`Basescan Data:`, JSON.stringify(res.data).slice(0, 500));
        }
    } catch (err) {
        console.error('Basescan Error:', err.message);
    }
}

const wallet = '0xb0d7daad4172255f1bbf8d780dc785a679522002';
checkBasescan(wallet);
