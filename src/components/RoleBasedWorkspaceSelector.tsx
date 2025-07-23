import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings } from 'lucide-react';
import { useUnifiedData } from '@/hooks/useUnifiedData';
import { useUserRole } from '@/hooks/useUserRole';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Workspace {
  id: string;
  name: string;
  color: string;
  tasks: number;
}

interface WorkspaceSelectorProps {
  workspaces: Workspace[];
  selectedWorkspace: string;
  onWorkspaceChange: (workspaceId: string) => void;
}

export const RoleBasedWorkspaceSelector = ({ workspaces, selectedWorkspace, onWorkspaceChange }: WorkspaceSelectorProps) => {
  const { createWorkspace } = useUnifiedData();
  const { isAdmin } = useUserRole();
  const [open, setOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceColor, setNewWorkspaceColor] = useState('#3B82F6');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');

  const currentWorkspace = workspaces.find(w => w.id === selectedWorkspace);

  // Mock data for user's due/overdue tasks per workspace
  const getUserDueTasksForWorkspace = (workspaceId: string) => {
    const mockUserDueTasks = {
      'client-1': 3,
      'client-2': 0,
      'client-3': 1,
      'internal': 2
    };
    return mockUserDueTasks[workspaceId] || 0;
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;

    try {
      await createWorkspace({
        name: newWorkspaceName,
        color: newWorkspaceColor,
        description: newWorkspaceDescription
      });
      
      setNewWorkspaceName('');
      setNewWorkspaceColor('#3B82F6');
      setNewWorkspaceDescription('');
      setIsCreateOpen(false);
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-64 justify-between"
          >
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${currentWorkspace?.color}`}></div>
              <span className="truncate">{currentWorkspace?.name}</span>
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0">
          <Command>
            <CommandInput placeholder="Search workspaces..." />
            <CommandList>
              <CommandEmpty>No workspace found.</CommandEmpty>
              <CommandGroup>
                {workspaces.map((workspace) => {
                  const userDueTasks = getUserDueTasksForWorkspace(workspace.id);
                  return (
                    <CommandItem
                      key={workspace.id}
                      value={workspace.name}
                      onSelect={() => {
                        onWorkspaceChange(workspace.id);
                        setOpen(false);
                      }}
                    >
                      <div className="flex items-center space-x-2 flex-1">
                        <div className={`w-2 h-2 rounded-full ${workspace.color}`}></div>
                        <span className="truncate">{workspace.name}</span>
                        <div className="flex items-center space-x-2 ml-auto">
                          <span className="text-xs text-gray-500">{workspace.tasks}</span>
                          {userDueTasks > 0 && (
                            <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                              {userDueTasks}
                            </div>
                          )}
                        </div>
                      </div>
                      <Check
                        className={cn(
                          "ml-2 h-4 w-4",
                          selectedWorkspace === workspace.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {isAdmin && (
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Workspace</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Workspace Name</label>
                <Input
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="Enter workspace name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Color</label>
                <Input
                  type="color"
                  value={newWorkspaceColor}
                  onChange={(e) => setNewWorkspaceColor(e.target.value)}
                  className="w-full h-10"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (Optional)</label>
                <Input
                  value={newWorkspaceDescription}
                  onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                  placeholder="Enter workspace description"
                />
              </div>
              <Button onClick={handleCreateWorkspace} className="w-full">
                Create Workspace
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};