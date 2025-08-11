
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar, User, Flag, CheckSquare, FileText, Save, X } from 'lucide-react';
import { Task } from '@/types';
import { useUnifiedData } from '@/hooks/useUnifiedData';

interface TaskDetailProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedTask: Partial<Task>) => void;
}

export const TaskDetail = ({ task, open, onOpenChange, onSave }: TaskDetailProps) => {
  const { getProject, getWorkspace, users } = useUnifiedData();
  const [editedTask, setEditedTask] = useState<Task | null>(null);

  // Initialize edited task when dialog opens
  React.useEffect(() => {
    if (task && open) {
      setEditedTask({ ...task });
    }
  }, [task, open]);

  if (!task || !editedTask) return null;

  const handleSave = () => {
    console.log('TaskDetail handleSave called');
    console.log('Original task due_date:', task.due_date);
    console.log('Edited task due_date:', editedTask.due_date);
    
    // Only send the fields that might have changed, excluding fields that shouldn't be updated
    const updates: Partial<Task> = {
      title: editedTask.title,
      description: editedTask.description,
      assignee_id: editedTask.assignee_id,
      due_date: editedTask.due_date,
      priority: editedTask.priority,
      status: editedTask.status
    };
    
    console.log('Updates to be sent:', updates);
    
// Don't include project_id in updates to avoid UUID issues
onSave(updates);
onOpenChange(false);
  };

  // Get project and workspace info for display
  const project = task.project_id ? getProject(task.project_id) : null;
  const workspace = getWorkspace(task.workspace_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5" />
            <span>Edit Task</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={editedTask.title}
              onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
              className="font-medium"
            />
          </div>

          {/* Project and Workspace (read-only) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project</Label>
              <Input value={project?.title || 'General Tasks'} readOnly className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label>Workspace</Label>
              <Input value={workspace?.name || 'Unknown Workspace'} readOnly className="bg-gray-50" />
            </div>
          </div>

          {/* Assignee and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span>Assigned To</span>
              </Label>
              <Select
                value={editedTask.assignee_id}
                onValueChange={(value) => setEditedTask({...editedTask, assignee_id: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} ({user.initials})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Due Date</span>
              </Label>
              <Input
                type="date"
                value={editedTask.due_date}
                onChange={(e) => {
                  console.log('Date input changed:', e.target.value);
                  setEditedTask({...editedTask, due_date: e.target.value});
                }}
              />
            </div>
          </div>

          {/* Priority and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center space-x-1">
                <Flag className="w-4 h-4" />
                <span>Priority</span>
              </Label>
              <Select
                value={editedTask.priority}
                onValueChange={(value: 'low' | 'medium' | 'high') => setEditedTask({...editedTask, priority: value})}
              >
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
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={editedTask.status}
                onValueChange={(value: 'todo' | 'in-progress' | 'review' | 'done') => setEditedTask({...editedTask, status: value})}
              >
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

          {/* Notes */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-1">
              <FileText className="w-4 h-4" />
              <span>Notes</span>
            </Label>
            <Textarea
              placeholder="Add notes about this task..."
              value={editedTask.description || ''}
              onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
              rows={4}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
