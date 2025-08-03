import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useNotificationCreation = () => {
  const { user } = useAuth();

  const createMentionNotifications = useCallback(async (
    content: string,
    threadId: string,
    threadType: string,
    workspaceId?: string
  ) => {
    if (!user) return;

    // Extract mentioned usernames from content
    const mentionPattern = /@([^@\s]+)/g;
    const mentions = content.match(mentionPattern);
    
    if (!mentions || mentions.length === 0) return;

    try {
      // Get profiles for mentioned users
      const mentionedNames = mentions.map(mention => mention.substring(1)); // Remove @ symbol
      
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('full_name', mentionedNames);

      if (profileError) {
        console.error('Error fetching mentioned user profiles:', profileError);
        return;
      }

      // Create notifications for mentioned users
      for (const profile of profiles || []) {
        if (profile.id === user.id) continue; // Don't notify self

        await supabase
          .from('notifications')
          .insert({
            user_id: profile.id,
            message_id: crypto.randomUUID(), // Placeholder for now
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