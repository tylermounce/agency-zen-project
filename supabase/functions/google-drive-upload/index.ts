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
    const { fileName, fileType, fileSize, fileData, workspaceId, taskId, commentId } = await req.json()

    if (!fileName || !fileData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing file data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

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

    // Determine the parent folder
    let parentFolderId = driveSettings.root_folder_id

    // If there's a workspace, get or create its folder
    if (workspaceId) {
      const { data: workspaceFolder } = await supabase
        .from('workspace_drive_folders')
        .select('drive_folder_id')
        .eq('workspace_id', workspaceId)
        .single()

      if (workspaceFolder) {
        parentFolderId = workspaceFolder.drive_folder_id
      } else {
        // Get workspace name
        const { data: workspace } = await supabase
          .from('workspaces')
          .select('name')
          .eq('id', workspaceId)
          .single()

        if (workspace) {
          // Create folder in Drive
          const createFolderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: workspace.name,
              mimeType: 'application/vnd.google-apps.folder',
              parents: [driveSettings.root_folder_id],
            }),
          })

          const folderData = await createFolderResponse.json()

          if (!folderData.error) {
            parentFolderId = folderData.id

            // Save the folder mapping
            await supabase
              .from('workspace_drive_folders')
              .insert({
                workspace_id: workspaceId,
                drive_folder_id: folderData.id,
                drive_folder_url: `https://drive.google.com/drive/folders/${folderData.id}`
              })
          }
        }
      }
    }

    // Convert base64 to binary
    const binaryData = Uint8Array.from(atob(fileData), c => c.charCodeAt(0))

    // Create multipart upload for Google Drive
    const boundary = 'agency_zen_upload_boundary'
    const metadata = {
      name: fileName,
      parents: [parentFolderId],
    }

    const multipartBody =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${fileType || 'application/octet-stream'}\r\n` +
      `Content-Transfer-Encoding: base64\r\n\r\n` +
      `${fileData}\r\n` +
      `--${boundary}--`

    // Upload to Google Drive
    const uploadResponse = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,thumbnailLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      }
    )

    const uploadData = await uploadResponse.json()

    if (uploadData.error) {
      console.error('Drive upload error:', uploadData)
      return new Response(
        JSON.stringify({ success: false, error: uploadData.error.message || 'Upload failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Save file attachment record
    const { data: attachment, error: attachmentError } = await supabase
      .from('file_attachments')
      .insert({
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        drive_file_id: uploadData.id,
        drive_file_url: uploadData.webViewLink || `https://drive.google.com/file/d/${uploadData.id}/view`,
        drive_thumbnail_url: uploadData.thumbnailLink,
        workspace_id: workspaceId || null,
        task_id: taskId || null,
        comment_id: commentId || null,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (attachmentError) {
      console.error('Attachment save error:', attachmentError)
      throw attachmentError
    }

    return new Response(
      JSON.stringify({ success: true, attachment }),
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
