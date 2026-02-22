import { Router, Request, Response } from 'express';
import { getPool, sql } from '../config/db';

const router = Router();

// GET /api/test - test de conexión
router.get('/test', async (_req: Request, res: Response) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT GETDATE() AS fecha_servidor');
        res.json({ status: 'ok', datos: result.recordset[0] });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/tablas - buscar tablas relacionadas con nómina
router.get('/tablas', async (_req: Request, res: Response) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
      SELECT TABLE_SCHEMA, TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      AND (TABLE_NAME LIKE '%PR_%' OR TABLE_NAME LIKE 'SA_%' OR TABLE_NAME LIKE '%Nomina%' OR TABLE_NAME LIKE '%Payroll%')
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `);
        res.json(result.recordset);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/empleados - lista de empleados
router.get('/empleados', async (req: Request, res: Response) => {
    try {
        const pool = await getPool();
        const { busqueda } = req.query;

        let query = `
      Select Code Codigo, FullName Nombre, FiscalID Cedula 
      from SA_Relationships 
      where IsEmployee = 1
    `;

        if (busqueda) {
            query += ` AND (FullName LIKE @busqueda OR Code LIKE @busqueda OR FiscalID LIKE @busqueda)`;
        }

        query += ` ORDER BY FullName`;

        const request = pool.request();
        if (busqueda) {
            request.input('busqueda', sql.VarChar, `%${busqueda}%`);
        }

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// NUEVOS ENDPOINTS PARA NÓMINAS EJECUTADAS
// ==========================================

// GET /api/nomina/ejecutadas - listar nóminas generadas
router.get('/nomina/ejecutadas', async (req: Request, res: Response) => {
    try {
        const pool = await getPool();
        const { busqueda } = req.query;

        const request = pool.request();
        let query = `
            SELECT 
                ta.ID as id,
                ta.DocID as doc_id,
                ta.DocDate as fecha,
                ta.Reference as referencia,
                ta.CreationDate as fecha_creacion,
                pt.Name as tipo_nomina
            FROM SA_Transactions ta
            INNER JOIN PR_PayrollTypes pt ON ta.PayrollTypeID = pt.ID
            WHERE ta.DocType = 'PAYROLL'
        `;

        if (busqueda) {
            query += ` AND (ta.Reference LIKE @busqueda OR pt.Name LIKE @busqueda)`;
            request.input('busqueda', sql.VarChar, `%${busqueda}%`);
        }

        query += ` ORDER BY ta.DocDate DESC`;

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/nomina/ejecutadas/:transId - detalle de una nómina específica
router.get('/nomina/ejecutadas/:transId', async (req: Request, res: Response) => {
    try {
        const { transId } = req.params;
        const pool = await getPool();

        const result = await pool.request()
            .input('transId', sql.UniqueIdentifier, transId)
            .query(`
                SELECT 
                    te.ID as line_id,
                    te.EmployeeID as employee_id,
                    te.BenefitDiscountID as benefit_discount_id,
                    r.FullName as empleado,
                    r.Code as codigo,
                    r.FiscalID as cedula,
                    bd.Name as concepto,
                    bdt.ID as concepto_tipo_id,
                    bdt.Factor as factor,
                    CASE bdt.Factor WHEN 1 THEN 'Ingreso' ELSE 'Deducción' END as tipo_movimiento,
                    te.Total as monto,
                    COALESCE(bd.CompanyPaid, 0) as company_paid,
                    loc.Name as Proyecto,
                    ta.DocDate as fecha_aplicacion,
                    ta.Reference as referencia
                FROM SA_Trans_Employees te
                INNER JOIN SA_Relationships r ON te.EmployeeID = r.ID
                INNER JOIN SA_Transactions ta ON te.TransID = ta.ID
                LEFT JOIN PR_Benefits_Discounts bd ON te.BenefitDiscountID = bd.ID
                LEFT JOIN PR_Benefits_Discounts_Types bdt ON bd.Type = bdt.ID
                LEFT JOIN SA_Locations loc ON te.LocationID = loc.Id
                WHERE te.TransID = @transId AND (bd.Type IS NULL OR bd.Type NOT IN (60, 90))
                ORDER BY r.FullName, bdt.Factor DESC, CASE WHEN bd.Name LIKE '%Salario%' THEN 0 ELSE 1 END, bd.Name
            `);

        res.json(result.recordset);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/nomina/resumen - resumen de nómina por documento/periodo
router.get('/nomina/resumen', async (req: Request, res: Response) => {
    try {
        const pool = await getPool();
        const { periodo } = req.query; // Aquí periodo es el TransID (GUID)

        const request = pool.request();
        let whereClause = "WHERE ta.DocType = 'PAYROLL'";

        if (periodo) {
            whereClause += " AND ta.ID = @periodo";
            request.input('periodo', sql.UniqueIdentifier, periodo as string);
        }

        const query = `
            SELECT 
                ta.ID as periodo,
                ta.DocDate as fecha,
                ta.Reference + ' (' + pt.Name + ')' as nombre_periodo,
                COUNT(DISTINCT te.EmployeeID) as total_empleados,
                SUM(CASE WHEN bdt.Factor = 1 THEN te.Total ELSE 0 END) as total_bruto,
                SUM(CASE WHEN bdt.Factor = -1 THEN te.Total ELSE 0 END) as total_deducciones,
                SUM(CASE WHEN bdt.Factor = 1 THEN te.Total ELSE -te.Total END) as total_neto
            FROM SA_Transactions ta
            INNER JOIN PR_PayrollTypes pt ON ta.PayrollTypeID = pt.ID
            LEFT JOIN SA_Trans_Employees te ON ta.ID = te.TransID
            LEFT JOIN PR_Benefits_Discounts bd ON te.BenefitDiscountID = bd.ID
            LEFT JOIN PR_Benefits_Discounts_Types bdt ON bd.Type = bdt.ID
            ${whereClause} AND (bd.Type IS NULL OR bd.Type NOT IN (60, 90)) AND te.Total <> 0 AND (bd.CompanyPaid IS NULL OR bd.CompanyPaid <> 1)
            GROUP BY ta.ID, ta.Reference, pt.Name, ta.DocDate
            ORDER BY ta.DocDate DESC
        `;

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/nomina/detalle - detalle de nómina por empleado (basado en transacciones)
router.get('/nomina/detalle', async (req: Request, res: Response) => {
    try {
        const pool = await getPool();
        const { periodo, busqueda } = req.query;

        const request = pool.request();
        const conditions: string[] = ["ta.DocType = 'PAYROLL'"];

        if (periodo) {
            conditions.push("ta.ID = @periodo");
            request.input('periodo', sql.UniqueIdentifier, periodo as string);
        }
        if (busqueda) {
            conditions.push("(r.FullName LIKE @busqueda OR r.Code LIKE @busqueda OR r.FiscalID LIKE @busqueda)");
            request.input('busqueda', sql.VarChar, `%${busqueda}%`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const result = await request.query(`
            SELECT 
                r.FullName as empleado,
                COALESCE(r.Code, 'S/C') as codigo,
                COALESCE(r.FiscalID, '000-0000000-0') as cedula,
                ta.ID as periodo,
                ta.DocDate as fecha,
                ta.Reference + ' (' + pt.Name + ')' as nombre_periodo,
                loc.Name as proyecto,
                SUM(CASE WHEN bdt.Factor = 1 THEN te.Total ELSE 0 END) as salario_bruto,
                SUM(CASE WHEN bdt.Factor = -1 THEN te.Total ELSE 0 END) as total_deducciones,
                SUM(CASE WHEN bdt.Factor = 1 THEN te.Total ELSE -te.Total END) as salario_neto
            FROM SA_Transactions ta
            INNER JOIN PR_PayrollTypes pt ON ta.PayrollTypeID = pt.ID
            INNER JOIN SA_Trans_Employees te ON ta.ID = te.TransID
            INNER JOIN SA_Relationships r ON te.EmployeeID = r.ID
            LEFT JOIN PR_Benefits_Discounts bd ON te.BenefitDiscountID = bd.ID
            LEFT JOIN PR_Benefits_Discounts_Types bdt ON bd.Type = bdt.ID
            LEFT JOIN SA_Locations loc ON te.LocationID = loc.Id
            ${whereClause} AND (bd.Type IS NULL OR bd.Type NOT IN (60, 90)) AND te.Total <> 0 AND (bd.CompanyPaid IS NULL OR bd.CompanyPaid <> 1)
            GROUP BY r.FullName, r.Code, r.FiscalID, r.ID, ta.ID, ta.Reference, pt.Name, ta.DocDate, loc.Name
            ORDER BY r.FullName, ta.DocDate DESC
        `);

        res.json(result.recordset);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/nomina/periodos - periodos basados en documentos de nómina reales
router.get('/nomina/periodos', async (_req: Request, res: Response) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT 
                ta.ID as periodo,
                ta.DocDate as fecha,
                ta.Reference + ' (' + pt.Name + ')' as nombre_periodo
            FROM SA_Transactions ta
            INNER JOIN PR_PayrollTypes pt ON ta.PayrollTypeID = pt.ID
            WHERE ta.DocType = 'PAYROLL'
            ORDER BY ta.DocDate DESC
        `);
        res.json(result.recordset);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/nomina/kpis - KPIs para el dashboard basados en transacciones
router.get('/nomina/kpis', async (_req: Request, res: Response) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            DECLARE @ultimo_trans_id UNIQUEIDENTIFIER;
            SELECT TOP 1 @ultimo_trans_id = ID FROM SA_Transactions WHERE DocType = 'PAYROLL' ORDER BY DocDate DESC;

            SELECT
                (SELECT COUNT(*) FROM SA_Relationships WHERE IsEmployee = 1) AS empleados_activos,
                (SELECT Reference + ' (' + pt.Name + ')' FROM SA_Transactions ta 
                 INNER JOIN PR_PayrollTypes pt ON ta.PayrollTypeID = pt.ID WHERE ta.ID = @ultimo_trans_id) AS ultimo_periodo,
                (SELECT SUM(CASE WHEN bdt.Factor = 1 THEN te.Total ELSE -te.Total END) 
                 FROM SA_Trans_Employees te 
                 LEFT JOIN PR_Benefits_Discounts bd ON te.BenefitDiscountID = bd.ID
                 LEFT JOIN PR_Benefits_Discounts_Types bdt ON bd.Type = bdt.ID
                 WHERE te.TransID = @ultimo_trans_id AND (bd.Type IS NULL OR bd.Type NOT IN (60, 90)) AND te.Total <> 0 AND (bd.CompanyPaid IS NULL OR bd.CompanyPaid <> 1)) AS total_neto_ultimo,
                (SELECT SUM(CASE WHEN bdt.Factor = 1 THEN te.Total ELSE 0 END) 
                 FROM SA_Trans_Employees te 
                 LEFT JOIN PR_Benefits_Discounts bd ON te.BenefitDiscountID = bd.ID
                 LEFT JOIN PR_Benefits_Discounts_Types bdt ON bd.Type = bdt.ID
                 WHERE te.TransID = @ultimo_trans_id AND (bd.Type IS NULL OR bd.Type NOT IN (60, 90)) AND te.Total <> 0 AND (bd.CompanyPaid IS NULL OR bd.CompanyPaid <> 1)) AS total_bruto_ultimo,
                (SELECT SUM(CASE WHEN bdt.Factor = -1 THEN te.Total ELSE 0 END) 
                 FROM SA_Trans_Employees te 
                 LEFT JOIN PR_Benefits_Discounts bd ON te.BenefitDiscountID = bd.ID
                 LEFT JOIN PR_Benefits_Discounts_Types bdt ON bd.Type = bdt.ID
                 WHERE te.TransID = @ultimo_trans_id AND (bd.Type IS NULL OR bd.Type NOT IN (60, 90)) AND te.Total <> 0 AND (bd.CompanyPaid IS NULL OR bd.CompanyPaid <> 1)) AS total_deducciones_ultimo
        `);
        res.json(result.recordset[0]);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint de diagnóstico para columnas
router.get('/columnas/:tabla', async (req: Request, res: Response) => {
    try {
        const { tabla } = req.params;
        const pool = await getPool();
        const result = await pool.request()
            .input('tabla', sql.VarChar, tabla)
            .query(`
        SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = @tabla
        ORDER BY ORDINAL_POSITION
      `);
        res.json(result.recordset);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint de muestreo
router.get('/muestreo/:tabla', async (req: Request, res: Response) => {
    try {
        const { tabla } = req.params;
        const pool = await getPool();
        const result = await pool.request().query(`SELECT TOP 10 * FROM ${tabla}`);
        res.json(result.recordset);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint de conteo
router.get('/conteo/:tabla', async (req: Request, res: Response) => {
    try {
        const { tabla } = req.params;
        const pool = await getPool();
        const result = await pool.request().query(`SELECT COUNT(*) as total FROM ${tabla}`);
        res.json(result.recordset[0]);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
