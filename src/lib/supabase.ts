
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://eroqgxpjiqmftkgqyunj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyb3FneHBqaXFtZnRrZ3F5dW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0MTUyNjUsImV4cCI6MjA1NDk5MTI2NX0.XiXzmlcwblXg0qmTrhcHgCeQKTcdGxOnbtILa2eHAtQ";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyb3FneHBqaXFtZnRrZ3F5dW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTQxNTI2NSwiZXhwIjoyMDU0OTkxMjY1fQ.NbwqE4GnWiYmL8x_4DM4u_5K00U2DrqPAGvYAJzsTlU";

// Cliente público para operações regulares
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Cliente admin para operações administrativas
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

