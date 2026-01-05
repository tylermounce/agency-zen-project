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
    const { userIdToDelete } = await req.json()

    if (!userIdToDelete) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: requestingUser }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !requestingUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Check if requesting user is an admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .eq('role', 'admin')
      .single()

    if (!roles) {
      return new Response(
        JSON.stringify({ success: false, error: 'Only admins can delete users' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Prevent self-deletion
    if (userIdToDelete === requestingUser.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'You cannot delete your own account' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Delete related data first (in order of dependencies)
    // We need to clean up ALL tables that reference this user

    // 1. Delete channel messages by this user
    await supabase
      .from('channel_messages')
      .delete()
      .eq('user_id', userIdToDelete)

    // 2. Delete message attachments uploaded by this user
    await supabase
      .from('message_attachments')
      .delete()
      .eq('uploaded_by', userIdToDelete)

    // 3. Delete task comments by this user
    await supabase
      .from('task_comments')
      .delete()
      .eq('user_id', userIdToDelete)

    // 4. Delete file attachments uploaded by this user
    await supabase
      .from('file_attachments')
      .delete()
      .eq('uploaded_by', userIdToDelete)

    // 5. Unassign tasks from this user (don't delete the tasks, just remove assignment)
    await supabase
      .from('tasks')
      .update({ assignee_id: null })
      .eq('assignee_id', userIdToDelete)

    // 6. Delete project memberships
    await supabase
      .from('project_members')
      .delete()
      .eq('user_id', userIdToDelete)

    // 7. Delete workspace memberships
    await supabase
      .from('workspace_members')
      .delete()
      .eq('user_id', userIdToDelete)

    // 8. Delete user roles
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userIdToDelete)

    // 9. Delete Google Drive settings if this user connected them
    await supabase
      .from('google_drive_settings')
      .delete()
      .eq('user_id', userIdToDelete)

    // 10. Delete profile LAST (before auth.users)
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userIdToDelete)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
      // Continue anyway - we still want to try deleting auth user
    }

    // 11. Finally, delete from auth.users (requires service role)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userIdToDelete)

    if (deleteError) {
      console.error('Error deleting auth user:', deleteError)
      return new Response(
        JSON.stringify({ success: false, error: deleteError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
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
