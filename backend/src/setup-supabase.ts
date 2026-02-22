import { Client } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Cargar .env desde el nivel superior
dotenv.config({ path: path.join(__dirname, '../.env') });

async function setupSupabasePostgres() {
    const client = new Client({
        connectionString: process.env.SUPABASE_DB_URL,
    });

    try {
        await client.connect();
        console.log('✅ Conectado a PostgreSQL de Supabase');

        console.log('--- Creando tabla app_users ---');
        await client.query(`
            CREATE TABLE IF NOT EXISTS app_users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                full_name TEXT,
                email TEXT,
                role TEXT DEFAULT 'User',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log('✅ Tabla app_users verificada/creada');

        console.log('--- Creando tabla app_permissions ---');
        await client.query(`
            CREATE TABLE IF NOT EXISTS app_permissions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                role TEXT NOT NULL,
                menu_key TEXT NOT NULL,
                allowed BOOLEAN DEFAULT TRUE,
                UNIQUE(role, menu_key)
            );
        `);
        console.log('✅ Tabla app_permissions verificada/creada');

        // Insertar admin por defecto
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('admin123', salt);

        await client.query(`
            INSERT INTO app_users (username, password_hash, full_name, role)
            VALUES ($1, $2, 'Administrador del Sistema', 'Admin')
            ON CONFLICT (username) DO NOTHING;
        `, ['admin', hash]);
        console.log('✅ Usuario admin verificado/creado (User: admin, Pass: admin123)');

        // Insertar permisos base para Admin
        const baseMenus = ['dashboard', 'ejecutadas', 'nominas', 'resumen', 'empleados'];
        for (const menu of baseMenus) {
            await client.query(`
                INSERT INTO app_permissions (role, menu_key, allowed)
                VALUES ($1, $2, TRUE)
                ON CONFLICT (role, menu_key) DO NOTHING;
            `, ['Admin', menu]);
        }
        console.log('✅ Permisos base de admin creados');

        await client.end();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error en el setup de Supabase:', err);
        process.exit(1);
    }
}

setupSupabasePostgres();
