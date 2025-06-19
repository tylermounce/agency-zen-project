
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Flag, CheckSquare, Save, X, Users, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Project {
  id: string;
  title: string;
  progress: number;
  dueDate: string;
  team: string[];
  priority: string;
  tasks: { completed: number; total: number };
  notes?: string;
  workspace: string;
}

interface ProjectDetailProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedProject: Project) => void;
}

export const ProjectDetail = ({ project, open, onOpenChange, onSave }: ProjectDetailProps) => {
  const [editedProject, setEditedProject] = useState<Project | null>(null);

  // Initialize edited project when dialog opens
  React.useEffect(() => {
    if (project && open) {
      setEditedProject({ ...project });
    }
  }, [project, open]);

  if (!project || !editedProject) return null;

  const handleSave = () => {
    onSave(editedProject);
    onOpenChange(false);
  };

  const teamMembers = ['JD', 'SM', 'AM', 'RK', 'KL', 'TW'];
  const workspaces = ['TechCorp Inc.', 'Fashion Forward', 'Green Energy Co.', 'Internal Projects'];

  const toggleTeamMember = (member: string) => {
    const currentTeam = editedProject.team || [];
    const updatedTeam = currentTeam.includes(member)
      ? currentTeam.filter(m => m !== member)
      : [...currentTeam, member];
    
    setEditedProject({...editedProject, team: updatedTeam});
  };

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

          {/* Project and Workspace Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project</Label>
              <Input
                value={editedProject.title}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label>Workspace</Label>
              <Select
                value={editedProject.workspace}
                onValueChange={(value) => setEditedProject({...editedProject, workspace: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map((workspace) => (
                    <SelectItem key={workspace} value={workspace}>
                      {workspace}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assigned To and Due Date Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>Members</span>
              </Label>
              <div className="grid grid-cols-2 gap-2 p-3 border rounded-md max-h-32 overflow-y-auto">
                {teamMembers.map((member) => (
                  <div key={member} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={member}
                      checked={editedProject.team?.includes(member) || false}
                      onChange={() => toggleTeamMember(member)}
                      className="rounded"
                    />
                    <Label htmlFor={member} className="text-sm font-medium">
                      {member}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Due Date</span>
              </Label>
              <Input
                type="date"
                value={editedProject.dueDate}
                onChange={(e) => setEditedProject({...editedProject, dueDate: e.target.value})}
              />
            </div>
          </div>

          {/* Priority and Status Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center space-x-1">
                <Flag className="w-4 h-4" />
                <span>Priority</span>
              </Label>
              <Select
                value={editedProject.priority}
                onValueChange={(value) => setEditedProject({...editedProject, priority: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Progress</Label>
              <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-md">
                {editedProject.tasks.completed} of {editedProject.tasks.total} tasks completed 
                ({Math.round((editedProject.tasks.completed / editedProject.tasks.total) * 100)}%)
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
