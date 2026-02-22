import { getPool } from './config/db';

async function findPasswordColumn() {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT TABLE_NAME, COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE COLUMN_NAME LIKE '%Password%'
               OR COLUMN_NAME LIKE '%Hash%'
               OR COLUMN_NAME LIKE '%Clave%'
            ORDER BY TABLE_NAME
        `);
        console.log(JSON.stringify(result.recordset, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findPasswordColumn();
