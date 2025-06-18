import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar, Users, MessageSquare, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ProjectBoardProps {
  workspaceId: string;
  onProjectClick?: (projectId: string, projectTitle: string) => void;
  onNewMessage?: (projectId: string, projectTitle: string, teamMembers: string[]) => void;
}

export const ProjectBoard = ({ workspaceId, onProjectClick, onNewMessage }: ProjectBoardProps) => {
  const projects = [
    {
      id: '1',
      title: 'Q4 Social Media Campaign',
      status: 'In Progress',
      progress: 65,
      dueDate: '2024-07-15',
      team: ['JD', 'SM', 'KL'],
      priority: 'High',
      tasks: { completed: 13, total: 20 }
    },
    {
      id: '2',
      title: 'Brand Identity Redesign',
      status: 'Review',
      progress: 85,
      dueDate: '2024-07-10',
      team: ['AM', 'RK'],
      priority: 'Medium',
      tasks: { completed: 17, total: 20 }
    },
    {
      id: '3',
      title: 'Website Launch Campaign',
      status: 'Planning',
      progress: 25,
      dueDate: '2024-07-25',
      team: ['JD', 'SM', 'TW', 'RK'],
      priority: 'High',
      tasks: { completed: 5, total: 20 }
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Review': return 'bg-yellow-100 text-yellow-800';
      case 'Planning': return 'bg-gray-100 text-gray-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-orange-100 text-orange-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleProjectClick = (project) => {
    if (onProjectClick) {
      onProjectClick(project.id, project.title);
    }
  };

  const handleNewMessage = (project) => {
    if (onNewMessage) {
      onNewMessage(project.id, project.title, project.team);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Card 
          key={project.id} 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => handleProjectClick(project)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-lg">{project.title}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                  <Badge variant="outline" className={getPriorityColor(project.priority)}>
                    {project.priority}
                  </Badge>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>View Details</DropdownMenuItem>
                  <DropdownMenuItem>Edit Project</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNewMessage(project)}>
                    New Message
                  </DropdownMenuItem>
                  <DropdownMenuItem>Archive</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2" />
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Due {new Date(project.dueDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>{project.tasks.completed}/{project.tasks.total} tasks</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {project.team.map((member, index) => (
                  <Avatar key={index} className="w-6 h-6 border-2 border-white">
                    <AvatarFallback className="text-xs">{member}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <Button variant="ghost" size="sm">
                <MessageSquare className="w-4 h-4 mr-1" />
                12
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
