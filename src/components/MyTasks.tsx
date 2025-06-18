
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Calendar, User, Filter, Search, ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';

export const MyTasks = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterWorkspace, setFilterWorkspace] = useState('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskProject, setNewTaskProject] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  
  // Collapsible sections state
  const [overdueOpen, setOverdueOpen] = useState(true);
  const [todayOpen, setTodayOpen] = useState(true);
  const [upcomingOpen, setUpcomingOpen] = useState(true);
  const [completedOpen, setCompletedOpen] = useState(false);

  // Mock data - tasks assigned to current user (JD)
  const myTasks = [
    {
      id: '1',
      title: 'Design Instagram post templates',
      project: 'Q4 Social Media Campaign',
      workspace: 'TechCorp Inc.',
      status: 'todo',
      priority: 'high',
      assignee: 'JD',
      dueDate: '2024-07-05', // Overdue
      completed: false
    },
    {
      id: '2',
      title: 'Review creative concepts',
      project: 'Website Launch Campaign',
      workspace: 'Fashion Forward',
      status: 'in-progress',
      priority: 'medium',
      assignee: 'JD',
      dueDate: new Date().toISOString().split('T')[0], // Today
      completed: false
    },
    {
      id: '3',
      title: 'Update brand guidelines document',
      project: 'Brand Identity Redesign',
      workspace: 'Green Energy Co.',
      status: 'review',
      priority: 'low',
      assignee: 'JD',
      dueDate: '2024-07-15', // Future
      completed: false
    },
    {
      id: '4',
      title: 'Finalize logo design',
      project: 'Brand Identity Redesign',
      workspace: 'Green Energy Co.',
      status: 'done',
      priority: 'high',
      assignee: 'JD',
      dueDate: '2024-07-03',
      completed: true
    },
    {
      id: '5',
      title: 'Client presentation prep',
      project: 'Website Launch Campaign',
      workspace: 'Fashion Forward',
      status: 'todo',
      priority: 'high',
      assignee: 'JD',
      dueDate: '2024-07-04', // Overdue
      completed: false
    }
  ];

  const workspaces = [
    'TechCorp Inc.',
    'Fashion Forward', 
    'Green Energy Co.',
    'Internal Projects'
  ];

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

  // Filter and sort tasks
  const filteredTasks = myTasks
    .filter(task => {
      if (!showCompleted && task.completed) return false;
      
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.workspace.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      const matchesWorkspace = filterWorkspace === 'all' || task.workspace === filterWorkspace;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesWorkspace;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Group tasks by date
  const today = new Date().toISOString().split('T')[0];
  const overdueTasks = filteredTasks.filter(task => !task.completed && task.dueDate < today);
  const todayTasks = filteredTasks.filter(task => !task.completed && task.dueDate === today);
  const upcomingTasks = filteredTasks.filter(task => !task.completed && task.dueDate > today);
  const completedTasks = filteredTasks.filter(task => task.completed);

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;
    
    console.log('Creating new task:', {
      title: newTaskTitle,
      project: newTaskProject,
      priority: newTaskPriority,
      assignee: 'JD',
      dueDate: new Date().toISOString().split('T')[0],
    });
    
    setNewTaskTitle('');
    setNewTaskProject('');
    setNewTaskPriority('medium');
    setIsNewTaskOpen(false);
  };

  const TaskItem = ({ task }: { task: typeof myTasks[0] }) => (
    <div className="flex items-center space-x-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
      <Checkbox checked={task.completed} className="mt-1" />
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
          <span className="text-blue-600">{task.workspace}</span>
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
      {/* Filters and New Task */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              My Tasks Overview
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
              <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
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
                      <label className="text-sm font-medium">Task Title</label>
                      <Input
                        placeholder="Enter task title..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Project</label>
                      <Input
                        placeholder="Enter project name..."
                        value={newTaskProject}
                        onChange={(e) => setNewTaskProject(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Priority</label>
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
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>Assigned to: You (JD)</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Due date: Today ({new Date().toLocaleDateString()})</span>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsNewTaskOpen(false)}>
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
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search my tasks..."
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
            <Select value={filterWorkspace} onValueChange={setFilterWorkspace}>
              <SelectTrigger>
                <SelectValue placeholder="Workspace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workspaces</SelectItem>
                {workspaces.map((workspace) => (
                  <SelectItem key={workspace} value={workspace}>
                    {workspace}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Task Sections */}
      <Card>
        <CardHeader>
          <CardTitle>Your Tasks</CardTitle>
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
    </div>
  );
};
