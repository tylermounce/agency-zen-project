
import { useMemo } from 'react';
import { Task, Project, Workspace, User } from '@/types';
import { useUsers } from './useUsers';
import { useSupabaseData } from './useSupabaseData';

export const useUnifiedData = () => {
  const { users, loading: usersLoading, error: usersError } = useUsers();
  const { 
    workspaces, 
    projects, 
    tasks, 
    loading: dataLoading, 
    error: dataError,
    createWorkspace,
    createProject,
    createTask,
    updateTask,
    deleteTask,
    updateProject,
    updateWorkspace,
    deleteWorkspace,
    refetch
  } = useSupabaseData();

  // Workspace helpers
  const getWorkspace = (identifier: string) => {
    return workspaces.find(w => w.id === identifier || w.name === identifier);
  };

  // Project helpers
  const getProject = (identifier: string) => {
    return projects.find(p => p.id === identifier || p.title === identifier);
  };

  // Get projects for a workspace (by ID or name)
  const getWorkspaceProjects = (workspaceIdentifier: string) => {
    const workspace = getWorkspace(workspaceIdentifier);
    return workspace ? projects.filter(p => p.workspace_id === workspace.id) : [];
  };

  // Get tasks for a workspace (by ID or name)
  const getWorkspaceTasks = (workspaceIdentifier: string) => {
    const workspace = getWorkspace(workspaceIdentifier);
    return workspace ? tasks.filter(t => t.workspace_id === workspace.id) : [];
  };

  // Get tasks for a project (by ID or title)
  const getProjectTasks = (projectIdentifier: string) => {
    const project = getProject(projectIdentifier);
    return project ? tasks.filter(t => t.project_id === project.id) : [];
  };

  // Get user by ID or email
  const getUser = (identifier: string) => {
    return users.find(u => u.id === identifier || u.email === identifier);
  };

  // Task management (now uses Supabase)
  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    console.log('useUnifiedData handleUpdateTask called');
    console.log('Task ID:', taskId);
    console.log('Updates:', updates);
    try {
      await updateTask(taskId, updates);
      console.log('Task update successful');
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    console.log('useUnifiedData handleDeleteTask called');
    console.log('Task ID:', taskId);
    try {
      await deleteTask(taskId);
      console.log('Task delete successful');
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  };

  // Get task counts for workspaces
  const getWorkspaceTaskCounts = useMemo(() => {
    return workspaces.reduce((acc, workspace) => {
      const workspaceTasks = tasks.filter(t => t.workspace_id === workspace.id);
      acc[workspace.id] = {
        total: workspaceTasks.length,
        active: workspaceTasks.filter(t => !t.completed).length,
        completed: workspaceTasks.filter(t => t.completed).length,
        overdue: workspaceTasks.filter(t => !t.completed && t.due_date < new Date().toISOString().split('T')[0]).length
      };
      return acc;
    }, {} as Record<string, { total: number; active: number; completed: number; overdue: number }>);
  }, [tasks, workspaces]);

  // Get user's assigned tasks across all workspaces
  const getUserTasks = (userId: string) => {
    return tasks.filter(task => task.assignee_id === userId);
  };

  // Mapping helpers for thread compatibility
  const mapWorkspaceIdToName = (id: string) => {
    const workspace = workspaces.find(w => w.id === id);
    return workspace?.name || id;
  };
  const mapWorkspaceNameToId = (name: string) => {
    const workspace = workspaces.find(w => w.name === name);
    return workspace?.id || name;
  };

  return {
    // Data
    workspaces,
    projects,
    tasks,
    users,
    loading: dataLoading || usersLoading,
    error: dataError || usersError,
    
    // Getters
    getWorkspace,
    getProject,
    getUser,
    getWorkspaceProjects,
    getWorkspaceTasks,
    getProjectTasks,
    getUserTasks,
    getWorkspaceTaskCounts,
    
    // Actions
    updateTask: handleUpdateTask,
    deleteTask: handleDeleteTask,
    createWorkspace,
    createProject,
    createTask,
    updateProject,
    updateWorkspace,
    deleteWorkspace,
    refetch,
    
    // Mapping helpers
    mapWorkspaceIdToName,
    mapWorkspaceNameToId,
  };
};
