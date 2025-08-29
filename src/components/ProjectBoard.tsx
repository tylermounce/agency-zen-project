
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar, MessageSquare, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ProjectDetailDialog } from '@/components/ProjectDetailDialog';
import { useProjectMembers } from '@/hooks/useProjectMembers';
import { useState } from 'react';
import { useUnifiedData } from '@/hooks/useUnifiedData';
import { useAuth } from '@/contexts/AuthContext';
import { formatters } from '@/lib/timezone';

interface ProjectBoardProps {
  workspaceId: string;
  onProjectClick?: (projectId: string, projectTitle: string) => void;
  onProjectMessageClick?: (projectId: string, projectTitle: string) => void;
}

export const ProjectBoard = ({ workspaceId, onProjectClick, onProjectMessageClick }: ProjectBoardProps) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [isProjectDetailOpen, setIsProjectDetailOpen] = useState(false);
  const { user } = useAuth();
  const { 
    getWorkspaceProjects, 
    getProjectTasks, 
    users, 
    projects, 
    updateProject,
    loading 
  } = useUnifiedData();
  
  const workspaceProjects = getWorkspaceProjects(workspaceId);
  
  // Calculate task counts for each project  
  const ProjectCard = ({ project }: { project: any }) => {
    const { members } = useProjectMembers(project.id);
    const projectTasks = getProjectTasks(project.id);
    const completedTasks = projectTasks.filter(task => task.completed).length;
    const totalTasks = projectTasks.length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Get team member initials from actual project members
    const teamInitials = members.map(member => {
      const user = users.find(u => u.id === member.user_id);
      return user?.initials || user?.full_name?.substring(0, 2).toUpperCase() || 'UN';
    });

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
                  {formatPriority(project.priority)}
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
              <span>
                {project.due_date 
                  ? `Due ${formatters.dateOnly(project.due_date)}`
                  : `Created ${formatters.dateOnly(project.created_at)}`
                }
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <span>{completedTasks}/{totalTasks} tasks</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {teamInitials.map((initials, index) => (
                <Avatar key={index} className="w-6 h-6 border-2 border-white">
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className="relative cursor-pointer"
                onClick={(e) => handleMessageClick(e, project)}
              >
                <MessageSquare className="w-4 h-4 text-gray-500 hover:text-blue-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Mock data for current user and unread messages/due tasks (until messaging is implemented)
  const currentUser = user?.email?.substring(0, 2).toUpperCase() || 'UN';
  const userUnreadMessages = {}; // Will be populated when messaging is implemented
  const userDueTasks = {}; // Will be populated based on actual user tasks

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPriority = (priority?: string) => {
    if (!priority) return 'Medium';
    return priority.charAt(0).toUpperCase() + priority.slice(1);
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
    setSelectedProject(project);
    setIsProjectDetailOpen(true);
  };

  const handleSaveProject = (updatedProject) => {
    updateProject(updatedProject.id, {
      title: updatedProject.title,
      description: updatedProject.description,
      due_date: updatedProject.due_date,
      priority: updatedProject.priority,
      notes: updatedProject.notes
    });
  };

  const handleMessageClick = (e, project) => {
    e.stopPropagation();
    if (onProjectMessageClick) {
      onProjectMessageClick(project.id, project.title);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading projects...</div>;
  }

  if (workspaceProjects.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No projects found for this workspace.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workspaceProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      <ProjectDetailDialog
        project={selectedProject}
        open={isProjectDetailOpen}
        onOpenChange={setIsProjectDetailOpen}
        onSave={handleSaveProject}
      />
    </>
  );
};
