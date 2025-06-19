
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar, User, Flag, CheckSquare, FileText, Save, X } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  project: string;
  workspace: string;
  status: string;
  priority: string;
  assignee: string;
  dueDate: string;
  completed: boolean;
  notes?: string;
}

interface TaskDetailProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedTask: Task) => void;
}

export const TaskDetail = ({ task, open, onOpenChange, onSave }: TaskDetailProps) => {
  const [editedTask, setEditedTask] = useState<Task | null>(null);

  // Initialize edited task when dialog opens
  React.useEffect(() => {
    if (task && open) {
      setEditedTask({ ...task, notes: task.notes || '' });
    }
  }, [task, open]);

  if (!task || !editedTask) return null;

  const handleSave = () => {
    onSave(editedTask);
    onOpenChange(false);
  };

  const teamMembers = ['JD', 'SM', 'AM', 'RK', 'KL', 'TW'];

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
              <Input value={editedTask.project} readOnly className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label>Workspace</Label>
              <Input value={editedTask.workspace} readOnly className="bg-gray-50" />
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
                value={editedTask.assignee}
                onValueChange={(value) => setEditedTask({...editedTask, assignee: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member} value={member}>
                      {member}
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
                value={editedTask.dueDate}
                onChange={(e) => setEditedTask({...editedTask, dueDate: e.target.value})}
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
                onValueChange={(value) => setEditedTask({...editedTask, priority: value})}
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
                onValueChange={(value) => setEditedTask({...editedTask, status: value})}
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
              value={editedTask.notes || ''}
              onChange={(e) => setEditedTask({...editedTask, notes: e.target.value})}
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
