const axios = require('axios');
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function probeWebsite() {
    console.log('--- Probing bankr.bot/launches ---');
    try {
        const res = await axios.get('https://bankr.bot/launches', { headers: { 'User-Agent': USER_AGENT }, timeout: 10000 });
        console.log(`Status: ${res.status}`);
        // Look for any .json or /api/ in the HTML
        const html = res.data;
        const jsonMatch = html.match(/"([^"]+\.json)"/g);
        const apiMatch = html.match(/"([^"]*\/api\/[^"]*)"/g);

        console.log('Possible JSON feeds:', jsonMatch);
        console.log('Possible API endpoints:', apiMatch);

        // Also check if there's a script tag with data
        if (html.includes('window.__DATA__')) {
            console.log('Found window.__DATA__ in HTML');
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

probeWebsite();
