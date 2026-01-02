import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, Project, Workspace } from '@/types';
import { toast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useSupabaseData = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const channelId = useRef(`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const tasksChannelRef = useRef<RealtimeChannel | null>(null);
  const projectsChannelRef = useRef<RealtimeChannel | null>(null);
  const workspacesChannelRef = useRef<RealtimeChannel | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
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
      toast({
        title: "Error loading data",
        description: err instanceof Error ? err.message : 'Failed to fetch data',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

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
      toast({
        title: "Workspace created",
        description: `"${workspace.name}" has been created successfully.`,
      });
      return data;
    } catch (err) {
      console.error('Error creating workspace:', err);
      toast({
        title: "Failed to create workspace",
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: "destructive",
      });
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
      toast({
        title: "Project created",
        description: `"${project.title}" has been created successfully.`,
      });
      return data;
    } catch (err) {
      console.error('Error creating project:', err);
      toast({
        title: "Failed to create project",
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: "destructive",
      });
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
      toast({
        title: "Task created",
        description: `"${task.title}" has been added.`,
      });
      return data;
    } catch (err) {
      console.error('Error creating task:', err);
      toast({
        title: "Failed to create task",
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: "destructive",
      });
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
      toast({
        title: "Task updated",
        description: "Changes saved successfully.",
      });
      return data;
    } catch (err) {
      console.error('Error updating task:', err);
      toast({
        title: "Failed to update task",
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: "destructive",
      });
      throw err;
    }
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== taskId));
      toast({
        title: "Task deleted",
        description: "The task has been removed.",
      });
    } catch (err) {
      console.error('Error deleting task:', err);
      toast({
        title: "Failed to delete task",
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: "destructive",
      });
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
      toast({
        title: "Project updated",
        description: "Changes saved successfully.",
      });
      return data;
    } catch (err) {
      console.error('Error updating project:', err);
      toast({
        title: "Failed to update project",
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: "destructive",
      });
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
      toast({
        title: "Workspace updated",
        description: "Changes saved successfully.",
      });
      return data;
    } catch (err) {
      console.error('Error updating workspace:', err);
      toast({
        title: "Failed to update workspace",
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: "destructive",
      });
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
      toast({
        title: "Workspace deleted",
        description: "The workspace has been removed.",
      });
    } catch (err) {
      console.error('Error deleting workspace:', err);
      toast({
        title: "Failed to delete workspace",
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: "destructive",
      });
      throw err;
    }
  };

  // Initial fetch - only run once on mount
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time subscriptions for live updates
  useEffect(() => {
    // Clean up any existing channels first
    if (tasksChannelRef.current) {
      supabase.removeChannel(tasksChannelRef.current);
    }
    if (projectsChannelRef.current) {
      supabase.removeChannel(projectsChannelRef.current);
    }
    if (workspacesChannelRef.current) {
      supabase.removeChannel(workspacesChannelRef.current);
    }

    // Subscribe to task changes with unique channel name
    const tasksChannel = supabase
      .channel(`tasks-realtime-${channelId.current}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => {
              if (prev.some(t => t.id === (payload.new as Task).id)) return prev;
              return [...prev, payload.new as Task];
            });
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t =>
              t.id === (payload.new as Task).id ? payload.new as Task : t
            ));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== (payload.old as Task).id));
          }
        }
      )
      .subscribe();
    
    tasksChannelRef.current = tasksChannel;

    // Subscribe to project changes with unique channel name
    const projectsChannel = supabase
      .channel(`projects-realtime-${channelId.current}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setProjects(prev => {
              if (prev.some(p => p.id === (payload.new as Project).id)) return prev;
              return [...prev, payload.new as Project];
            });
          } else if (payload.eventType === 'UPDATE') {
            setProjects(prev => prev.map(p =>
              p.id === (payload.new as Project).id ? payload.new as Project : p
            ));
          } else if (payload.eventType === 'DELETE') {
            setProjects(prev => prev.filter(p => p.id !== (payload.old as Project).id));
          }
        }
      )
      .subscribe();
    
    projectsChannelRef.current = projectsChannel;

    // Subscribe to workspace changes with unique channel name
    const workspacesChannel = supabase
      .channel(`workspaces-realtime-${channelId.current}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workspaces' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setWorkspaces(prev => {
              if (prev.some(w => w.id === (payload.new as Workspace).id)) return prev;
              return [...prev, payload.new as Workspace];
            });
          } else if (payload.eventType === 'UPDATE') {
            setWorkspaces(prev => prev.map(w =>
              w.id === (payload.new as Workspace).id ? payload.new as Workspace : w
            ));
          } else if (payload.eventType === 'DELETE') {
            setWorkspaces(prev => prev.filter(w => w.id !== (payload.old as Workspace).id));
          }
        }
      )
      .subscribe();
    
    workspacesChannelRef.current = workspacesChannel;

    return () => {
      if (tasksChannelRef.current) {
        supabase.removeChannel(tasksChannelRef.current);
        tasksChannelRef.current = null;
      }
      if (projectsChannelRef.current) {
        supabase.removeChannel(projectsChannelRef.current);
        projectsChannelRef.current = null;
      }
      if (workspacesChannelRef.current) {
        supabase.removeChannel(workspacesChannelRef.current);
        workspacesChannelRef.current = null;
      }
    };
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
    deleteTask,
    updateProject,
    updateWorkspace,
    deleteWorkspace,
    refetch: fetchData
  };
};
