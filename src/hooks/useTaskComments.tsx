import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface TaskCommentWithUser extends TaskComment {
  user_name?: string;
  user_initials?: string;
}

export const useTaskComments = (taskId: string | null) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<TaskCommentWithUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscribedRef = useRef(false);

  // Fetch comments for a task
  const fetchComments = useCallback(async () => {
    if (!taskId || !user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await (supabase
        .from('task_comments' as any)
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true }) as any);

      if (fetchError) throw fetchError;

      const typedData = (data || []) as TaskComment[];

      // Fetch user profiles for the comments
      const userIds = [...new Set(typedData.map(c => c.user_id))];

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        const commentsWithUsers: TaskCommentWithUser[] = typedData.map(comment => {
          const profile = profileMap.get(comment.user_id);
          const fullName = profile?.full_name || profile?.email || 'Unknown User';
          const initials = fullName
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return {
            ...comment,
            user_name: fullName,
            user_initials: initials
          };
        });

        setComments(commentsWithUsers);
      } else {
        setComments([]);
      }
    } catch (err) {
      console.error('Error fetching task comments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  }, [taskId, user]);

  // Add a new comment
  const addComment = async (content: string): Promise<boolean> => {
    if (!taskId || !user || !content.trim()) return false;

    try {
      const { data, error: insertError } = await (supabase
        .from('task_comments' as any)
        .insert([{
          task_id: taskId,
          user_id: user.id,
          content: content.trim()
        }])
        .select()
        .single() as any);

      if (insertError) throw insertError;

      const typedData = data as TaskComment;
      
      // Add to local state with user info
      const newComment: TaskCommentWithUser = {
        ...typedData,
        user_name: user.email || 'You',
        user_initials: (user.email?.[0] || 'U').toUpperCase()
      };

      setComments(prev => [...prev, newComment]);
      return true;
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err instanceof Error ? err.message : 'Failed to add comment');
      return false;
    }
  };

  // Update a comment
  const updateComment = async (commentId: string, content: string): Promise<boolean> => {
    if (!user || !content.trim()) return false;

    try {
      const { error: updateError } = await (supabase
        .from('task_comments' as any)
        .update({ content: content.trim(), updated_at: new Date().toISOString() })
        .eq('id', commentId)
        .eq('user_id', user.id) as any);

      if (updateError) throw updateError;

      setComments(prev =>
        prev.map(c =>
          c.id === commentId
            ? { ...c, content: content.trim(), updated_at: new Date().toISOString() }
            : c
        )
      );
      return true;
    } catch (err) {
      console.error('Error updating comment:', err);
      setError(err instanceof Error ? err.message : 'Failed to update comment');
      return false;
    }
  };

  // Delete a comment
  const deleteComment = async (commentId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error: deleteError } = await (supabase
        .from('task_comments' as any)
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id) as any);

      if (deleteError) throw deleteError;

      setComments(prev => prev.filter(c => c.id !== commentId));
      return true;
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
      return false;
    }
  };

  // Fetch comments when taskId changes
  useEffect(() => {
    if (!taskId) {
      setComments([]);
      return;
    }
    fetchComments();
  }, [taskId, user?.id]);

  // Set up real-time subscription - separate effect to avoid re-subscription
  useEffect(() => {
    if (!taskId) return;

    // Create unique channel name with timestamp to avoid conflicts
    const channelName = `task_comments_${taskId}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newComment = payload.new as TaskComment;

            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', newComment.user_id)
              .single();

            const fullName = profile?.full_name || profile?.email || 'Unknown User';
            const initials = fullName
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            const commentWithUser: TaskCommentWithUser = {
              ...newComment,
              user_name: fullName,
              user_initials: initials
            };

            setComments(prev => {
              if (prev.some(c => c.id === newComment.id)) return prev;
              return [...prev, commentWithUser];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as TaskComment;
            setComments(prev =>
              prev.map(c => (c.id === updated.id ? { ...c, ...updated } : c))
            );
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as TaskComment;
            setComments(prev => prev.filter(c => c.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  return {
    comments,
    loading,
    error,
    addComment,
    updateComment,
    deleteComment,
    refetch: fetchComments
  };
};
