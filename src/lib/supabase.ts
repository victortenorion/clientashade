
import { createClient } from '@supabase/supabase-js';

// Por favor, substitua estas URLs pelas suas do projeto Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Credenciais do Supabase não encontradas!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
