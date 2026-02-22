import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes, { authenticateToken } from './routes/auth';
import nominaRoutes from './routes/nomina';

const app = express();
const PORT = process.env.PORT || 3001;

console.log('--- Configuración del Servidor ---');
console.log(`PORT: ${PORT}`);
console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Encontrada' : '❌ NO ENCONTRADA'}`);
console.log(`SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Encontrada' : '❌ NO ENCONTRADA'}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Encontrado' : '❌ NO ENCONTRADO'}`);
console.log('---------------------------------');

// Middlewares
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', authenticateToken, nominaRoutes);

// Health check
app.get('/', (_req, res) => {
    res.json({ message: '🚀 API Nómina ADM Cloud', version: '1.0.0', status: 'running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📊 API Reportes Nómina lista`);
});

export default app;
