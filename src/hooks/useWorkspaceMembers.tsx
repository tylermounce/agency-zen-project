import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export const useWorkspaceMembers = () => {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all workspace members
  const fetchAllMembers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('workspace_members')
        .select('*')
        .order('created_at');
      
      if (error) throw error;
      
      setMembers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workspace members');
    } finally {
      setLoading(false);
    }
  };

  // Get members for a specific workspace
  const getWorkspaceMembers = async (workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at');
      
      if (error) throw error;
      
      return data || [];
    } catch (err) {
      throw err;
    }
  };

  // Add a member to a workspace
  const addWorkspaceMember = async (workspaceId: string, userId: string, role: string = 'member') => {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .insert([{
          workspace_id: workspaceId,
          user_id: userId,
          role
        }])
        .select()
        .single();

      if (error) throw error;
      
      setMembers(prev => [...prev, data]);
      return data;
    } catch (err) {
      throw err;
    }
  };

  // Remove a member from a workspace
  const removeWorkspaceMember = async (workspaceId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId);

      if (error) throw error;
      
      setMembers(prev => prev.filter(member => 
        !(member.workspace_id === workspaceId && member.user_id === userId)
      ));
    } catch (err) {
      throw err;
    }
  };

  // Update a member's role in a workspace
  const updateWorkspaceMemberRole = async (workspaceId: string, userId: string, newRole: string) => {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .update({ role: newRole })
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      
      setMembers(prev => prev.map(member => 
        member.workspace_id === workspaceId && member.user_id === userId 
          ? data 
          : member
      ));
      
      return data;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchAllMembers();
  }, []);

  return {
    members,
    loading,
    error,
    getWorkspaceMembers,
    addWorkspaceMember,
    removeWorkspaceMember,
    updateWorkspaceMemberRole,
    refetch: fetchAllMembers
  };
};