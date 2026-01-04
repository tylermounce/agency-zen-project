
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
import { formatters } from '@/lib/timezone';
import { validateTask } from '@/lib/validation';
import { toast } from '@/hooks/use-toast';

interface TaskListProps {
  workspaceId: string;
  projectFilter?: string;
  onClearProjectFilter?: () => void;
}

export const TaskList = ({ workspaceId, projectFilter, onClearProjectFilter }: TaskListProps) => {
  const { getWorkspaceTasks, getWorkspaceProjects, getUser, getProject, updateTask, createTask } = useUnifiedData();
  const { users } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>(['todo', 'in-progress', 'review', 'done']);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
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
    console.log('TaskList handleTaskSave called with:', updatedTask);
    console.log('Selected task ID:', selectedTask?.id);
    if (selectedTask?.id) {
      updateTask(selectedTask.id, updatedTask);
    }
  };

  const handleCreateTask = async () => {
    // Validate form
    const validation = validateTask({
      title: newTaskTitle,
      assignee_id: newTaskAssignee,
      due_date: newTaskDueDate,
      description: newTaskDescription
    });

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      toast({
        title: "Please fix the errors",
        description: Object.values(validation.errors)[0],
        variant: "destructive"
      });
      return;
    }

    setFormErrors({});

    // Allow tasks without project (workspace tasks)
    const projectId = newTaskProject === "none" ? null : newTaskProject;

    try {
      await createTask({
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim(),
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
      toast({
        title: "Failed to create task",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  };

  // Filter tasks
  const filteredTasks = workspaceTasks.filter(task => {
    const project = task.project_id ? getProject(task.project_id) : null;
    const projectTitle = project?.title || 'General Tasks';
    
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         projectTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus.length === 0 || filterStatus.includes(task.status);
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
          onCheckedChange={(checked) => {
            const isCompleted = checked === true;
            const newStatus = isCompleted ? 'done' : 'todo';
            updateTask(task.id, { completed: isCompleted, status: newStatus });
          }}
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
              <span>{formatters.dateOnly(task.due_date + 'T12:00:00')}</span>
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
            <Select 
              value={filterStatus.length === 4 ? "all" : filterStatus.join(",")} 
              onValueChange={() => {}}
            >
                <SelectTrigger>
                  <SelectValue>
                    {filterStatus.length === 4 ? "All Status" : 
                     filterStatus.length === 0 ? "No Status Selected" :
                     filterStatus.length === 1 ? filterStatus[0].replace('-', ' ') :
                     `${filterStatus.length} Selected`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {[
                    { value: 'todo', label: 'To Do' },
                    { value: 'in-progress', label: 'In Progress' },
                    { value: 'review', label: 'Review' },
                    { value: 'done', label: 'Done' }
                  ].map((status) => (
                    <div key={status.value} className="flex items-center space-x-2 px-2 py-1.5 hover:bg-gray-100 cursor-pointer">
                      <Checkbox
                        id={`status-${status.value}`}
                        checked={filterStatus.includes(status.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFilterStatus(prev => [...prev, status.value]);
                          } else {
                            setFilterStatus(prev => prev.filter(s => s !== status.value));
                          }
                        }}
                      />
                      <label htmlFor={`status-${status.value}`} className="text-sm cursor-pointer">
                        {status.label}
                      </label>
                    </div>
                  ))}
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
                    <Label htmlFor="task-title">Task Title *</Label>
                    <Input
                      id="task-title"
                      value={newTaskTitle}
                      onChange={(e) => {
                        setNewTaskTitle(e.target.value);
                        if (formErrors.title) setFormErrors(prev => ({ ...prev, title: '' }));
                      }}
                      placeholder="Enter task title..."
                      className={formErrors.title ? 'border-red-500' : ''}
                    />
                    {formErrors.title && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.title}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="task-description">Notes</Label>
                    <Textarea
                      id="task-description"
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      placeholder="Add optional notes..."
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
                      <Label htmlFor="task-assignee">Assignee *</Label>
                      <Select
                        value={newTaskAssignee}
                        onValueChange={(val) => {
                          setNewTaskAssignee(val);
                          if (formErrors.assignee_id) setFormErrors(prev => ({ ...prev, assignee_id: '' }));
                        }}
                      >
                        <SelectTrigger className={formErrors.assignee_id ? 'border-red-500' : ''}>
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
                      {formErrors.assignee_id && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.assignee_id}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="task-due-date">Due Date *</Label>
                      <Input
                        id="task-due-date"
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => {
                          setNewTaskDueDate(e.target.value);
                          if (formErrors.due_date) setFormErrors(prev => ({ ...prev, due_date: '' }));
                        }}
                        className={formErrors.due_date ? 'border-red-500' : ''}
                      />
                      {formErrors.due_date && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.due_date}</p>
                      )}
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
                    <Button variant="outline" onClick={() => {
                      setNewTaskDialog(false);
                      setFormErrors({});
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTask}>
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

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
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
