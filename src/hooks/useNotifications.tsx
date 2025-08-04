import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  user_id: string;
  message_id: string | null;
  content: string;
  sender_name: string;
  thread_id: string;
  thread_type: string;
  workspace_id: string | null;
  is_read: boolean;
  notification_type: string;
  created_at: string;
}

export const useNotifications = (workspaceId?: string) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications for the current user
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Filter by workspace if specified
      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setNotifications(data || []);
      
      // Count unread notifications
      const unreadNotifications = (data || []).filter(n => !n.is_read);
      setUnreadCount(unreadNotifications.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, workspaceId]);

  // Mark a notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      // Filter by workspace if specified
      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { error } = await query;

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user, workspaceId]);

  // Delete a notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [notifications]);

  // Get notifications by type
  const getNotificationsByType = useCallback((type: string) => {
    return notifications.filter(n => n.notification_type === type);
  }, [notifications]);

  // Get unread notifications
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => !n.is_read);
  }, [notifications]);

  // Keep legacy functions for compatibility
  const markThreadAsRead = useCallback(async (threadId: string) => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('thread_id', threadId)
        .eq('is_read', false);

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { error } = await query;

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.thread_id === threadId && !n.is_read 
            ? { ...n, is_read: true } 
            : n
        )
      );
      
      // Recalculate unread count
      setUnreadCount(prev => {
        const threadUnreadCount = notifications.filter(
          n => n.thread_id === threadId && !n.is_read
        ).length;
        return Math.max(0, prev - threadUnreadCount);
      });
    } catch (error) {
      console.error('Error marking thread notifications as read:', error);
    }
  }, [user, workspaceId, notifications]);

  const getUnreadCountForThread = useCallback((threadId: string) => {
    return notifications.filter(n => n.thread_id === threadId && !n.is_read).length;
  }, [notifications]);

  const hasUnreadInThread = useCallback((threadId: string) => {
    return notifications.some(n => n.thread_id === threadId && !n.is_read);
  }, [notifications]);

  // Subscribe to real-time notification updates
  useEffect(() => {
    if (!user) return;

    const notificationsChannel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Notification change:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as Notification;
            
            // Only add if it matches the current workspace filter
            if (!workspaceId || newNotification.workspace_id === workspaceId) {
              setNotifications(prev => [newNotification, ...prev]);
              if (!newNotification.is_read) {
                setUnreadCount(prev => prev + 1);
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotification = payload.new as Notification;
            setNotifications(prev => 
              prev.map(n => 
                n.id === updatedNotification.id ? updatedNotification : n
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            const deletedNotification = notifications.find(n => n.id === deletedId);
            setNotifications(prev => prev.filter(n => n.id !== deletedId));
            
            if (deletedNotification && !deletedNotification.is_read) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
    };
  }, [user, workspaceId, notifications]);

  // Fetch notifications on mount and when dependencies change
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationsByType,
    getUnreadNotifications,
    markThreadAsRead,
    getUnreadCountForThread,
    hasUnreadInThread
  };
};