import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  thread_type: string;
  thread_id: string;
  workspace_id: string | null;
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<{ [threadId: string]: Message[] }>({});
  const [loading, setLoading] = useState(false);

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

  const fetchMessages = async (threadId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setMessages(prev => ({
        ...prev,
        [threadId]: data || []
      }));
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const sendMessage = async (content: string, threadType: string, threadId: string, workspaceId?: string) => {
    if (!user || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          content: content.trim(),
          thread_type: threadType,
          thread_id: threadId,
          workspace_id: workspaceId || null
        });

      if (error) throw error;

      // Update conversation last message time
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('thread_id', threadId);

      // Refresh messages for this thread and conversations list
      await fetchMessages(threadId);
      await fetchConversations();
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

    const conversationsChannel = supabase
      .channel('conversations-changes')
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

    return () => {
      supabase.removeChannel(conversationsChannel);
    };
  }, [user]);

  // Subscribe to real-time updates for messages
  useEffect(() => {
    if (!user) return;

    const messagesChannel = supabase
      .channel('messages-changes')
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

    return () => {
      supabase.removeChannel(messagesChannel);
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
    fetchMessages,
    sendMessage,
    createConversation,
    fetchConversations,
    findExistingProjectConversation,
    getProjectThreadId
  };
};
