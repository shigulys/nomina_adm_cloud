import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: {
        rejectUnauthorized: false // Requerido para Supabase en algunos entornos
    }
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle pg client', err);
});

export default pool;
