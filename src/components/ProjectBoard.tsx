
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar, MessageSquare, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ProjectDetail } from '@/components/ProjectDetail';
import { useState } from 'react';

interface ProjectBoardProps {
  workspaceId: string;
  onProjectClick?: (projectId: string, projectTitle: string) => void;
  onProjectMessageClick?: (projectId: string, projectTitle: string) => void;
}

export const ProjectBoard = ({ workspaceId, onProjectClick, onProjectMessageClick }: ProjectBoardProps) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [isProjectDetailOpen, setIsProjectDetailOpen] = useState(false);
  
  const [projects, setProjects] = useState([
    {
      id: '1',
      title: 'Q4 Social Media Campaign',
      dueDate: '2024-07-15',
      team: ['JD', 'SM', 'KL'],
      priority: 'High',
      tasks: { completed: 13, total: 20 },
      workspace: 'TechCorp Inc.',
      notes: 'Focus on Instagram and LinkedIn campaigns with emphasis on brand consistency.'
    },
    {
      id: '2',
      title: 'Brand Identity Redesign',
      dueDate: '2024-07-10',
      team: ['AM', 'RK'],
      priority: 'Medium',
      tasks: { completed: 17, total: 20 },
      workspace: 'TechCorp Inc.',
      notes: 'Complete rebrand including logo, colors, and typography guidelines.'
    },
    {
      id: '3',
      title: 'Website Launch Campaign',
      dueDate: '2024-07-25',
      team: ['JD', 'SM', 'TW', 'RK'],
      priority: 'High',
      tasks: { completed: 5, total: 20 },
      workspace: 'TechCorp Inc.',
      notes: 'Coordinate with development team for launch timeline and marketing materials.'
    }
  ]);

  // Mock data for current user and unread messages/due tasks
  const currentUser = 'JD';
  const userUnreadMessages = { '1': true, '2': false, '3': true }; // project id -> user has unread
  const userDueTasks = { '1': 3, '2': 0, '3': 1 }; // project id -> user's due tasks count

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-orange-100 text-orange-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProgress = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const handleProjectClick = (project) => {
    if (onProjectClick) {
      onProjectClick(project.id, project.title);
    }
  };

  const handleEditProject = (e, project) => {
    e.stopPropagation(); // Prevent the card click event
    const progress = calculateProgress(project.tasks.completed, project.tasks.total);
    const projectWithProgress = { ...project, progress };
    setSelectedProject(projectWithProgress);
    setIsProjectDetailOpen(true);
  };

  const handleSaveProject = (updatedProject) => {
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const handleMessageClick = (e, project) => {
    e.stopPropagation();
    if (onProjectMessageClick) {
      onProjectMessageClick(project.id, project.title);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const progress = calculateProgress(project.tasks.completed, project.tasks.total);
          
          return (
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
                      <DropdownMenuItem onClick={(e) => handleEditProject(e, project)}>
                        Edit Project
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
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
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
                  <div className="flex items-center space-x-2">
                    {/* Message icon with blue dot for user's unread messages */}
                    <div 
                      className="relative cursor-pointer"
                      onClick={(e) => handleMessageClick(e, project)}
                    >
                      <MessageSquare className="w-4 h-4 text-gray-500 hover:text-blue-500" />
                      {userUnreadMessages[project.id] && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    
                    {/* User's due tasks indicator */}
                    {userDueTasks[project.id] > 0 && (
                      <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {userDueTasks[project.id]}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ProjectDetail
        project={selectedProject}
        open={isProjectDetailOpen}
        onOpenChange={setIsProjectDetailOpen}
        onSave={handleSaveProject}
      />
    </>
  );
};
