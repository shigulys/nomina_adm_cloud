import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function verifyAuthData() {
    const client = new Client({
        connectionString: process.env.SUPABASE_DB_URL,
    });

    try {
        await client.connect();
        console.log('✅ Conectado a Supabase');

        const userRes = await client.query('SELECT username, role, is_active FROM app_users');
        console.log('Usuarios:', JSON.stringify(userRes.rows, null, 2));

        const permRes = await client.query('SELECT role, menu_key, allowed FROM app_permissions');
        console.log('Permisos:', JSON.stringify(permRes.rows, null, 2));

        await client.end();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

verifyAuthData();
