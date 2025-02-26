
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eroqgxpjiqmftkgqyunj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyb3FneHBqaXFtZnRrZ3F5dW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0MTUyNjUsImV4cCI6MjA1NDk5MTI2NX0.XiXzmlcwblXg0qmTrhcHgCeQKTcdGxOnbtILa2eHAtQ';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyb3FneHBqaXFtZnRrZ3F5dW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTQxNTI2NSwiZXhwIjoyMDU0OTkxMjY1fQ.NbwqE4GnWiYmL8x_4DM4u_5K00U2DrqPAGvYAJzsTlU';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Credenciais do Supabase não encontradas!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

