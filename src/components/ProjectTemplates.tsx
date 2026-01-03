
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Copy, Star, X, Calendar, Play, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import { useUnifiedData } from '@/hooks/useUnifiedData';
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers';
import { toast } from '@/hooks/use-toast';

interface TemplateTask {
  id?: string;
  title: string;
  description: string;
  priority: string;
  relative_due_days: number;
  default_assignee_id: string | null;
  order_index?: number;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: string;
  tasks_count: number;
  is_popular: boolean;
  template_tasks: TemplateTask[];
}

interface ProjectTemplatesProps {
  workspaceId: string;
}

export const ProjectTemplates = ({ workspaceId }: ProjectTemplatesProps) => {
  const { user } = useAuth();
  const { users } = useUsers();
  const { createTask } = useUnifiedData();
  const { getWorkspaceMembers } = useWorkspaceMembers();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTemplateDialog, setNewTemplateDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('');
  const [newTemplateDuration, setNewTemplateDuration] = useState('');
  const [templateTasks, setTemplateTasks] = useState<TemplateTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskDueDays, setNewTaskDueDays] = useState('0');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');

  // Use Template dialog state
  const [useTemplateDialog, setUseTemplateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [missingAssignees, setMissingAssignees] = useState<string[]>([]);
  const [reassignments, setReassignments] = useState<Record<string, string>>({});
  const [workspaceMemberIds, setWorkspaceMemberIds] = useState<string[]>([]);
  const [applyingTemplate, setApplyingTemplate] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('project_templates')
          .select(`
            *,
            template_tasks(*)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const templatesWithTaskCount = data.map(template => ({
          ...template,
          tasks: template.template_tasks?.length || 0,
          popular: template.is_popular
        }));

        setTemplates(templatesWithTaskCount);
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const addTemplateTask = () => {
    if (!newTaskTitle.trim()) return;

    setTemplateTasks(prev => [...prev, {
      title: newTaskTitle,
      description: newTaskDescription,
      priority: newTaskPriority,
      relative_due_days: parseInt(newTaskDueDays) || 0,
      default_assignee_id: newTaskAssignee || null
    }]);

    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('medium');
    setNewTaskDueDays('0');
    setNewTaskAssignee('');
  };

  // Get user name by ID
  const getUserName = (userId: string | null): string => {
    if (!userId) return 'Unassigned';
    const foundUser = users.find(u => u.id === userId);
    return foundUser?.full_name || foundUser?.email || 'Unknown';
  };

  // Open Use Template dialog - check for missing workspace members
  const handleUseTemplate = async (template: Template) => {
    setSelectedTemplate(template);
    setStartDate(new Date().toISOString().split('T')[0]);

    // Fetch workspace members
    try {
      const members = await getWorkspaceMembers(workspaceId);
      const memberIds = members.map(m => m.user_id);
      setWorkspaceMemberIds(memberIds);

      // Find assignees that are NOT in the workspace
      const templateAssignees = template.template_tasks
        ?.map(task => task.default_assignee_id)
        .filter((id): id is string => !!id) || [];

      const uniqueAssignees = [...new Set(templateAssignees)];
      const missing = uniqueAssignees.filter(id => !memberIds.includes(id));

      setMissingAssignees(missing);

      // Initialize reassignments for missing users
      const initialReassignments: Record<string, string> = {};
      missing.forEach(userId => {
        initialReassignments[userId] = '';
      });
      setReassignments(initialReassignments);
    } catch (error) {
      console.error('Error fetching workspace members:', error);
      setWorkspaceMemberIds([]);
      setMissingAssignees([]);
    }

    setUseTemplateDialog(true);
  };

  // Get workspace members as user objects for the dropdown
  const getWorkspaceMemberUsers = () => {
    return users.filter(u => workspaceMemberIds.includes(u.id));
  };

  // Apply template to create tasks
  const handleApplyTemplate = async () => {
    if (!selectedTemplate || !workspaceId || !user) return;

    // Check if all missing assignees have been reassigned
    const unassignedMissing = missingAssignees.filter(id => !reassignments[id]);
    if (unassignedMissing.length > 0) {
      toast({
        title: "Please assign all team members",
        description: "Some tasks need to be reassigned before applying",
        variant: "destructive"
      });
      return;
    }

    setApplyingTemplate(true);

    try {
      const tasks = selectedTemplate.template_tasks || [];

      for (const templateTask of tasks) {
        // Calculate due date based on start date + relative days
        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + (templateTask.relative_due_days || 0));

        // Determine assignee:
        // 1. If default assignee is in workspace, use them
        // 2. If default assignee is NOT in workspace, use the reassignment
        // 3. If no assignee set, use current user
        let assigneeId = user.id;
        if (templateTask.default_assignee_id) {
          if (workspaceMemberIds.includes(templateTask.default_assignee_id)) {
            assigneeId = templateTask.default_assignee_id;
          } else if (reassignments[templateTask.default_assignee_id]) {
            assigneeId = reassignments[templateTask.default_assignee_id];
          }
        }

        await createTask({
          title: templateTask.title,
          description: templateTask.description || '',
          workspace_id: workspaceId,
          project_id: null,
          assignee_id: assigneeId,
          due_date: dueDate.toISOString().split('T')[0],
          priority: (templateTask.priority as 'low' | 'medium' | 'high') || 'medium',
          status: 'todo',
          completed: false
        });
      }

      toast({
        title: "Template applied!",
        description: `Created ${tasks.length} tasks from "${selectedTemplate.name}"`
      });

      setUseTemplateDialog(false);
      setSelectedTemplate(null);
      setMissingAssignees([]);
      setReassignments({});
    } catch (error) {
      console.error('Error applying template:', error);
      toast({
        title: "Error applying template",
        description: "Some tasks may not have been created",
        variant: "destructive"
      });
    } finally {
      setApplyingTemplate(false);
    }
  };

  const removeTemplateTask = (index: number) => {
    setTemplateTasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim() || !newTemplateCategory) return;
    
    try {
      // Create the template first
      const { data: template, error: templateError } = await supabase
        .from('project_templates')
        .insert({
          name: newTemplateName,
          description: newTemplateDescription,
          category: newTemplateCategory,
          duration: newTemplateDuration,
          tasks_count: templateTasks.length,
          is_popular: false
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Create template tasks if any exist
      if (templateTasks.length > 0 && template) {
        const taskInserts = templateTasks.map((task, index) => ({
          template_id: template.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          order_index: index,
          status: 'todo',
          relative_due_days: task.relative_due_days || 0,
          default_assignee_id: task.default_assignee_id || null
        }));

        const { error: tasksError } = await supabase
          .from('template_tasks')
          .insert(taskInserts);

        if (tasksError) throw tasksError;
      }

      setNewTemplateDialog(false);
      setNewTemplateName('');
      setNewTemplateDescription('');
      setNewTemplateCategory('');
      setNewTemplateDuration('');
      setTemplateTasks([]);
      
      // Refresh templates list
      const { data, error: fetchError } = await supabase
        .from('project_templates')
        .select(`
          *,
          template_tasks(*)
        `)
        .order('created_at', { ascending: false });

      if (!fetchError) {
        const templatesWithTaskCount = data.map(template => ({
          ...template,
          tasks: template.template_tasks?.length || 0,
          popular: template.is_popular
        }));
        setTemplates(templatesWithTaskCount);
      }
    } catch (error) {
      // Error creating template - could add user notification here
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Marketing': return 'bg-blue-100 text-blue-800';
      case 'Design': return 'bg-purple-100 text-purple-800';
      case 'Development': return 'bg-green-100 text-green-800';
      case 'Content': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Project Templates</h2>
          <p className="text-gray-600 mt-1">Start new projects faster with pre-built templates</p>
        </div>
        <Dialog open={newTemplateDialog} onOpenChange={setNewTemplateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="Enter template name..."
                  />
                </div>
                <div>
                  <Label htmlFor="template-category">Category</Label>
                  <Select value={newTemplateCategory} onValueChange={setNewTemplateCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="Content">Content</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  placeholder="Enter template description..."
                  className="min-h-[80px]"
                />
              </div>
              <div>
                <Label htmlFor="template-duration">Duration</Label>
                <Input
                  id="template-duration"
                  value={newTemplateDuration}
                  onChange={(e) => setNewTemplateDuration(e.target.value)}
                  placeholder="e.g., 2 weeks, 1 month..."
                />
              </div>
              
              {/* Template Tasks Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Template Tasks ({templateTasks.length})</Label>
                </div>
                
                {/* Add new task form */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium">Add Task to Template</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Task title..."
                    />
                    <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500">Due (days from start)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={newTaskDueDays}
                        onChange={(e) => setNewTaskDueDays(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Assign To</Label>
                      <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team member" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.full_name || u.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Textarea
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Task description..."
                    className="min-h-[60px]"
                  />
                  <Button size="sm" onClick={addTemplateTask} disabled={!newTaskTitle.trim()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </div>
                
                {/* Template tasks list */}
                {templateTasks.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {templateTasks.map((task, index) => (
                      <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center flex-wrap gap-2 mb-1">
                            <span className="font-medium">{task.title}</span>
                            <Badge variant="outline" className={
                              task.priority === 'high' ? 'border-red-200 text-red-700' :
                              task.priority === 'medium' ? 'border-orange-200 text-orange-700' :
                              'border-green-200 text-green-700'
                            }>
                              {task.priority}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              <Calendar className="w-3 h-3 mr-1" />
                              Day {task.relative_due_days}
                            </Badge>
                            {task.default_assignee_id && (
                              <Badge variant="outline" className="text-xs">
                                {getUserName(task.default_assignee_id)}
                              </Badge>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-600">{task.description}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeTemplateTask(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setNewTemplateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTemplate} disabled={!newTemplateName.trim() || !newTemplateCategory}>
                  Create Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No templates found. Create your first template to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.popular && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {template.description}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={getCategoryColor(template.category)}>
                  {template.category}
                </Badge>
                {template.popular && (
                  <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                    Popular
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Tasks:</span>
                  <div className="font-medium">{template.tasks}</div>
                </div>
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <div className="font-medium">{template.duration}</div>
                </div>
              </div>
              
              <div className="flex space-x-2 pt-2">
                <Button className="flex-1" onClick={() => handleUseTemplate(template)}>
                  <Play className="w-4 h-4 mr-2" />
                  Use Template
                </Button>
                <Button variant="outline" size="icon">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {/* Use Template Dialog */}
      <Dialog open={useTemplateDialog} onOpenChange={setUseTemplateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply Template: {selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This will create {selectedTemplate?.template_tasks?.length || 0} tasks in this workspace.
            </p>

            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Task due dates will be calculated from this date
              </p>
            </div>

            {/* Show reassignment UI only if there are missing members */}
            {missingAssignees.length > 0 && (
              <div className="space-y-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="w-4 h-4" />
                  <Label className="text-amber-800 font-medium">Team Member Reassignment Needed</Label>
                </div>
                <p className="text-sm text-amber-700">
                  The following team members are not in this workspace. Please assign their tasks to someone else:
                </p>
                {missingAssignees.map((userId) => {
                  const tasksForUser = selectedTemplate?.template_tasks?.filter(
                    t => t.default_assignee_id === userId
                  ).length || 0;
                  return (
                    <div key={userId} className="flex items-center gap-3">
                      <span className="text-sm font-medium min-w-[140px]">
                        {getUserName(userId)} ({tasksForUser} task{tasksForUser !== 1 ? 's' : ''}):
                      </span>
                      <Select
                        value={reassignments[userId] || ''}
                        onValueChange={(value) =>
                          setReassignments((prev) => ({ ...prev, [userId]: value }))
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Reassign to..." />
                        </SelectTrigger>
                        <SelectContent>
                          {getWorkspaceMemberUsers().map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.full_name || u.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Preview tasks */}
            {selectedTemplate?.template_tasks && selectedTemplate.template_tasks.length > 0 && (
              <div className="space-y-2">
                <Label>Tasks to be created:</Label>
                <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2">
                  {selectedTemplate.template_tasks
                    .sort((a, b) => (a.relative_due_days || 0) - (b.relative_due_days || 0))
                    .map((task, idx) => {
                      const dueDate = new Date(startDate);
                      dueDate.setDate(dueDate.getDate() + (task.relative_due_days || 0));
                      const isMissing = task.default_assignee_id && missingAssignees.includes(task.default_assignee_id);
                      const assigneeName = task.default_assignee_id
                        ? (isMissing && reassignments[task.default_assignee_id]
                            ? getUserName(reassignments[task.default_assignee_id])
                            : getUserName(task.default_assignee_id))
                        : 'You';
                      return (
                        <div key={idx} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                          <div className="flex items-center gap-2">
                            <span>{task.title}</span>
                            {isMissing && !reassignments[task.default_assignee_id] && (
                              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                                Needs reassignment
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <span>{assigneeName}</span>
                            <span>•</span>
                            <span>{dueDate.toLocaleDateString()}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setUseTemplateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleApplyTemplate} disabled={applyingTemplate}>
                {applyingTemplate ? 'Creating Tasks...' : 'Apply Template'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
