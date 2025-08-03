import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  user_id: string;
  message_id: string;
  thread_id: string;
  thread_type: string;
  content: string;
  sender_name: string;
  is_read: boolean;
  created_at: string;
  workspace_id?: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch notifications for current user
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create notification for mentioned users
  const createMentionNotification = useCallback(async (
    mentionedUserIds: string[],
    messageId: string,
    threadId: string,
    threadType: string,
    content: string,
    senderName: string,
    workspaceId?: string
  ) => {
    if (!user || mentionedUserIds.length === 0) return;

    try {
      const notifications = mentionedUserIds.map(userId => ({
        user_id: userId,
        message_id: messageId,
        thread_id: threadId,
        thread_type: threadType,
        content: content.substring(0, 200), // Truncate content
        sender_name: senderName,
        workspace_id: workspaceId,
        is_read: false
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating mention notifications:', error);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user]);

  // Extract mentioned user IDs from message content
  const extractMentionedUsers = useCallback((content: string, allUsers: any[]) => {
    const mentionRegex = /@([^@\s]+)/g;
    const mentions = [...content.matchAll(mentionRegex)];
    
    return mentions
      .map(match => {
        const mentionedName = match[1].trim();
        return allUsers.find(user => 
          user.full_name?.toLowerCase().includes(mentionedName.toLowerCase())
        );
      })
      .filter(Boolean)
      .map(user => user.id);
  }, []);

  // Set up real-time subscription for notifications
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    createMentionNotification,
    markAsRead,
    markAllAsRead,
    extractMentionedUsers
  };
};