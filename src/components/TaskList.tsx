
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, Filter, Plus, Calendar, User, X, ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TaskDetail } from '@/components/TaskDetail';
import { useUnifiedData } from '@/hooks/useUnifiedData';
import { useUsers } from '@/hooks/useUsers';
import { Task } from '@/types';

interface TaskListProps {
  workspaceId: string;
  projectFilter?: string;
  onClearProjectFilter?: () => void;
}

export const TaskList = ({ workspaceId, projectFilter, onClearProjectFilter }: TaskListProps) => {
  const { getWorkspaceTasks, getWorkspaceProjects, getUser, getProject, updateTask, createTask } = useUnifiedData();
  const { users } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  
  // New task dialog state
  const [newTaskDialog, setNewTaskDialog] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskProject, setNewTaskProject] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskStatus, setNewTaskStatus] = useState('todo');
  
  // Collapsible sections state
  const [overdueOpen, setOverdueOpen] = useState(true);
  const [todayOpen, setTodayOpen] = useState(true);
  const [upcomingOpen, setUpcomingOpen] = useState(true);
  const [completedOpen, setCompletedOpen] = useState(false);

  // Get workspace tasks and projects using unified data
  const workspaceTasks = getWorkspaceTasks(workspaceId);
  const workspaceProjects = getWorkspaceProjects(workspaceId);
  const projectNames = workspaceProjects.map(p => p.title);
  const assigneeIds = [...new Set(workspaceTasks.map(t => t.assignee_id))];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'done': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  };

  const handleTaskSave = (updatedTask: Task) => {
    updateTask(updatedTask.id, updatedTask);
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !newTaskAssignee) return;
    
    // Allow tasks without project (workspace tasks)
    const projectId = newTaskProject === "none" ? null : newTaskProject;

    try {
      await createTask({
        title: newTaskTitle,
        description: newTaskDescription,
        project_id: projectId,
        workspace_id: workspaceId,
        assignee_id: newTaskAssignee,
        due_date: newTaskDueDate,
        priority: newTaskPriority as 'low' | 'medium' | 'high',
        status: newTaskStatus as 'todo' | 'in-progress' | 'review' | 'done',
        completed: false
      });
      
      // Reset form
      setNewTaskDialog(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskProject('');
      setNewTaskAssignee('');
      setNewTaskDueDate(new Date().toISOString().split('T')[0]);
      setNewTaskPriority('medium');
      setNewTaskStatus('todo');
    } catch (error) {
      // Error creating task - could add user notification here
    }
  };

  // Filter tasks
  const filteredTasks = workspaceTasks.filter(task => {
    if (!showCompleted && task.completed) return false;
    
    const project = task.project_id ? getProject(task.project_id) : null;
    const projectTitle = project?.title || 'General Tasks';
    
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         projectTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesProject = (filterProject === 'all' || projectTitle === filterProject) && 
                          (!projectFilter || projectTitle === projectFilter);
    const matchesAssignee = filterAssignee === 'all' || task.assignee_id === filterAssignee;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesProject && matchesAssignee;
  });

  // Group tasks by date
  const today = new Date().toISOString().split('T')[0];
  const overdueTasks = filteredTasks.filter(task => !task.completed && task.due_date < today);
  const todayTasks = filteredTasks.filter(task => !task.completed && task.due_date === today);
  const upcomingTasks = filteredTasks.filter(task => !task.completed && task.due_date > today);
  const completedTasks = filteredTasks.filter(task => task.completed);

  const TaskItem = ({ task }: { task: Task }) => {
    const project = task.project_id ? getProject(task.project_id) : null;
    const assignee = getUser(task.assignee_id);
    
    return (
      <div 
        className="flex items-center space-x-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={() => handleTaskClick(task)}
      >
        <Checkbox
          checked={task.completed}
          className="mt-1"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
              {task.title}
            </h4>
            <Badge className={getStatusColor(task.status)} variant="secondary">
              {task.status.replace('-', ' ')}
            </Badge>
            <Badge className={getPriorityColor(task.priority)} variant="outline">
              {task.priority}
            </Badge>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className="truncate">{project?.title || 'General Tasks'}</span>
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date(task.due_date).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Avatar className="w-6 h-6">
            <AvatarFallback className="text-xs">{assignee?.initials || 'UN'}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters & Search
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCompleted(!showCompleted)}
              >
                {showCompleted ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showCompleted ? 'Hide Completed' : 'Show Completed'}
              </Button>
              {projectFilter && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>Project: {projectFilter}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={onClearProjectFilter}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger>
                <SelectValue placeholder="Project" />
              </SelectTrigger>
               <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="General Tasks">General Tasks</SelectItem>
                {projectNames.map((projectName) => (
                  <SelectItem key={projectName} value={projectName}>
                    {projectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterAssignee} onValueChange={setFilterAssignee}>
              <SelectTrigger>
                <SelectValue placeholder="Assigned To" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {assigneeIds.map((assigneeId) => {
                  const user = getUser(assigneeId);
                  return (
                    <SelectItem key={assigneeId} value={assigneeId}>
                      {user?.full_name || user?.initials || 'Unknown User'}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Dialog open={newTaskDialog} onOpenChange={setNewTaskDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="task-title">Task Title</Label>
                    <Input
                      id="task-title"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Enter task title..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="task-description">Description</Label>
                    <Textarea
                      id="task-description"
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      placeholder="Enter task description..."
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="task-project">Project</Label>
                      <Select value={newTaskProject} onValueChange={setNewTaskProject}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">General Tasks (No Project)</SelectItem>
                          {workspaceProjects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="task-assignee">Assignee</Label>
                      <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.full_name || user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="task-due-date">Due Date</Label>
                      <Input
                        id="task-due-date"
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="task-priority">Priority</Label>
                      <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
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
                    <div>
                      <Label htmlFor="task-status">Status</Label>
                      <Select value={newTaskStatus} onValueChange={setNewTaskStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setNewTaskDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTask} disabled={!newTaskTitle.trim() || !newTaskAssignee}>
                      Create Task
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Task Sections */}
      <Card>
        <CardHeader>
          <CardTitle>
            Tasks ({filteredTasks.length})
            {projectFilter && ` - ${projectFilter}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overdue Tasks */}
          {overdueTasks.length > 0 && (
            <Collapsible open={overdueOpen} onOpenChange={setOverdueOpen}>
              <CollapsibleTrigger className="flex items-center space-x-2 w-full p-2 rounded-lg hover:bg-gray-50 text-left">
                {overdueOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span className="font-medium text-red-600">Overdue ({overdueTasks.length})</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {overdueTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Today Tasks */}
          {todayTasks.length > 0 && (
            <Collapsible open={todayOpen} onOpenChange={setTodayOpen}>
              <CollapsibleTrigger className="flex items-center space-x-2 w-full p-2 rounded-lg hover:bg-gray-50 text-left">
                {todayOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span className="font-medium text-orange-600">Due Today ({todayTasks.length})</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {todayTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Upcoming Tasks */}
          {upcomingTasks.length > 0 && (
            <Collapsible open={upcomingOpen} onOpenChange={setUpcomingOpen}>
              <CollapsibleTrigger className="flex items-center space-x-2 w-full p-2 rounded-lg hover:bg-gray-50 text-left">
                {upcomingOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span className="font-medium text-blue-600">Upcoming ({upcomingTasks.length})</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {upcomingTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Completed Tasks (only show if toggle is on) */}
          {showCompleted && completedTasks.length > 0 && (
            <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
              <CollapsibleTrigger className="flex items-center space-x-2 w-full p-2 rounded-lg hover:bg-gray-50 text-left">
                {completedOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span className="font-medium text-green-600">Completed ({completedTasks.length})</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {completedTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* No tasks message */}
          {filteredTasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No tasks found matching your filters.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Detail Dialog */}
      <TaskDetail
        task={selectedTask}
        open={isTaskDetailOpen}
        onOpenChange={setIsTaskDetailOpen}
        onSave={handleTaskSave}
      />
    </div>
  );
};
