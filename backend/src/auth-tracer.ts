console.log('A. Loading express router');
import { Router } from 'express';
console.log('B. Loading bcryptjs');
import bcrypt from 'bcryptjs';
console.log('C. Loading jsonwebtoken');
import jwt from 'jsonwebtoken';
console.log('D. Loading supabaseClient');
import { supabase } from '../config/supabaseClient';
console.log('E. Auth routes all imports done');

const router = Router();
export default router;
