import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabaseClient';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Buscar usuario en Supabase (tabla app_users)
        const { data: user, error } = await supabase
            .from('app_users')
            .select('*')
            .eq('username', username)
            .eq('is_active', true)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Obtener permisos por rol
        const { data: permissions } = await supabase
            .from('app_permissions')
            .select('menu_key')
            .eq('role', user.role)
            .eq('allowed', true);

        const menuItems = permissions?.map(p => p.menu_key) || [];

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
