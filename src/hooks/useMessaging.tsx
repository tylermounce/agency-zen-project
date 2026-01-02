import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMentionUtils } from '@/hooks/useMentionUtils';
import { useNotificationCreation } from '@/hooks/useNotificationCreation';
import { RealtimeChannel } from '@supabase/supabase-js';

const MESSAGE_PAGE_SIZE = 50;

interface ThreadPaginationState {
  hasMore: boolean;
  loading: boolean;
  oldestMessageDate: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  thread_type: string;
  thread_id: string;
  workspace_id: string | null;
  mentions: string[];
  created_at: string;
}

interface Conversation {
  id: string;
  thread_id: string;
  thread_type: string;
  title: string;
  workspace_id: string | null;
  participants: string[];
  last_message_at: string | null;
  created_at: string;
}

export const useMessaging = () => {
  const { user } = useAuth();
  const { extractMentionsFromContent } = useMentionUtils();
  const { createMentionNotifications } = useNotificationCreation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<{ [threadId: string]: Message[] }>({});
  const [loading, setLoading] = useState(false);
  const [threadPagination, setThreadPagination] = useState<{ [threadId: string]: ThreadPaginationState }>({});

  const channelId = useRef(`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const conversationsChannelRef = useRef<RealtimeChannel | null>(null);
  const messagesChannelRef = useRef<RealtimeChannel | null>(null);

  const fetchConversations = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Only fetch conversations where the current user is a participant
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', [user.id])
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = useCallback(async (threadId: string, reset: boolean = true) => {
    if (!user) return;

    // Set loading state for this thread
    setThreadPagination(prev => ({
      ...prev,
      [threadId]: {
        ...prev[threadId],
        loading: true
      }
    }));

    try {
      // Fetch the most recent messages first (descending), then reverse for display
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: false })
        .limit(MESSAGE_PAGE_SIZE);

      if (error) throw error;

      const messagesData = (data || []).reverse(); // Reverse to show oldest first
      const hasMore = data?.length === MESSAGE_PAGE_SIZE;
      const oldestMessage = data && data.length > 0 ? data[data.length - 1] : null;

      setMessages(prev => ({
        ...prev,
        [threadId]: messagesData
      }));

      setThreadPagination(prev => ({
        ...prev,
        [threadId]: {
          hasMore,
          loading: false,
          oldestMessageDate: oldestMessage?.created_at || null
        }
      }));
    } catch (err) {
      console.error('Error fetching messages:', err);
      setThreadPagination(prev => ({
        ...prev,
        [threadId]: {
          ...prev[threadId],
          loading: false
        }
      }));
    }
  }, [user]);

  const loadMoreMessages = useCallback(async (threadId: string) => {
    if (!user) return;

    const paginationState = threadPagination[threadId];
    if (!paginationState?.hasMore || paginationState?.loading || !paginationState?.oldestMessageDate) {
      return;
    }

    setThreadPagination(prev => ({
      ...prev,
      [threadId]: {
        ...prev[threadId],
        loading: true
      }
    }));

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .lt('created_at', paginationState.oldestMessageDate)
        .order('created_at', { ascending: false })
        .limit(MESSAGE_PAGE_SIZE);

      if (error) throw error;

      const olderMessages = (data || []).reverse();
      const hasMore = data?.length === MESSAGE_PAGE_SIZE;
      const oldestMessage = data && data.length > 0 ? data[data.length - 1] : null;

      setMessages(prev => ({
        ...prev,
        [threadId]: [...olderMessages, ...(prev[threadId] || [])]
      }));

      setThreadPagination(prev => ({
        ...prev,
        [threadId]: {
          hasMore,
          loading: false,
          oldestMessageDate: oldestMessage?.created_at || paginationState.oldestMessageDate
        }
      }));
    } catch (err) {
      console.error('Error loading more messages:', err);
      setThreadPagination(prev => ({
        ...prev,
        [threadId]: {
          ...prev[threadId],
          loading: false
        }
      }));
    }
  }, [user, threadPagination]);

  const sendMessage = async (content: string, threadType: string, threadId: string, workspaceId?: string) => {
    if (!user || !content.trim()) return;

    console.log('📤 sendMessage called with:', { content, threadType, threadId, workspaceId });

    try {
      // Extract mentioned user IDs from content
      const { mentionedUserIds } = await extractMentionsFromContent(content.trim());

      console.log('📤 Extracted mentions:', mentionedUserIds);

      // Insert the message and get the returned data (including the ID)
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          content: content.trim(),
          thread_type: threadType,
          thread_id: threadId,
          workspace_id: workspaceId || null,
          mentions: mentionedUserIds
        })
        .select()
        .single();

      if (messageError) throw messageError;

      console.log('📤 Message saved successfully:', messageData);

      // Create notifications for mentioned users using the actual message ID
      if (mentionedUserIds.length > 0 && messageData) {
        console.log('📤 Creating notifications for mentioned users:', mentionedUserIds);
        
        await createMentionNotifications(
          mentionedUserIds,
          content.trim(),
          threadId,
          threadType,
          messageData.id, // Pass the actual message ID
          workspaceId
        );
        
        console.log('📤 Notifications created successfully');
      } else {
        console.log('📤 No mentions to notify or no message data');
      }

      // Update conversation last message time
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('thread_id', threadId);

      // Refresh messages for this thread and conversations list
      await fetchMessages(threadId);
      await fetchConversations();
      
      // Return the message data and mentioned user IDs
      return { messageData, mentionedUserIds };
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  };

  const findExistingProjectConversation = async (projectTitle: string, workspaceId?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('thread_type', 'project')
        .eq('title', projectTitle)
        .eq('workspace_id', workspaceId || null)
        .contains('participants', [user.id])
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error finding existing project conversation:', err);
      return null;
    }
  };

  const createConversation = async (
    threadType: string,
    title: string,
    participants: string[],
    workspaceId?: string
  ) => {
    if (!user) return null;

    try {
      // For project threads, check if one already exists
      if (threadType === 'project' && title && workspaceId) {
        const existingConversation = await findExistingProjectConversation(title, workspaceId);
        if (existingConversation) {
          return existingConversation;
        }
      }

      const threadId = `${threadType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Ensure current user is included in participants
      const allParticipants = [...new Set([...participants, user.id])];
      
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          thread_id: threadId,
          thread_type: threadType,
          title,
          workspace_id: workspaceId || null,
          participants: allParticipants
        })
        .select()
        .single();

      if (error) throw error;

      await fetchConversations();
      return data;
    } catch (err) {
      console.error('Error creating conversation:', err);
      throw err;
    }
  };

  const getProjectThreadId = (projectTitle: string, workspaceId?: string) => {
    console.log('getProjectThreadId - looking for:', { projectTitle, workspaceId });
    console.log('getProjectThreadId - available conversations:', conversations);
    
    const projectConversation = conversations.find(
      c => c.thread_type === 'project' && 
           c.title === projectTitle && 
           c.workspace_id === workspaceId
    );
    
    console.log('getProjectThreadId - found conversation:', projectConversation);
    return projectConversation?.thread_id;
  };

  // Subscribe to real-time updates for conversations
  useEffect(() => {
    if (!user) return;

    // Clean up existing channel first
    if (conversationsChannelRef.current) {
      supabase.removeChannel(conversationsChannelRef.current);
    }

    const conversationsChannel = supabase
      .channel(`conversations-changes-${user.id}-${channelId.current}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `participants.cs.{${user.id}}`
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();
    
    conversationsChannelRef.current = conversationsChannel;

    return () => {
      if (conversationsChannelRef.current) {
        supabase.removeChannel(conversationsChannelRef.current);
        conversationsChannelRef.current = null;
      }
    };
  }, [user]);

  // Subscribe to real-time updates for messages
  useEffect(() => {
    if (!user) return;

    // Clean up existing channel first
    if (messagesChannelRef.current) {
      supabase.removeChannel(messagesChannelRef.current);
    }

    const messagesChannel = supabase
      .channel(`messages-changes-${user.id}-${channelId.current}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as Message;
          
          // Update messages state
          setMessages(prev => ({
            ...prev,
            [newMessage.thread_id]: [
              ...(prev[newMessage.thread_id] || []),
              newMessage
            ]
          }));
          
          // Refresh conversations to update last message time
          fetchConversations();
        }
      )
      .subscribe();
    
    messagesChannelRef.current = messagesChannel;

    return () => {
      if (messagesChannelRef.current) {
        supabase.removeChannel(messagesChannelRef.current);
        messagesChannelRef.current = null;
      }
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  return {
    conversations,
    messages,
    loading,
    threadPagination,
    fetchMessages,
    loadMoreMessages,
    sendMessage,
    createConversation,
    fetchConversations,
    findExistingProjectConversation,
    getProjectThreadId
  };
};
