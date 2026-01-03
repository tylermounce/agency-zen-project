
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Calendar, Play, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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

  // Use Template dialog state
  const [useTemplateDialog, setUseTemplateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [missingAssignees, setMissingAssignees] = useState<string[]>([]);
  const [reassignments, setReassignments] = useState<Record<string, string>>({});
  const [individualMode, setIndividualMode] = useState<Record<string, boolean>>({});
  const [taskReassignments, setTaskReassignments] = useState<Record<string, string>>({});
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
      const initialIndividualMode: Record<string, boolean> = {};
      missing.forEach(userId => {
        initialReassignments[userId] = '';
        initialIndividualMode[userId] = false;
      });
      setReassignments(initialReassignments);
      setIndividualMode(initialIndividualMode);
      setTaskReassignments({});
    } catch (error) {
      console.error('Error fetching workspace members:', error);
      setWorkspaceMemberIds([]);
      setMissingAssignees([]);
    }

    setUseTemplateDialog(true);
  };

  // Handle bulk assignment selection
  const handleBulkReassignment = (missingUserId: string, newAssigneeId: string) => {
    setReassignments(prev => ({ ...prev, [missingUserId]: newAssigneeId }));
  };

  // Toggle individual assignment mode for a user
  const toggleIndividualMode = (missingUserId: string) => {
    setIndividualMode(prev => ({ ...prev, [missingUserId]: !prev[missingUserId] }));
    // Clear bulk assignment when switching to individual
    if (!individualMode[missingUserId]) {
      setReassignments(prev => ({ ...prev, [missingUserId]: '' }));
    }
  };

  // Get task key for individual reassignments
  const getTaskKey = (missingUserId: string, taskIndex: number) => `${missingUserId}-${taskIndex}`;

  // Check if all tasks for a missing user are assigned (either bulk or individual)
  const isUserFullyAssigned = (missingUserId: string): boolean => {
    if (individualMode[missingUserId]) {
      // Check individual assignments
      const tasksForUser = selectedTemplate?.template_tasks?.filter(
        t => t.default_assignee_id === missingUserId
      ) || [];
      return tasksForUser.every((_, idx) => taskReassignments[getTaskKey(missingUserId, idx)]);
    } else {
      // Check bulk assignment
      return !!reassignments[missingUserId];
    }
  };

  // Get workspace members as user objects for the dropdown
  const getWorkspaceMemberUsers = () => {
    return users.filter(u => workspaceMemberIds.includes(u.id));
  };

  // Apply template to create tasks
  const handleApplyTemplate = async () => {
    if (!selectedTemplate || !workspaceId || !user) return;

    // Check if all missing assignees have been reassigned
    const unassignedMissing = missingAssignees.filter(id => !isUserFullyAssigned(id));
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

      // Track task index per missing user for individual assignments
      const taskCountByUser: Record<string, number> = {};

      for (const templateTask of tasks) {
        // Calculate due date based on start date + relative days
        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + (templateTask.relative_due_days || 0));

        // Determine assignee:
        // 1. If default assignee is in workspace, use them
        // 2. If default assignee is NOT in workspace, check individual or bulk reassignment
        // 3. If no assignee set, use current user
        let assigneeId = user.id;
        if (templateTask.default_assignee_id) {
          if (workspaceMemberIds.includes(templateTask.default_assignee_id)) {
            assigneeId = templateTask.default_assignee_id;
          } else {
            // User is not in workspace - check for reassignment
            const missingUserId = templateTask.default_assignee_id;
            if (individualMode[missingUserId]) {
              // Individual mode - get task-specific reassignment
              const taskIdx = taskCountByUser[missingUserId] || 0;
              const taskKey = getTaskKey(missingUserId, taskIdx);
              assigneeId = taskReassignments[taskKey] || user.id;
              taskCountByUser[missingUserId] = taskIdx + 1;
            } else {
              // Bulk mode - use bulk reassignment
              assigneeId = reassignments[missingUserId] || user.id;
            }
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
      setIndividualMode({});
      setTaskReassignments({});
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
      <div>
        <h2 className="text-2xl font-semibold">Project Templates</h2>
        <p className="text-gray-600 mt-1">Start new projects faster with pre-built templates</p>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No templates available. Contact an administrator to create templates.</p>
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

              <Button className="w-full" onClick={() => handleUseTemplate(template)}>
                <Play className="w-4 h-4 mr-2" />
                Use Template
              </Button>
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
                  ) || [];
                  const taskCount = tasksForUser.length;
                  const isIndividual = individualMode[userId];

                  return (
                    <div key={userId} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium min-w-[140px]">
                          {getUserName(userId)} ({taskCount} task{taskCount !== 1 ? 's' : ''}):
                        </span>
                        {!isIndividual ? (
                          <Select
                            value={reassignments[userId] || ''}
                            onValueChange={(value) => handleBulkReassignment(userId, value)}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Reassign all to..." />
                            </SelectTrigger>
                            <SelectContent>
                              {getWorkspaceMemberUsers().map((u) => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.full_name || u.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="flex-1 text-sm text-amber-700">Assigning individually</span>
                        )}
                        {taskCount > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleIndividualMode(userId)}
                            className="text-xs"
                          >
                            {isIndividual ? (
                              <>
                                <ChevronUp className="w-3 h-3 mr-1" />
                                Bulk
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3 mr-1" />
                                Individual
                              </>
                            )}
                          </Button>
                        )}
                      </div>

                      {/* Individual task assignments */}
                      {isIndividual && (
                        <div className="ml-4 space-y-2 border-l-2 border-amber-200 pl-3">
                          {tasksForUser.map((task, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <span className="text-gray-600 min-w-[150px] truncate">{task.title}</span>
                              <Select
                                value={taskReassignments[getTaskKey(userId, idx)] || ''}
                                onValueChange={(value) =>
                                  setTaskReassignments(prev => ({
                                    ...prev,
                                    [getTaskKey(userId, idx)]: value
                                  }))
                                }
                              >
                                <SelectTrigger className="flex-1 h-8">
                                  <SelectValue placeholder="Assign to..." />
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
                          ))}
                        </div>
                      )}
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
