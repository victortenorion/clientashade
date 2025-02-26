
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
    const { userId, email, password, username } = await req.json()

    if (email || password) {
      const updates: { email?: string; password?: string } = {}
      if (email) updates.email = email
      if (password) updates.password = password

      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId,
        updates
      )

      if (authError) throw authError
    }

    if (username || email) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username,
          email,
        })

      if (profileError) throw profileError
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
