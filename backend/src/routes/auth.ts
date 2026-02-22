import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/pgClient';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        console.log(`[Auth] Intento de login (Direct PG) para usuario: "${username}"`);

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Buscar usuario directo en PG
        const userRes = await pool.query(
            'SELECT * FROM app_users WHERE username ILIKE $1 AND is_active = TRUE',
            [username]
        );

        const user = userRes.rows[0];

        if (!user) {
            console.log(`[Auth] Usuario no encontrado: "${username}"`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log(`[Auth] Usuario encontrado: ${user.username} (${user.role})`);

        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            console.log(`[Auth] Contraseña incorrecta para: "${username}"`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Obtener permisos por rol - Directo en PG
        const permRes = await pool.query(
            'SELECT menu_key FROM app_permissions WHERE role = $1 AND allowed = TRUE',
            [user.role]
        );

        const menuItems = permRes.rows.map((p: any) => p.menu_key);

        // Generar JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, permissions: menuItems },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.full_name,
                role: user.role,
                permissions: menuItems
            }
        });
    } catch (err: any) {
        console.error('[Auth] Error fatal en login:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Middleware de autenticación
export const authenticateToken = (req: any, res: Response, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

// GET /api/auth/me - obtener perfil actual
router.get('/me', authenticateToken, async (req: any, res: Response) => {
    res.json({ user: req.user });
});

export default router;
