
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eroqgxpjiqmftkgqyunj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyb3FneHBqaXFtZnRrZ3F5dW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDc3OTQ0OTUsImV4cCI6MjAyMzM3MDQ5NX0.j2IXrHGGHm7lZtQ4yEIq4lNQlHK58L__vZk0a1QHh_g';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Credenciais do Supabase não encontradas!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
