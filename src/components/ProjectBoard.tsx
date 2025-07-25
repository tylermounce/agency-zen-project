
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar, MessageSquare, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ProjectDetail } from '@/components/ProjectDetail';
import { useState } from 'react';
import { useUnifiedData } from '@/hooks/useUnifiedData';
import { useAuth } from '@/contexts/AuthContext';

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
  const projectsWithTasks = workspaceProjects.map(project => {
    const projectTasks = getProjectTasks(project.id);
    const completedTasks = projectTasks.filter(task => task.completed).length;
    const totalTasks = projectTasks.length;
    
    // Get team members assigned to tasks in this project
    const assigneeIds = [...new Set(projectTasks.map(task => task.assignee_id))];
    const teamMembers = assigneeIds.map(id => {
      const user = users.find(u => u.id === id);
      return user?.initials || 'UN';
    });
    
    return {
      ...project,
      tasks: { completed: completedTasks, total: totalTasks },
      team: teamMembers,
      priority: 'Medium', // Default priority since not in project schema
      notes: project.description || ''
    };
  });

  // Mock data for current user and unread messages/due tasks (until messaging is implemented)
  const currentUser = user?.email?.substring(0, 2).toUpperCase() || 'UN';
  const userUnreadMessages = {}; // Will be populated when messaging is implemented
  const userDueTasks = {}; // Will be populated based on actual user tasks

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
    updateProject(updatedProject.id, {
      title: updatedProject.title,
      description: updatedProject.notes
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

  if (projectsWithTasks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No projects found for this workspace.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projectsWithTasks.map((project) => {
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
                    <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
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
