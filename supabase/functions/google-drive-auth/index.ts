import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, redirectUri } = await req.json()

    if (!code) {
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization code provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get environment variables
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ success: false, error: 'Google OAuth not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      console.error('Token exchange error:', tokenData)
      return new Response(
        JSON.stringify({ success: false, error: tokenData.error_description || tokenData.error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const { access_token, refresh_token, expires_in } = tokenData

    // Get user email from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    const userInfo = await userInfoResponse.json()

    // Create the "Agency Zen" root folder in Google Drive
    const createFolderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Agency Zen',
        mimeType: 'application/vnd.google-apps.folder',
      }),
    })

    const folderData = await createFolderResponse.json()

    if (folderData.error) {
      console.error('Folder creation error:', folderData)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create Drive folder' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Initialize Supabase client with service role for admin operations
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

    // Get the user ID from the Authorization header
    const authHeader = req.headers.get('Authorization')
    let userId = null

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: userError } = await supabase.auth.getUser(token)
      if (user) {
        userId = user.id
      }
    }

    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + (expires_in * 1000)).toISOString()

    // Check if settings already exist
    const { data: existingSettings } = await supabase
      .from('google_drive_settings')
      .select('id')
      .single()

    if (existingSettings) {
      // Update existing settings
      const { error: updateError } = await supabase
        .from('google_drive_settings')
        .update({
          access_token,
          refresh_token,
          token_expiry: tokenExpiry,
          root_folder_id: folderData.id,
          connected_email: userInfo.email,
          is_connected: true,
          connected_at: new Date().toISOString(),
          connected_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSettings.id)

      if (updateError) {
        console.error('Update error:', updateError)
        throw updateError
      }
    } else {
      // Insert new settings
      const { error: insertError } = await supabase
        .from('google_drive_settings')
        .insert({
          access_token,
          refresh_token,
          token_expiry: tokenExpiry,
          root_folder_id: folderData.id,
          connected_email: userInfo.email,
          is_connected: true,
          connected_at: new Date().toISOString(),
          connected_by: userId,
        })

      if (insertError) {
        console.error('Insert error:', insertError)
        throw insertError
      }
    }

    return new Response(
      JSON.stringify({ success: true, email: userInfo.email, folderId: folderData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
