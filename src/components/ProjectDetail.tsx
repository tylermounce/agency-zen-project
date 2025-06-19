
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar, Flag, CheckSquare, Save, X, Users } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface Project {
  id: string;
  title: string;
  status: string;
  progress: number;
  dueDate: string;
  team: string[];
  priority: string;
  tasks: { completed: number; total: number };
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

  const toggleTeamMember = (member: string) => {
    const currentTeam = editedProject.team || [];
    const updatedTeam = currentTeam.includes(member)
      ? currentTeam.filter(m => m !== member)
      : [...currentTeam, member];
    
    setEditedProject({...editedProject, team: updatedTeam});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
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

          {/* Priority and Status */}
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
              <Label>Status</Label>
              <Select
                value={editedProject.status}
                onValueChange={(value) => setEditedProject({...editedProject, status: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date and Progress */}
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label>Progress (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={editedProject.progress}
                onChange={(e) => setEditedProject({...editedProject, progress: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>

          {/* Team Assignment */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>Assigned Team Members</span>
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {teamMembers.map((member) => (
                <div key={member} className="flex items-center space-x-2">
                  <Checkbox
                    id={member}
                    checked={editedProject.team?.includes(member) || false}
                    onCheckedChange={() => toggleTeamMember(member)}
                  />
                  <Label htmlFor={member} className="text-sm font-medium">
                    {member}
                  </Label>
                </div>
              ))}
            </div>
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
