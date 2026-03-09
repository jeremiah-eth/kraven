import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function generateRandomCode(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function main() {
    console.log('Generating 20 access codes...');
    const codes = [];
    for (let i = 0; i < 20; i++) {
        codes.push({ code: generateRandomCode() });
    }

    const { error } = await supabase
        .from('access_codes')
        .insert(codes);

    if (error) {
        console.error('Error inserting codes:', error);
    } else {
        console.log('Successfully inserted 20 new access codes:');
        codes.forEach(c => console.log(`- ${c.code}`));
    }
}

main().catch(console.error);
