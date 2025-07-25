
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Users, MessageSquare, Calendar, CheckSquare, User, Hash, Inbox, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { ProjectBoard } from '@/components/ProjectBoard';
import { TaskList } from '@/components/TaskList';
import { MessagingPanel } from '@/components/MessagingPanel';
import { RoleBasedWorkspaceSelector as WorkspaceSelector } from '@/components/RoleBasedWorkspaceSelector';
import { ProjectTemplates } from '@/components/ProjectTemplates';
import { MyTasks } from '@/components/MyTasks';
import { ChannelDiscussion } from '@/components/ChannelDiscussion';
import { MasterInbox } from '@/components/MasterInbox';
import { useAuth } from '@/contexts/AuthContext';
import { useUnifiedData } from '@/hooks/useUnifiedData';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { user, signOut } = useAuth();
  const { workspaces, getWorkspaceTaskCounts } = useUnifiedData();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const [selectedWorkspace, setSelectedWorkspace] = useState('client-1');
  const [activeTab, setActiveTab] = useState('channel');
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [showMasterInbox, setShowMasterInbox] = useState(false);
  const [projectFilter, setProjectFilter] = useState('');
  const [selectedProjectThread, setSelectedProjectThread] = useState('');

  // Get task counts using unified data
  const taskCounts = getWorkspaceTaskCounts;
  
  // Map workspaces with updated task counts
  const workspacesWithCounts = workspaces.map(workspace => ({
    ...workspace,
    tasks: taskCounts[workspace.id]?.active || 0
  }));

  const currentWorkspace = workspacesWithCounts.find(w => w.id === selectedWorkspace);

  const handleProjectClick = (projectId: string, projectTitle: string) => {
    setProjectFilter(projectTitle);
    setActiveTab('tasks');
  };

  const handleProjectMessageClick = (projectId: string, projectTitle: string) => {
    setSelectedProjectThread(projectTitle); // Use project title for thread identification
    setActiveTab('messages');
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
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setShowMyTasks(false)}>
                ← Back
              </Button>
              <h1 className="text-2xl font-semibold text-gray-900">My Tasks</h1>
            </div>
            <div className="flex items-center space-x-3">
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

        {/* My Tasks Content */}
        <div className="px-6 py-6">
          <MyTasks />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-semibold text-gray-900">Agency Ops</h1>
            <WorkspaceSelector 
              workspaces={workspacesWithCounts}
              selectedWorkspace={selectedWorkspace}
              onWorkspaceChange={setSelectedWorkspace}
            />
          </div>
          <div className="flex items-center space-x-3">
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

      {/* Workspace Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${currentWorkspace?.color}`}></div>
            <h2 className="text-lg font-medium text-gray-900">{currentWorkspace?.name}</h2>
            <Badge variant="secondary">{currentWorkspace?.tasks} active tasks</Badge>
          </div>
          {isAdmin && (
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : 'grid-cols-3'} lg:w-120`}>
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

          {isAdmin && (
            <TabsContent value="templates" className="space-y-6">
              <ProjectTemplates />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
