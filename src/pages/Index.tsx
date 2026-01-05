
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Users, MessageSquare, Calendar, CheckSquare, User, Hash, Inbox, LogOut, Settings as SettingsIcon, FolderOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProjectBoard } from '@/components/ProjectBoard';
import { TaskList } from '@/components/TaskList';
import { MessagingPanel } from '@/components/MessagingPanel';

import { ProjectTemplates } from '@/components/ProjectTemplates';
import { MyTasks } from '@/components/MyTasks';
import { ChannelDiscussion } from '@/components/ChannelDiscussion';
import { MasterInbox } from '@/components/MasterInbox';
import { WorkspaceFiles } from '@/components/WorkspaceFiles';
import { useAuth } from '@/contexts/AuthContext';
import { useUnifiedData } from '@/hooks/useUnifiedData';
import { useUsers } from '@/hooks/useUsers';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { WorkspacesSidebar } from '@/components/WorkspacesSidebar';

const Index = () => {
  const { user, signOut } = useAuth();
  const { workspaces, getWorkspaceTaskCounts, createProject } = useUnifiedData();
  const { users } = useUsers();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [activeTab, setActiveTab] = useState('channel');
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [showMasterInbox, setShowMasterInbox] = useState(false);
  const [projectFilter, setProjectFilter] = useState('');
  const [selectedProjectThread, setSelectedProjectThread] = useState('');
  const [newProjectDialog, setNewProjectDialog] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectDueDate, setNewProjectDueDate] = useState('');
  const [newProjectPriority, setNewProjectPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newProjectMembers, setNewProjectMembers] = useState<string[]>([]);

  // Handle workspace change - navigate to channel tab
  const handleWorkspaceChange = (workspaceId: string) => {
    setSelectedWorkspace(workspaceId);
    setActiveTab('channel');
    setProjectFilter(''); // Clear any project filter
  };

  // Get task counts using unified data
  const taskCounts = getWorkspaceTaskCounts;
  
  // Map workspaces with updated task counts (filter out archived workspaces)
  const workspacesWithCounts = workspaces
    .filter(workspace => !(workspace as any).is_archived)
    .map(workspace => ({
      ...workspace,
      tasks: taskCounts[workspace.id]?.active || 0
    }));

  // Auto-select first workspace if none selected and workspaces are available
  useEffect(() => {
    if (!selectedWorkspace && workspacesWithCounts.length > 0) {
      setSelectedWorkspace(workspacesWithCounts[0].id);
    }
  }, [selectedWorkspace, workspacesWithCounts]);

  const currentWorkspace = workspacesWithCounts.find(w => w.id === selectedWorkspace);

  // Don't render main content if no workspace is selected
  if (!selectedWorkspace || !currentWorkspace) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Please select a workspace to continue</h2>
          {workspacesWithCounts.length === 0 && (
            <p className="text-gray-600">No workspaces available. Please contact your administrator.</p>
          )}
        </div>
      </div>
    );
  }

  const handleProjectClick = (projectId: string, projectTitle: string) => {
    setProjectFilter(projectTitle);
    setActiveTab('tasks');
  };

  const handleProjectMessageClick = (projectId: string, projectTitle: string) => {
    setSelectedProjectThread(projectTitle); // Use project title for thread identification
    setActiveTab('messages');
  };

  const handleCreateProject = async () => {
    if (!newProjectTitle.trim() || !selectedWorkspace) return;
    
    try {
      await createProject({
        title: newProjectTitle,
        description: newProjectDescription,
        workspace_id: selectedWorkspace,
        status: 'active',
        priority: newProjectPriority,
        due_date: newProjectDueDate || null,
        notes: newProjectDescription
      });
      
      setNewProjectDialog(false);
      setNewProjectTitle('');
      setNewProjectDescription('');
      setNewProjectDueDate('');
      setNewProjectPriority('medium');
      setNewProjectMembers([]);
    } catch (error) {
      // Error creating project - could add user notification here
    }
  };

  const toggleProjectMember = (userId: string) => {
    setNewProjectMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getUserInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  if (showMasterInbox) {
    return <MasterInbox userId={getUserInitials(user?.email || '')} onBack={() => setShowMasterInbox(false)} />;
  }

  if (showMyTasks) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header for My Tasks */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button variant="ghost" onClick={() => setShowMyTasks(false)} size="sm">
                ← Back
              </Button>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">My Tasks</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Mobile: Only user avatar */}
              <div className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="w-8 h-8 cursor-pointer">
                      <AvatarFallback>{getUserInitials(user?.email || '')}</AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => setShowMasterInbox(true)}>
                      <Inbox className="w-4 h-4 mr-2" />
                      Master Inbox
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <SettingsIcon className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {/* Desktop: Master Inbox button + user avatar */}
              <div className="hidden sm:flex items-center space-x-3">
                <Button variant="outline" size="sm" onClick={() => setShowMasterInbox(true)}>
                  <Inbox className="w-4 h-4 mr-2" />
                  Master Inbox
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="w-8 h-8 cursor-pointer">
                      <AvatarFallback>{getUserInitials(user?.email || '')}</AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <SettingsIcon className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* My Tasks Content */}
        <div className="px-4 sm:px-6 py-6">
          <MyTasks />
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <WorkspacesSidebar
        workspaces={workspacesWithCounts}
        selectedWorkspace={selectedWorkspace}
        onWorkspaceChange={handleWorkspaceChange}
      />
      <SidebarInset>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <SidebarTrigger className="mr-1" />
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Agency Ops</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Mobile: Only user avatar */}
              <div className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="w-8 h-8 cursor-pointer">
                      <AvatarFallback>{getUserInitials(user?.email || '')}</AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => setShowMyTasks(true)}>
                      <User className="w-4 h-4 mr-2" />
                      My Tasks
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowMasterInbox(true)}>
                      <Inbox className="w-4 h-4 mr-2" />
                      Master Inbox
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <SettingsIcon className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {/* Desktop: My Tasks + Master Inbox buttons + user avatar */}
              <div className="hidden sm:flex items-center space-x-3">
                <Button variant="outline" size="sm" onClick={() => setShowMyTasks(true)}>
                  <User className="w-4 h-4 mr-2" />
                  My Tasks
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowMasterInbox(true)}>
                  <Inbox className="w-4 h-4 mr-2" />
                  Master Inbox
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="w-8 h-8 cursor-pointer">
                      <AvatarFallback>{getUserInitials(user?.email || '')}</AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <SettingsIcon className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${currentWorkspace?.color}`}></div>
              <h2 className="text-lg font-medium text-gray-900">{currentWorkspace?.name}</h2>
              <Badge variant="secondary">{currentWorkspace?.tasks} active tasks</Badge>
            </div>
            {isAdmin && (
              <Dialog open={newProjectDialog} onOpenChange={setNewProjectDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="project-title">Project Title</Label>
                      <Input
                        id="project-title"
                        value={newProjectTitle}
                        onChange={(e) => setNewProjectTitle(e.target.value)}
                        placeholder="Enter project title..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="project-description">Description</Label>
                      <Textarea
                        id="project-description"
                        value={newProjectDescription}
                        onChange={(e) => setNewProjectDescription(e.target.value)}
                        placeholder="Enter project description..."
                        className="min-h-[100px]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="project-due-date">Due Date</Label>
                        <Input
                          id="project-due-date"
                          type="date"
                          value={newProjectDueDate}
                          onChange={(e) => setNewProjectDueDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="project-priority">Priority</Label>
                        <Select value={newProjectPriority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewProjectPriority(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Team Members</Label>
                      <div className="grid grid-cols-2 gap-2 p-3 border rounded-md max-h-40 overflow-y-auto">
                        {users.map((user) => (
                          <div key={user.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={user.id}
                              checked={newProjectMembers.includes(user.id)}
                              onChange={() => toggleProjectMember(user.id)}
                              className="rounded"
                            />
                            <Label htmlFor={user.id} className="text-sm font-medium">
                              {user.full_name || user.email}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setNewProjectDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateProject} disabled={!newProjectTitle.trim()}>
                        Create Project
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-6' : 'grid-cols-4'} lg:w-auto`}>
              <TabsTrigger value="channel" className="flex items-center">
                <Hash className="w-4 h-4 mr-2" />
                Channel
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="projects" className="flex items-center">
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Projects
                </TabsTrigger>
              )}
              <TabsTrigger value="tasks" className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                Messages
              </TabsTrigger>
              <TabsTrigger value="files" className="flex items-center">
                <FolderOpen className="w-4 h-4 mr-2" />
                Files
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="templates" className="flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Templates
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="channel" className="space-y-6">
              <ChannelDiscussion workspaceId={selectedWorkspace} />
            </TabsContent>

            {isAdmin && (
              <TabsContent value="projects" className="space-y-6">
                <ProjectBoard 
                  workspaceId={selectedWorkspace}
                  onProjectClick={handleProjectClick}
                  onProjectMessageClick={handleProjectMessageClick}
                />
              </TabsContent>
            )}

            <TabsContent value="tasks" className="space-y-6">
              <TaskList 
                workspaceId={selectedWorkspace}
                projectFilter={projectFilter}
                onClearProjectFilter={() => setProjectFilter('')}
              />
            </TabsContent>

            <TabsContent value="messages" className="space-y-6">
              <MessagingPanel
                workspaceId={selectedWorkspace}
                selectedProjectThread={selectedProjectThread}
              />
            </TabsContent>

            <TabsContent value="files" className="space-y-6">
              <WorkspaceFiles workspaceId={selectedWorkspace} />
            </TabsContent>

            {isAdmin && (
              <TabsContent value="templates" className="space-y-6">
                <ProjectTemplates workspaceId={selectedWorkspace} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Index;
