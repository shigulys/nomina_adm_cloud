import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function fixPermissions() {
    const client = new Client({
        connectionString: process.env.SUPABASE_DB_URL,
    });

    try {
        await client.connect();
        console.log('✅ Conectado a PostgreSQL');

        console.log('--- Otorgando permisos a roles anon y authenticated ---');
        await client.query(`
            -- Asegurar permisos en el esquema public
            GRANT USAGE ON SCHEMA public TO anon, authenticated;
            
            -- Otorgar permisos en las tablas específicas
            GRANT SELECT ON TABLE app_users TO anon, authenticated;
            GRANT SELECT ON TABLE app_permissions TO anon, authenticated;
            
            -- Otorgar permisos en todas las tablas por si acaso
            GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
            
            -- Forzar recarga de cache (PostgREST detecta cambios DDL)
            COMMENT ON TABLE app_users IS 'Updated permissions at 2026-02-21';
        `);
        console.log('✅ Permisos actualizados');

        await client.end();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error al fijar permisos:', err);
        process.exit(1);
    }
}

fixPermissions();
