import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { folderId, workspaceId } = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the user from the auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Get Drive settings
    const { data: driveSettings, error: settingsError } = await supabase
      .from('google_drive_settings')
      .select('*')
      .single()

    if (settingsError || !driveSettings?.is_connected) {
      return new Response(
        JSON.stringify({ success: false, error: 'Google Drive not connected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check if token needs refresh
    let accessToken = driveSettings.access_token
    const tokenExpiry = new Date(driveSettings.token_expiry)

    if (tokenExpiry < new Date()) {
      // Refresh the token
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: clientSecret!,
          refresh_token: driveSettings.refresh_token,
          grant_type: 'refresh_token',
        }),
      })

      const refreshData = await refreshResponse.json()

      if (refreshData.error) {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to refresh token. Please reconnect Google Drive.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      accessToken = refreshData.access_token
      const newExpiry = new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString()

      // Update the token in database
      await supabase
        .from('google_drive_settings')
        .update({
          access_token: accessToken,
          token_expiry: newExpiry,
          updated_at: new Date().toISOString()
        })
        .eq('id', driveSettings.id)
    }

    // Determine which folder to list
    let targetFolderId = folderId

    if (!targetFolderId && workspaceId) {
      // Get the workspace's Drive folder
      const { data: workspaceFolder } = await supabase
        .from('workspace_drive_folders')
        .select('drive_folder_id')
        .eq('workspace_id', workspaceId)
        .single()

      if (workspaceFolder) {
        targetFolderId = workspaceFolder.drive_folder_id
      }
    }

    if (!targetFolderId) {
      // Fall back to root folder
      targetFolderId = driveSettings.root_folder_id
    }

    if (!targetFolderId) {
      return new Response(
        JSON.stringify({ success: false, error: 'No folder to list' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // List files in the folder using Google Drive API
    const query = `'${targetFolderId}' in parents and trashed = false`
    const fields = 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,thumbnailLink,iconLink)'

    const listResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&orderBy=folder,name`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    const listData = await listResponse.json()

    if (listData.error) {
      console.error('Drive list error:', listData)
      return new Response(
        JSON.stringify({ success: false, error: listData.error.message || 'Failed to list files' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Get folder info for breadcrumb
    const folderResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${targetFolderId}?fields=id,name,parents`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    const folderInfo = await folderResponse.json()

    // Transform files to a cleaner format
    const files = (listData.files || []).map((file: any) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      isFolder: file.mimeType === 'application/vnd.google-apps.folder',
      size: file.size ? parseInt(file.size) : null,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      webViewLink: file.webViewLink,
      thumbnailLink: file.thumbnailLink,
      iconLink: file.iconLink,
    }))

    return new Response(
      JSON.stringify({
        success: true,
        files,
        currentFolder: {
          id: folderInfo.id,
          name: folderInfo.name,
          parentId: folderInfo.parents?.[0] || null
        },
        rootFolderId: driveSettings.root_folder_id
      }),
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
