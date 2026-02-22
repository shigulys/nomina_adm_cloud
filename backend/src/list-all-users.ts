import { getPool } from './config/db';

async function listAllUserTables() {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT SCHEMA_NAME(schema_id) as schema_name, name as table_name 
            FROM sys.tables 
            WHERE name LIKE '%User%' 
               OR name LIKE '%Membership%'
               OR name LIKE '%Account%'
            ORDER BY schema_name, table_name
        `);
        console.log(JSON.stringify(result.recordset, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listAllUserTables();
