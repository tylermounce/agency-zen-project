import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Calendar, Edit2, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useUsers } from '@/hooks/useUsers';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

export const TemplateManagement = () => {
  const { users } = useUsers();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Template dialog state
  const [createDialog, setCreateDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [templateTasks, setTemplateTasks] = useState<TemplateTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskDueDays, setNewTaskDueDays] = useState('0');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit Template dialog state
  const [editDialog, setEditDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editTemplateName, setEditTemplateName] = useState('');
  const [editTemplateDescription, setEditTemplateDescription] = useState('');
  const [editTemplateTasks, setEditTemplateTasks] = useState<TemplateTask[]>([]);
  const [saving, setSaving] = useState(false);

  // Edit dialog - add new task state
  const [editNewTaskTitle, setEditNewTaskTitle] = useState('');
  const [editNewTaskDescription, setEditNewTaskDescription] = useState('');
  const [editNewTaskPriority, setEditNewTaskPriority] = useState('medium');
  const [editNewTaskDueDays, setEditNewTaskDueDays] = useState('0');
  const [editNewTaskAssignee, setEditNewTaskAssignee] = useState('');

  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('project_templates')
        .select('*, template_tasks(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (userId: string | null): string => {
    if (!userId) return 'Unassigned';
    const foundUser = users.find(u => u.id === userId);
    return foundUser?.full_name || foundUser?.email || 'Unknown';
  };

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

  const removeTemplateTask = (index: number) => {
    setTemplateTasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) return;
    setCreating(true);

    try {
      const { data: template, error: templateError } = await supabase
        .from('project_templates')
        .insert({
          name: newTemplateName,
          description: newTemplateDescription,
          category: 'General',
          duration: '',
          tasks_count: templateTasks.length,
          is_popular: false
        })
        .select()
        .single();

      if (templateError) throw templateError;

      if (templateTasks.length > 0 && template) {
        const taskInserts = templateTasks.map((task, index) => ({
          template_id: template.id,
          title: task.title,
          description: task.description || '',
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

      toast({ title: "Template created!", description: `"${newTemplateName}" is now available` });
      setCreateDialog(false);
      resetCreateForm();
      fetchTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      toast({ title: "Error creating template", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setNewTemplateName('');
    setNewTemplateDescription('');
    setTemplateTasks([]);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setEditTemplateName(template.name);
    setEditTemplateDescription(template.description || '');
    setEditTemplateTasks(template.template_tasks?.map(t => ({ ...t })) || []);
    // Reset add task form
    setEditNewTaskTitle('');
    setEditNewTaskDescription('');
    setEditNewTaskPriority('medium');
    setEditNewTaskDueDays('0');
    setEditNewTaskAssignee('');
    setEditDialog(true);
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate || !editTemplateName.trim()) return;
    setSaving(true);

    try {
      const { error: templateError } = await supabase
        .from('project_templates')
        .update({
          name: editTemplateName,
          description: editTemplateDescription,
          tasks_count: editTemplateTasks.length
        })
        .eq('id', editingTemplate.id);

      if (templateError) throw templateError;

      await supabase.from('template_tasks').delete().eq('template_id', editingTemplate.id);

      if (editTemplateTasks.length > 0) {
        const taskInserts = editTemplateTasks.map((task, index) => ({
          template_id: editingTemplate.id,
          title: task.title,
          description: task.description || '',
          priority: task.priority,
          order_index: index,
          status: 'todo',
          relative_due_days: task.relative_due_days || 0,
          default_assignee_id: task.default_assignee_id || null
        }));

        const { error: insertError } = await supabase
          .from('template_tasks')
          .insert(taskInserts);

        if (insertError) throw insertError;
      }

      toast({ title: "Template updated!", description: `"${editTemplateName}" has been saved` });
      setEditDialog(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      toast({ title: "Error updating template", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Update task fields in edit mode
  const updateEditTask = (taskIndex: number, field: keyof TemplateTask, value: string | number | null) => {
    setEditTemplateTasks(prev => prev.map((task, idx) =>
      idx === taskIndex ? { ...task, [field]: value } : task
    ));
  };

  const removeEditTask = (taskIndex: number) => {
    setEditTemplateTasks(prev => prev.filter((_, idx) => idx !== taskIndex));
  };

  // Add new task in edit mode
  const addEditTask = () => {
    if (!editNewTaskTitle.trim()) return;
    setEditTemplateTasks(prev => [...prev, {
      title: editNewTaskTitle,
      description: editNewTaskDescription,
      priority: editNewTaskPriority,
      relative_due_days: parseInt(editNewTaskDueDays) || 0,
      default_assignee_id: editNewTaskAssignee || null
    }]);
    setEditNewTaskTitle('');
    setEditNewTaskDescription('');
    setEditNewTaskPriority('medium');
    setEditNewTaskDueDays('0');
    setEditNewTaskAssignee('');
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    setDeleting(true);

    try {
      await supabase.from('template_tasks').delete().eq('template_id', templateToDelete.id);
      const { error } = await supabase.from('project_templates').delete().eq('id', templateToDelete.id);
      if (error) throw error;

      toast({ title: "Template deleted", description: `"${templateToDelete.name}" has been removed` });
      setDeleteDialog(false);
      setTemplateToDelete(null);
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({ title: "Error deleting template", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Project Templates</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Create and manage templates that can be applied to any workspace
              </p>
            </div>
            <Dialog open={createDialog} onOpenChange={setCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div>
                    <Label>Template Name</Label>
                    <Input value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} placeholder="Enter template name..." />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={newTemplateDescription} onChange={(e) => setNewTemplateDescription(e.target.value)} placeholder="Enter template description..." className="min-h-[80px]" />
                  </div>

                  <div className="space-y-4">
                    <Label>Template Tasks ({templateTasks.length})</Label>
                    <div className="border rounded-lg p-4 space-y-3">
                      <h4 className="font-medium">Add Task</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <Input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Task title..." />
                        <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
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
                          <Input type="number" min="0" value={newTaskDueDays} onChange={(e) => setNewTaskDueDays(e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Assign To</Label>
                          <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                            <SelectTrigger><SelectValue placeholder="Select team member" /></SelectTrigger>
                            <SelectContent>
                              {users.map((u) => (
                                <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Textarea value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)} placeholder="Task description..." className="min-h-[60px]" />
                      <Button size="sm" onClick={addTemplateTask} disabled={!newTaskTitle.trim()}>
                        <Plus className="w-4 h-4 mr-2" />Add Task
                      </Button>
                    </div>

                    {templateTasks.length > 0 && (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {templateTasks.map((task, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{task.title}</span>
                              <Badge variant="secondary" className="text-xs">
                                <Calendar className="w-3 h-3 mr-1" />Day {task.relative_due_days}
                              </Badge>
                              {task.default_assignee_id && (
                                <Badge variant="outline" className="text-xs">{getUserName(task.default_assignee_id)}</Badge>
                              )}
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => removeTemplateTask(index)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => { setCreateDialog(false); resetCreateForm(); }}>Cancel</Button>
                    <Button onClick={handleCreateTemplate} disabled={creating || !newTemplateName.trim()}>
                      {creating ? 'Creating...' : 'Create Template'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No templates yet. Create your first template to get started.</p>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{template.name}</span>
                      <span className="text-sm text-gray-500">{template.template_tasks?.length || 0} tasks</span>
                    </div>
                    {template.description && (
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)}>
                      <Edit2 className="w-4 h-4 mr-1" />Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => { setTemplateToDelete(template); setDeleteDialog(true); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label>Template Name</Label>
              <Input value={editTemplateName} onChange={(e) => setEditTemplateName(e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={editTemplateDescription} onChange={(e) => setEditTemplateDescription(e.target.value)} className="min-h-[80px]" />
            </div>

            <div className="space-y-4">
              <Label>Template Tasks ({editTemplateTasks.length})</Label>

              {/* Existing tasks - editable */}
              {editTemplateTasks.length > 0 && (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {editTemplateTasks.map((task, index) => (
                    <div key={index} className="p-3 border rounded-lg space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-2">
                          <Input
                            value={task.title}
                            onChange={(e) => updateEditTask(index, 'title', e.target.value)}
                            placeholder="Task title..."
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <Select value={task.priority} onValueChange={(value) => updateEditTask(index, 'priority', value)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                            <div>
                              <Input
                                type="number"
                                min="0"
                                value={task.relative_due_days}
                                onChange={(e) => updateEditTask(index, 'relative_due_days', parseInt(e.target.value) || 0)}
                                placeholder="Days"
                              />
                            </div>
                            <Select value={task.default_assignee_id || ''} onValueChange={(value) => updateEditTask(index, 'default_assignee_id', value || null)}>
                              <SelectTrigger><SelectValue placeholder="Assignee" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Unassigned</SelectItem>
                                {users.map((u) => (
                                  <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Textarea
                            value={task.description || ''}
                            onChange={(e) => updateEditTask(index, 'description', e.target.value)}
                            placeholder="Task description..."
                            className="min-h-[40px]"
                          />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeEditTask(index)} className="text-red-500 hover:text-red-700">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new task form */}
              <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                <h4 className="font-medium">Add New Task</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Input value={editNewTaskTitle} onChange={(e) => setEditNewTaskTitle(e.target.value)} placeholder="Task title..." />
                  <Select value={editNewTaskPriority} onValueChange={setEditNewTaskPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <Input type="number" min="0" value={editNewTaskDueDays} onChange={(e) => setEditNewTaskDueDays(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Assign To</Label>
                    <Select value={editNewTaskAssignee} onValueChange={setEditNewTaskAssignee}>
                      <SelectTrigger><SelectValue placeholder="Select team member" /></SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Textarea value={editNewTaskDescription} onChange={(e) => setEditNewTaskDescription(e.target.value)} placeholder="Task description..." className="min-h-[60px]" />
                <Button size="sm" onClick={addEditTask} disabled={!editNewTaskTitle.trim()}>
                  <Plus className="w-4 h-4 mr-2" />Add Task
                </Button>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setEditDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveTemplate} disabled={saving || !editTemplateName.trim()}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate} className="bg-red-600 hover:bg-red-700" disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
