import { getPool } from './config/db';

async function listSecurityTables() {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME LIKE '%User%' 
               OR TABLE_NAME LIKE '%Security%' 
               OR TABLE_NAME LIKE '%Role%' 
               OR TABLE_NAME LIKE '%Auth%'
               OR TABLE_NAME LIKE 'SA_Roles%'
            ORDER BY TABLE_NAME
        `);
        console.log(JSON.stringify(result.recordset, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listSecurityTables();
