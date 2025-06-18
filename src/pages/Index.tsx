
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, MessageSquare, Calendar, CheckSquare, User } from 'lucide-react';
import { ProjectBoard } from '@/components/ProjectBoard';
import { TaskList } from '@/components/TaskList';
import { MessagingPanel } from '@/components/MessagingPanel';
import { WorkspaceSelector } from '@/components/WorkspaceSelector';
import { ProjectTemplates } from '@/components/ProjectTemplates';
import { MyTasks } from '@/components/MyTasks';

const Index = () => {
  const [selectedWorkspace, setSelectedWorkspace] = useState('client-1');
  const [activeTab, setActiveTab] = useState('projects');
  const [showMyTasks, setShowMyTasks] = useState(false);

  const workspaces = [
    { id: 'client-1', name: 'TechCorp Inc.', color: 'bg-blue-500', tasks: 24 },
    { id: 'client-2', name: 'Fashion Forward', color: 'bg-purple-500', tasks: 18 },
    { id: 'client-3', name: 'Green Energy Co.', color: 'bg-green-500', tasks: 32 },
    { id: 'internal', name: 'Internal Projects', color: 'bg-orange-500', tasks: 12 }
  ];

  const currentWorkspace = workspaces.find(w => w.id === selectedWorkspace);

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
              <Button variant="outline" size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Messages
              </Button>
              <Avatar className="w-8 h-8">
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
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
              workspaces={workspaces}
              selectedWorkspace={selectedWorkspace}
              onWorkspaceChange={setSelectedWorkspace}
            />
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={() => setShowMyTasks(true)}>
              <User className="w-4 h-4 mr-2" />
              My Tasks
            </Button>
            <Button variant="outline" size="sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </Button>
            <Avatar className="w-8 h-8">
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
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
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-96">
            <TabsTrigger value="projects" className="flex items-center">
              <CheckSquare className="w-4 h-4 mr-2" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            <ProjectBoard workspaceId={selectedWorkspace} />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <TaskList workspaceId={selectedWorkspace} />
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <MessagingPanel workspaceId={selectedWorkspace} />
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <ProjectTemplates />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
