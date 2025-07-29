
export interface Workspace {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  workspace_id: string;
  status: 'active' | 'completed' | 'on-hold' | 'archived';
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  project_id: string | null;
  workspace_id: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee_id: string;
  due_date: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  initials: string;
  avatar_url?: string;
}

export interface MessageThread {
  id: string;
  thread_id: string;
  thread_type: 'dm' | 'project' | 'channel';
  title: string;
  workspace_id?: string;
  project_id?: string;
  participants: string[];
  last_message_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}
