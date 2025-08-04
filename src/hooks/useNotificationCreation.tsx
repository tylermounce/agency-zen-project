import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useNotificationCreation = () => {
  const { user } = useAuth();

  const createMentionNotifications = useCallback(async (
    mentionedUserIds: string[],
    content: string,
    threadId: string,
    threadType: string,
    messageId: string,
    workspaceId?: string
  ) => {
    if (!user || !mentionedUserIds.length) return;

    try {
      // Create notifications for mentioned users (including self-mentions)
      for (const userId of mentionedUserIds) {
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            message_id: messageId, // Use actual message ID
            content: `${user.email || 'Someone'} mentioned you: ${content.substring(0, 100)}...`,
            sender_name: user.email || 'Unknown',
            thread_id: threadId,
            thread_type: threadType,
            workspace_id: workspaceId,
            is_read: false
          });
      }
    } catch (error) {
      console.error('Error creating mention notifications:', error);
    }
  }, [user]);

  return { createMentionNotifications };
};