import dotenv from 'dotenv';
dotenv.config();

console.log('1. Dotenv loaded');
import express from 'express';
console.log('2. Express loaded');
import cors from 'cors';
console.log('3. Cors loaded');
import authRoutes from './routes/auth';
console.log('4. Auth routes loaded');
import nominaRoutes from './routes/nomina';
console.log('5. Nomina routes loaded');

const app = express();
console.log('6. App initialized');
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api', nominaRoutes);

app.listen(3006, () => console.log('Test server on 3006'));
