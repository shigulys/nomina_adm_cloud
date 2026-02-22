import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

console.log('Testing Supabase Init...');
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseKey.length);

try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Client initialized');

    // Test a simple query
    supabase.from('app_users').select('count', { count: 'exact', head: true })
        .then(({ count, error }) => {
            if (error) {
                console.error('❌ Query error:', error);
            } else {
                console.log('✅ Query success, count:', count);
            }
            process.exit(0);
        })
        .catch(err => {
            console.error('❌ Catch error:', err);
            process.exit(1);
        });
} catch (err) {
    console.error('❌ Init error:', err);
    process.exit(1);
}
