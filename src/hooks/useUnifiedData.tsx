
import { useState, useEffect, useMemo } from 'react';
import { 
  WORKSPACES, 
  PROJECTS, 
  MOCK_TASKS, 
  MOCK_USERS,
  getWorkspaceById,
  getProjectById,
  getProjectsByWorkspace,
  getTasksByWorkspace,
  getTasksByProject,
  getUserById,
  WORKSPACE_ID_TO_NAME,
  WORKSPACE_NAME_TO_ID
} from '@/constants/data';
import { Workspace, Project, Task, User } from '@/types';

export const useUnifiedData = () => {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [users] = useState<User[]>(MOCK_USERS);

  // Workspace helpers
  const getWorkspace = (identifier: string) => {
    return getWorkspaceById(identifier) || WORKSPACES.find(w => w.name === identifier);
  };

  // Project helpers
  const getProject = (identifier: string) => {
    return getProjectById(identifier) || PROJECTS.find(p => p.title === identifier);
  };

  // Get projects for a workspace (by ID or name)
  const getWorkspaceProjects = (workspaceIdentifier: string) => {
    const workspace = getWorkspace(workspaceIdentifier);
    return workspace ? getProjectsByWorkspace(workspace.id) : [];
  };

  // Get tasks for a workspace (by ID or name)
  const getWorkspaceTasks = (workspaceIdentifier: string) => {
    const workspace = getWorkspace(workspaceIdentifier);
    return workspace ? getTasksByWorkspace(workspace.id) : [];
  };

  // Get tasks for a project (by ID or title)
  const getProjectTasks = (projectIdentifier: string) => {
    const project = getProject(projectIdentifier);
    return project ? getTasksByProject(project.id) : [];
  };

  // Get user by ID or email
  const getUser = (identifier: string) => {
    return getUserById(identifier) || users.find(u => u.email === identifier);
  };

  // Task management
  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, ...updates, updated_at: new Date().toISOString() }
          : task
      )
    );
  };

  // Get task counts for workspaces
  const getWorkspaceTaskCounts = useMemo(() => {
    return WORKSPACES.reduce((acc, workspace) => {
      const workspaceTasks = getTasksByWorkspace(workspace.id);
      acc[workspace.id] = {
        total: workspaceTasks.length,
        active: workspaceTasks.filter(t => !t.completed).length,
        completed: workspaceTasks.filter(t => t.completed).length,
        overdue: workspaceTasks.filter(t => !t.completed && t.due_date < new Date().toISOString().split('T')[0]).length
      };
      return acc;
    }, {} as Record<string, { total: number; active: number; completed: number; overdue: number }>);
  }, [tasks]);

  // Get user's assigned tasks across all workspaces
  const getUserTasks = (userId: string) => {
    return tasks.filter(task => task.assignee_id === userId);
  };

  // Mapping helpers for thread compatibility
  const mapWorkspaceIdToName = (id: string) => WORKSPACE_ID_TO_NAME[id] || id;
  const mapWorkspaceNameToId = (name: string) => WORKSPACE_NAME_TO_ID[name] || name;

  return {
    // Data
    workspaces: WORKSPACES,
    projects: PROJECTS,
    tasks,
    users,
    
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
    updateTask,
    
    // Mapping helpers
    mapWorkspaceIdToName,
    mapWorkspaceNameToId
  };
};
