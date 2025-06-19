
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
import { TaskDetail } from '@/components/TaskDetail';

interface TaskListProps {
  workspaceId: string;
  projectFilter?: string;
  onClearProjectFilter?: () => void;
}

export const TaskList = ({ workspaceId, projectFilter, onClearProjectFilter }: TaskListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  
  // Collapsible sections state
  const [overdueOpen, setOverdueOpen] = useState(true);
  const [todayOpen, setTodayOpen] = useState(true);
  const [upcomingOpen, setUpcomingOpen] = useState(true);
  const [completedOpen, setCompletedOpen] = useState(false);

  const [tasks, setTasks] = useState([
    {
      id: '1',
      title: 'Design Instagram post templates',
      project: 'Q4 Social Media Campaign',
      status: 'todo',
      priority: 'high',
      assignee: 'JD',
      dueDate: '2024-07-05', // Overdue
      completed: false,
      workspace: 'TechCorp Inc.',
      notes: 'Need to create 5 different templates following brand guidelines.'
    },
    {
      id: '2',
      title: 'Write blog post copy',
      project: 'Website Launch Campaign',
      status: 'in-progress',
      priority: 'medium',
      assignee: 'SM',
      dueDate: new Date().toISOString().split('T')[0], // Today
      completed: false
    },
    {
      id: '3',
      title: 'Review brand guidelines',
      project: 'Brand Identity Redesign',
      status: 'review',
      priority: 'low',
      assignee: 'AM',
      dueDate: '2024-07-15', // Future
      completed: false
    },
    {
      id: '4',
      title: 'Export final logo files',
      project: 'Brand Identity Redesign',
      status: 'done',
      priority: 'medium',
      assignee: 'RK',
      dueDate: '2024-07-05',
      completed: true
    }
  ]);

  const projects = ['Q4 Social Media Campaign', 'Website Launch Campaign', 'Brand Identity Redesign'];
  const assignees = ['JD', 'SM', 'AM', 'RK', 'KL', 'TW'];

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

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  };

  const handleTaskSave = (updatedTask) => {
    setTasks(currentTasks => 
      currentTasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    );
    console.log('Task updated:', updatedTask);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (!showCompleted && task.completed) return false;
    
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.project.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesProject = (filterProject === 'all' || task.project === filterProject) && 
                          (!projectFilter || task.project === projectFilter);
    const matchesAssignee = filterAssignee === 'all' || task.assignee === filterAssignee;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesProject && matchesAssignee;
  });

  // Group tasks by date
  const today = new Date().toISOString().split('T')[0];
  const overdueTasks = filteredTasks.filter(task => !task.completed && task.dueDate < today);
  const todayTasks = filteredTasks.filter(task => !task.completed && task.dueDate === today);
  const upcomingTasks = filteredTasks.filter(task => !task.completed && task.dueDate > today);
  const completedTasks = filteredTasks.filter(task => task.completed);

  const TaskItem = ({ task }) => (
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
          <span className="truncate">{task.project}</span>
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Avatar className="w-6 h-6">
          <AvatarFallback className="text-xs">{task.assignee}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );

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
                {projects.map((project) => (
                  <SelectItem key={project} value={project}>
                    {project}
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
                {assignees.map((assignee) => (
                  <SelectItem key={assignee} value={assignee}>
                    {assignee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
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
