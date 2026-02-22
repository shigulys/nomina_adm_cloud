import { createClient } from '@supabase/supabase-js';

// No cargar dotenv aquí, dejar que index.ts lo haga
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase URL o Key no encontradas en variables de entorno');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
