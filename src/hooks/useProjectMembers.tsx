import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProjectMember } from '@/types';

export const useProjectMembers = (projectId?: string) => {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error('Error fetching project members:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const addMember = async (userId: string) => {
    if (!projectId) return;
    
    try {
      const { error } = await supabase
        .from('project_members')
        .insert([{ project_id: projectId, user_id: userId }]);

      if (error) throw error;
      await fetchMembers();
    } catch (err) {
      console.error('Error adding project member:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const removeMember = async (userId: string) => {
    if (!projectId) return;
    
    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);

      if (error) throw error;
      await fetchMembers();
    } catch (err) {
      console.error('Error removing project member:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [projectId]);

  return {
    members,
    loading,
    error,
    addMember,
    removeMember,
    refetch: fetchMembers,
  };
};