import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, Project, Workspace } from '@/types';

export const useSupabaseData = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch workspaces
      const { data: workspacesData, error: workspacesError } = await supabase
        .from('workspaces')
        .select('*')
        .order('name');
      
      if (workspacesError) throw workspacesError;

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('title');
      
      if (projectsError) throw projectsError;

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at');
      
      if (tasksError) throw tasksError;

      setWorkspaces(workspacesData || []);
      setProjects(projectsData as Project[] || []);
      setTasks(tasksData as Task[] || []);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Create workspace
  const createWorkspace = async (workspace: Omit<Workspace, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .insert([workspace])
        .select()
        .single();

      if (error) throw error;
      
      setWorkspaces(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error creating workspace:', err);
      throw err;
    }
  };

  // Create project
  const createProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([project])
        .select()
        .single();

      if (error) throw error;
      
      setProjects(prev => [...prev, data as Project]);
      return data;
    } catch (err) {
      console.error('Error creating project:', err);
      throw err;
    }
  };

  // Create task
  const createTask = async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([task])
        .select()
        .single();

      if (error) throw error;
      
      setTasks(prev => [...prev, data as Task]);
      return data;
    } catch (err) {
      console.error('Error creating task:', err);
      throw err;
    }
  };

  // Update task
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      
      setTasks(prev => prev.map(task => task.id === taskId ? data as Task : task));
      return data;
    } catch (err) {
      console.error('Error updating task:', err);
      throw err;
    }
  };

  // Update project
  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;
      
      setProjects(prev => prev.map(project => project.id === projectId ? data as Project : project));
      return data;
    } catch (err) {
      console.error('Error updating project:', err);
      throw err;
    }
  };

  // Update workspace
  const updateWorkspace = async (workspaceId: string, updates: Partial<Workspace>) => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .update(updates)
        .eq('id', workspaceId)
        .select()
        .single();

      if (error) throw error;
      
      setWorkspaces(prev => prev.map(workspace => workspace.id === workspaceId ? data : workspace));
      return data;
    } catch (err) {
      console.error('Error updating workspace:', err);
      throw err;
    }
  };

  // Delete workspace
  const deleteWorkspace = async (workspaceId: string) => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspaceId);

      if (error) throw error;
      
      setWorkspaces(prev => prev.filter(workspace => workspace.id !== workspaceId));
    } catch (err) {
      console.error('Error deleting workspace:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    workspaces,
    projects,
    tasks,
    loading,
    error,
    createWorkspace,
    createProject,
    createTask,
    updateTask,
    updateProject,
    updateWorkspace,
    deleteWorkspace,
    refetch: fetchData
  };
};