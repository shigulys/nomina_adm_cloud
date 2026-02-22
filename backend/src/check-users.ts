import { getPool } from './config/db';

async function checkUsersTable() {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'SA_Users'
            ORDER BY ORDINAL_POSITION
        `);
        if (result.recordset.length === 0) {
            console.log('Table SA_Users not found.');
        } else {
            console.log(JSON.stringify(result.recordset, null, 2));
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsersTable();
