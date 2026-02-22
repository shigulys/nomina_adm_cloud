import { getPool } from './config/db';
import bcrypt from 'bcryptjs';

async function setupAppUsers() {
    try {
        const pool = await getPool();

        console.log('--- Creando tabla APP_Users ---');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'APP_Users')
            BEGIN
                CREATE TABLE APP_Users (
                    ID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                    Username NVARCHAR(100) NOT NULL UNIQUE,
                    PasswordHash NVARCHAR(MAX) NOT NULL,
                    FullName NVARCHAR(200),
                    Email NVARCHAR(200),
                    Role NVARCHAR(50) DEFAULT 'User',
                    IsActive BIT DEFAULT 1,
                    CreatedAt DATETIME2 DEFAULT GETDATE(),
                    UpdatedAt DATETIME2 DEFAULT GETDATE()
                )
            END
        `);
        console.log('✅ Tabla APP_Users verificada/creada');

        console.log('--- Creando tabla APP_Permissions ---');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'APP_Permissions')
            BEGIN
                CREATE TABLE APP_Permissions (
                    ID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                    Role NVARCHAR(50) NOT NULL,
                    MenuKey NVARCHAR(100) NOT NULL,
                    Allowed BIT DEFAULT 1,
                    UNIQUE(Role, MenuKey)
                )
            END
        `);
        console.log('✅ Tabla APP_Permissions verificada/creada');

        // Insertar admin por defecto si no existe
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('admin123', salt);

        await pool.request()
            .input('username', 'admin')
            .input('hash', hash)
            .query(`
                IF NOT EXISTS (SELECT * FROM APP_Users WHERE Username = @username)
                BEGIN
                    INSERT INTO APP_Users (Username, PasswordHash, FullName, Role)
                    VALUES (@username, @hash, 'Administrador del Sistema', 'Admin')
                END
            `);
        console.log('✅ Usuario admin verificado/creado');

        // Insertar permisos base para Admin
        const baseMenus = ['dashboard', 'ejecutadas', 'nominas', 'resumen', 'empleados'];
        for (const menu of baseMenus) {
            await pool.request()
                .input('role', 'Admin')
                .input('menu', menu)
                .query(`
                    IF NOT EXISTS (SELECT * FROM APP_Permissions WHERE Role = @role AND MenuKey = @menu)
                    BEGIN
                        INSERT INTO APP_Permissions (Role, MenuKey, Allowed) VALUES (@role, @menu, 1)
                    END
                `);
        }
        console.log('✅ Permisos base de admin creados');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error en el setup:', err);
        process.exit(1);
    }
}

setupAppUsers();
