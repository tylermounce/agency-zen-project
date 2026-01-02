-- Fix RLS policies for messages and conversations tables
-- Addresses security warnings about missing workspace membership verification

-- ============================================
-- FIX MESSAGES SELECT POLICY
-- ============================================
-- Drop existing policy
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;

-- Create improved policy that checks workspace membership
-- For messages with a workspace_id, verify user is a member of that workspace
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.thread_id = messages.thread_id
      AND auth.uid()::text = ANY(c.participants)
    )
    AND (
      -- If no workspace_id, allow (DMs don't have workspaces)
      messages.workspace_id IS NULL
      OR
      -- If workspace_id exists, verify user is a member of that workspace
      EXISTS (
        SELECT 1 FROM public.workspace_members wm
        JOIN public.workspaces w ON w.id = wm.workspace_id
        WHERE w.name = messages.workspace_id
        AND wm.user_id = auth.uid()
      )
    )
  );

-- ============================================
-- FIX MESSAGES INSERT POLICY
-- ============================================
-- Drop existing policy
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;

-- Create improved policy that also checks workspace membership
CREATE POLICY "Users can insert messages in their conversations"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.thread_id = messages.thread_id
      AND auth.uid()::text = ANY(c.participants)
    )
    AND (
      -- If no workspace_id, allow (DMs)
      messages.workspace_id IS NULL
      OR
      -- If workspace_id exists, verify user is a member
      EXISTS (
        SELECT 1 FROM public.workspace_members wm
        JOIN public.workspaces w ON w.id = wm.workspace_id
        WHERE w.name = messages.workspace_id
        AND wm.user_id = auth.uid()
      )
    )
  );

-- ============================================
-- FIX CONVERSATIONS INSERT POLICY
-- ============================================
-- Drop existing policy
DROP POLICY IF EXISTS "Users can create conversations they participate in" ON public.conversations;

-- Create improved policy that validates workspace membership
CREATE POLICY "Users can create conversations they participate in"
  ON public.conversations
  FOR INSERT
  WITH CHECK (
    -- User must be in participants
    auth.uid()::text = ANY(participants)
    AND (
      -- If no workspace_id, allow (DMs don't require workspace membership)
      workspace_id IS NULL
      OR
      -- If workspace_id is set, verify user is a member of that workspace
      EXISTS (
        SELECT 1 FROM public.workspace_members wm
        JOIN public.workspaces w ON w.id = wm.workspace_id
        WHERE w.name = conversations.workspace_id
        AND wm.user_id = auth.uid()
      )
    )
  );

-- ============================================
-- FIX CONVERSATIONS SELECT POLICY
-- ============================================
-- Drop existing policy
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;

-- Create improved policy that also checks workspace membership for workspace conversations
CREATE POLICY "Users can view their conversations"
  ON public.conversations
  FOR SELECT
  USING (
    auth.uid()::text = ANY(participants)
    AND (
      -- If no workspace_id, allow (DMs)
      workspace_id IS NULL
      OR
      -- If workspace_id exists, verify user is a member of that workspace
      EXISTS (
        SELECT 1 FROM public.workspace_members wm
        JOIN public.workspaces w ON w.id = wm.workspace_id
        WHERE w.name = conversations.workspace_id
        AND wm.user_id = auth.uid()
      )
    )
  );

-- ============================================
-- FIX CONVERSATIONS UPDATE POLICY
-- ============================================
-- Drop existing policy
DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;

-- Create improved policy
CREATE POLICY "Users can update their conversations"
  ON public.conversations
  FOR UPDATE
  USING (
    auth.uid()::text = ANY(participants)
    AND (
      workspace_id IS NULL
      OR
      EXISTS (
        SELECT 1 FROM public.workspace_members wm
        JOIN public.workspaces w ON w.id = wm.workspace_id
        WHERE w.name = conversations.workspace_id
        AND wm.user_id = auth.uid()
      )
    )
  );

-- Add comment explaining the security model
COMMENT ON POLICY "Users can view messages in their conversations" ON public.messages IS
  'Users can only view messages if they are in the conversation participants AND are a member of the workspace (for workspace messages)';

COMMENT ON POLICY "Users can create conversations they participate in" ON public.conversations IS
  'Users can only create conversations if they are in the participants AND are a member of the workspace (for workspace conversations)';
