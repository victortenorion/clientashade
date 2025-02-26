
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { serve } from "https://deno.fresh.dev/std@v9.6.1/http/server.ts"

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

serve(async (req) => {
  try {
    // Verificar autorização
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Buscar usuários usando o cliente admin
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) throw usersError

    // Buscar perfis
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
    if (profilesError) throw profilesError

    // Mesclar dados dos usuários com perfis
    const mergedUsers = users.map(user => {
      const profile = profiles?.find(p => p.id === user.id)
      return {
        id: user.id,
        email: user.email,
        username: profile?.username || user.email?.split('@')[0],
        updated_at: profile?.updated_at || user.updated_at,
        last_sign_in_at: user.last_sign_in_at,
      }
    })

    return new Response(
      JSON.stringify(mergedUsers),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
