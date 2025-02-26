
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
    const { email, password, username, is_admin, store_ids } = await req.json()
    console.log('Creating new user with data:', { email, username, is_admin, store_ids })

    // Validate required fields
    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    // Create the user in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username }
    })

    if (authError) {
      console.error('Auth creation error:', authError)
      throw authError
    }

    // Update the profile with username
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        username,
        email,
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      throw profileError
    }

    // Create user role entry
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        is_admin: is_admin || false
      })

    if (roleError) {
      console.error('Role creation error:', roleError)
      throw roleError
    }

    // Create store assignment if store_ids is provided
    if (store_ids && store_ids.length > 0) {
      const { error: storeError } = await supabase
        .from('user_stores')
        .insert({
          user_id: authData.user.id,
          store_id: store_ids[0]
        })

      if (storeError) {
        console.error('Store assignment error:', storeError)
        throw storeError
      }
    }

    return new Response(
      JSON.stringify({ id: authData.user.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in create-user function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

