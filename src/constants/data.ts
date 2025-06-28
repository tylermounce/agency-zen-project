
import { Workspace, Project, Task } from '@/types';

export const WORKSPACES: Workspace[] = [
  {
    id: 'client-1',
    name: 'TechCorp Inc.',
    color: 'bg-blue-500',
    description: 'Technology consulting and development'
  },
  {
    id: 'client-2',
    name: 'Fashion Forward',
    color: 'bg-purple-500',
    description: 'Fashion brand and retail'
  },
  {
    id: 'client-3',
    name: 'Green Energy Co.',
    color: 'bg-green-500',
    description: 'Renewable energy solutions'
  },
  {
    id: 'internal',
    name: 'Internal Projects',
    color: 'bg-orange-500',
    description: 'Internal company projects'
  }
];

export const PROJECTS: Project[] = [
  {
    id: 'proj-1',
    title: 'Q4 Social Media Campaign',
    description: 'Social media campaign for Q4 sales boost',
    workspace_id: 'client-1',
    status: 'active',
    created_at: '2024-06-01T00:00:00Z',
    updated_at: '2024-06-28T00:00:00Z'
  },
  {
    id: 'proj-2',
    title: 'Website Launch Campaign',
    description: 'Marketing campaign for new website launch',
    workspace_id: 'client-1',
    status: 'active',
    created_at: '2024-06-15T00:00:00Z',
    updated_at: '2024-06-28T00:00:00Z'
  },
  {
    id: 'proj-3',
    title: 'Brand Identity Redesign',
    description: 'Complete brand identity overhaul',
    workspace_id: 'client-2',
    status: 'active',
    created_at: '2024-05-20T00:00:00Z',
    updated_at: '2024-06-28T00:00:00Z'
  },
  {
    id: 'proj-4',
    title: 'E-commerce Platform',
    description: 'Online store development',
    workspace_id: 'client-2',
    status: 'active',
    created_at: '2024-06-10T00:00:00Z',
    updated_at: '2024-06-28T00:00:00Z'
  },
  {
    id: 'proj-5',
    title: 'Sustainability Report',
    description: 'Annual sustainability reporting',
    workspace_id: 'client-3',
    status: 'active',
    created_at: '2024-06-05T00:00:00Z',
    updated_at: '2024-06-28T00:00:00Z'
  },
  {
    id: 'proj-6',
    title: 'Internal Tools Development',
    description: 'Development of internal productivity tools',
    workspace_id: 'internal',
    status: 'active',
    created_at: '2024-05-15T00:00:00Z',
    updated_at: '2024-06-28T00:00:00Z'
  }
];

export const MOCK_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Design Instagram post templates',
    description: 'Need to create 5 different templates following brand guidelines.',
    project_id: 'proj-1',
    workspace_id: 'client-1',
    status: 'todo',
    priority: 'high',
    assignee_id: 'user-1',
    due_date: '2024-07-05',
    completed: false,
    created_at: '2024-06-20T00:00:00Z',
    updated_at: '2024-06-20T00:00:00Z'
  },
  {
    id: 'task-2',
    title: 'Write blog post copy',
    description: 'Blog post for website launch announcement',
    project_id: 'proj-2',
    workspace_id: 'client-1',
    status: 'in-progress',
    priority: 'medium',
    assignee_id: 'user-2',
    due_date: new Date().toISOString().split('T')[0],
    completed: false,
    created_at: '2024-06-22T00:00:00Z',
    updated_at: '2024-06-25T00:00:00Z'
  },
  {
    id: 'task-3',
    title: 'Review brand guidelines',
    description: 'Final review of updated brand guidelines',
    project_id: 'proj-3',
    workspace_id: 'client-2',
    status: 'review',
    priority: 'low',
    assignee_id: 'user-3',
    due_date: '2024-07-15',
    completed: false,
    created_at: '2024-06-18T00:00:00Z',
    updated_at: '2024-06-26T00:00:00Z'
  },
  {
    id: 'task-4',
    title: 'Export final logo files',
    description: 'Export logo in all required formats',
    project_id: 'proj-3',
    workspace_id: 'client-2',
    status: 'done',
    priority: 'medium',
    assignee_id: 'user-4',
    due_date: '2024-07-05',
    completed: true,
    created_at: '2024-06-16T00:00:00Z',
    updated_at: '2024-06-27T00:00:00Z'
  },
  {
    id: 'task-5',
    title: 'Setup e-commerce analytics',
    description: 'Configure tracking for online store',
    project_id: 'proj-4',
    workspace_id: 'client-2',
    status: 'todo',
    priority: 'high',
    assignee_id: 'user-1',
    due_date: '2024-07-10',
    completed: false,
    created_at: '2024-06-21T00:00:00Z',
    updated_at: '2024-06-21T00:00:00Z'
  },
  {
    id: 'task-6',
    title: 'Compile energy usage data',
    description: 'Gather data for sustainability report',
    project_id: 'proj-5',
    workspace_id: 'client-3',
    status: 'in-progress',
    priority: 'medium',
    assignee_id: 'user-2',
    due_date: '2024-07-20',
    completed: false,
    created_at: '2024-06-19T00:00:00Z',
    updated_at: '2024-06-24T00:00:00Z'
  },
  {
    id: 'task-7',
    title: 'Code review automation tool',
    description: 'Develop automated code review system',
    project_id: 'proj-6',
    workspace_id: 'internal',
    status: 'in-progress',
    priority: 'high',
    assignee_id: 'user-3',
    due_date: '2024-07-08',
    completed: false,
    created_at: '2024-06-17T00:00:00Z',
    updated_at: '2024-06-27T00:00:00Z'
  }
];

export const MOCK_USERS = [
  { id: 'user-1', initials: 'JD', full_name: 'John Doe', email: 'john@example.com' },
  { id: 'user-2', initials: 'SM', full_name: 'Sarah Miller', email: 'sarah@example.com' },
  { id: 'user-3', initials: 'AM', full_name: 'Alex Morgan', email: 'alex@example.com' },
  { id: 'user-4', initials: 'RK', full_name: 'Rachel Kim', email: 'rachel@example.com' },
  { id: 'user-5', initials: 'KL', full_name: 'Kevin Lee', email: 'kevin@example.com' },
  { id: 'user-6', initials: 'TW', full_name: 'Taylor White', email: 'taylor@example.com' }
];

// Helper functions for mapping
export const getWorkspaceById = (id: string) => WORKSPACES.find(w => w.id === id);
export const getWorkspaceByName = (name: string) => WORKSPACES.find(w => w.name === name);
export const getProjectById = (id: string) => PROJECTS.find(p => p.id === id);
export const getProjectsByWorkspace = (workspaceId: string) => PROJECTS.filter(p => p.workspace_id === workspaceId);
export const getTaskById = (id: string) => MOCK_TASKS.find(t => t.id === id);
export const getTasksByProject = (projectId: string) => MOCK_TASKS.filter(t => t.project_id === projectId);
export const getTasksByWorkspace = (workspaceId: string) => MOCK_TASKS.filter(t => t.workspace_id === workspaceId);
export const getUserById = (id: string) => MOCK_USERS.find(u => u.id === id);

// Workspace name mapping for backward compatibility
export const WORKSPACE_ID_TO_NAME = Object.fromEntries(
  WORKSPACES.map(w => [w.id, w.name])
);

export const WORKSPACE_NAME_TO_ID = Object.fromEntries(
  WORKSPACES.map(w => [w.name, w.id])
);
