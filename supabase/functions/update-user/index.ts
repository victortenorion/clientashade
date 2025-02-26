
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { userId, email, password, username } = await req.json()
    console.log('Updating user:', { userId, email, username })

    if (email || password) {
      const updates: { email?: string; password?: string } = {}
      if (email) updates.email = email
      if (password) updates.password = password

      console.log('Updating auth user data...')
      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId,
        updates
      )

      if (authError) {
        console.error('Auth update error:', authError)
        throw authError
      }
    }

    if (username || email) {
      console.log('Updating profile data...')
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username,
          email,
        })

      if (profileError) {
        console.error('Profile update error:', profileError)
        throw profileError
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in update-user function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
