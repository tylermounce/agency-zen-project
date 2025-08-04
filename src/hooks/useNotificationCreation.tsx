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

      // Create notifications for mentioned users
      const notifications = mentionedUserIds.map(userId => ({
        user_id: userId,
        message_id: messageId, // Use the actual message ID
        content: `${senderName} mentioned you: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
        sender_name: senderName,
        thread_id: threadId,
        thread_type: threadType,
        workspace_id: workspaceId || null,
        is_read: false,
        notification_type: 'mention' // Add a type field for filtering
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) {
        console.error('Error creating mention notifications:', error);
        throw error;
      }

      console.log(`Created ${notifications.length} mention notifications`);
    } catch (error) {
      console.error('Error creating mention notifications:', error);
      throw error;
    }
  }, [user]);

  // Helper function to create other types of notifications
  const createNotification = useCallback(async (
    userId: string,
    content: string,
    threadId: string,
    threadType: string,
    messageId?: string,
    workspaceId?: string,
    notificationType: string = 'message'
  ) => {
    if (!user) return;

    try {
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const senderName = senderProfile?.full_name || user.email || 'Someone';

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          message_id: messageId || null,
          content,
          sender_name: senderName,
          thread_id: threadId,
          thread_type: threadType,
          workspace_id: workspaceId || null,
          is_read: false,
          notification_type: notificationType
        });

      if (error) {
        console.error('Error creating notification:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }, [user]);

  return { 
    createMentionNotifications,
    createNotification 
  };
};