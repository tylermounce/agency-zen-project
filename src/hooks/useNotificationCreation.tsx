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
    messageId: string, // Now we receive the actual message ID
    workspaceId?: string
  ) => {
    if (!user || !mentionedUserIds.length) return;

    try {
      // Get sender's profile for better notification content
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const senderName = senderProfile?.full_name || user.email || 'Someone';

      // Create notifications for mentioned users using the secure function
      const createdNotifications = [];
      
      for (const userId of mentionedUserIds) {
        try {
          const { data, error } = await supabase.rpc('create_mention_notification', {
            target_user_id: userId,
            p_message_id: messageId,
            p_content: `${senderName} mentioned you: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
            p_sender_name: senderName,
            p_thread_id: threadId,
            p_thread_type: threadType,
            p_workspace_id: workspaceId || null
          });

          if (error) {
            console.error(`Error creating mention notification for user ${userId}:`, error);
            // Continue with other notifications even if one fails
            continue;
          }

          createdNotifications.push(data);
        } catch (error) {
          console.error(`Error creating mention notification for user ${userId}:`, error);
          // Continue with other notifications even if one fails
          continue;
        }
      }

      console.log(`Created ${createdNotifications.length} mention notifications`);
    } catch (error) {
      console.error('Error creating mention notifications:', error);
      throw error;
    }
  }, [user]);

  return { 
    createMentionNotifications
  };
};