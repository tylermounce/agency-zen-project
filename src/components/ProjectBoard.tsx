
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar, MessageSquare, MoreHorizontal, Trash2, ListTodo } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ProjectDetailDialog } from '@/components/ProjectDetailDialog';
import { useProjectMembers } from '@/hooks/useProjectMembers';
import { useState } from 'react';
import { useUnifiedData } from '@/hooks/useUnifiedData';
import { useAuth } from '@/contexts/AuthContext';
import { formatters } from '@/lib/timezone';
import { Project } from '@/types';

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
    deleteProject,
    loading
  } = useUnifiedData();
  
  const workspaceProjects = getWorkspaceProjects(workspaceId);
  
  // Calculate task counts for each project
  const ProjectCard = ({ project }: { project: Project }) => {
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
        onClick={() => handleCardClick(project)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{project.title}</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={(e) => handleDeleteProject(e, project)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Project
                </DropdownMenuItem>
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
              <span>Created {formatters.dateOnly(project.created_at)}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-sm text-gray-600 hover:text-blue-600"
              onClick={(e) => handleViewTasks(e, project)}
            >
              <ListTodo className="w-4 h-4 mr-1" />
              {completedTasks}/{totalTasks} tasks
            </Button>
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


  // Card click opens edit dialog
  const handleCardClick = (project) => {
    setSelectedProject(project);
    setIsProjectDetailOpen(true);
  };

  // View tasks button navigates to filtered tasks view
  const handleViewTasks = (e, project) => {
    e.stopPropagation();
    if (onProjectClick) {
      onProjectClick(project.id, project.title);
    }
  };

  // Delete project with confirmation
  const handleDeleteProject = async (e, project) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${project.title}"? This will also delete all tasks in this project.`)) {
      try {
        await deleteProject(project.id);
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const handleSaveProject = (updatedProject) => {
    updateProject(updatedProject.id, {
      title: updatedProject.title,
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
