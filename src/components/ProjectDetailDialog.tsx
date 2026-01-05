import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckSquare, Save, X, Users, FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Project } from '@/types';
import { useUnifiedData } from '@/hooks/useUnifiedData';
import { useProjectMembers } from '@/hooks/useProjectMembers';
import { useUsers } from '@/hooks/useUsers';

interface ProjectDetailDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedProject: Project) => void;
}

export const ProjectDetailDialog = ({ project, open, onOpenChange, onSave }: ProjectDetailDialogProps) => {
  const [editedProject, setEditedProject] = useState<Project | null>(null);
  const { workspaces, getProjectTasks } = useUnifiedData();
  const { members, addMember, removeMember } = useProjectMembers(project?.id);
  const { users } = useUsers();

  // Initialize edited project when dialog opens
  useEffect(() => {
    if (project && open) {
      setEditedProject({ ...project });
    }
  }, [project, open]);

  if (!project || !editedProject) return null;

  const handleSave = () => {
    onSave(editedProject);
    onOpenChange(false);
  };

  const toggleTeamMember = async (userId: string) => {
    const isMember = members.some(m => m.user_id === userId);
    
    if (isMember) {
      await removeMember(userId);
    } else {
      await addMember(userId);
    }
  };

  const projectTasks = getProjectTasks(project.id);
  const completedTasks = projectTasks.filter(task => task.completed).length;
  const totalTasks = projectTasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5" />
            <span>Edit Project</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Project Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              value={editedProject.title}
              onChange={(e) => setEditedProject({...editedProject, title: e.target.value})}
              className="font-medium"
            />
          </div>

          {/* Members and Progress Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>Members</span>
              </Label>
              <div className="grid grid-cols-2 gap-2 p-3 border rounded-md max-h-32 overflow-y-auto">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={user.id}
                      checked={members.some(m => m.user_id === user.id)}
                      onChange={() => toggleTeamMember(user.id)}
                      className="rounded"
                    />
                    <Label htmlFor={user.id} className="text-sm font-medium">
                      {user.full_name || user.email}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Progress</Label>
              <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-md">
                {completedTasks} of {totalTasks} tasks completed ({progress}%)
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-1">
              <FileText className="w-4 h-4" />
              <span>Notes</span>
            </Label>
            <Textarea
              value={editedProject.notes || ''}
              onChange={(e) => setEditedProject({...editedProject, notes: e.target.value})}
              placeholder="Add project notes..."
              className="min-h-[120px] resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-gray-900 hover:bg-gray-800">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};