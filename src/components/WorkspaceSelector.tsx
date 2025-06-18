
import { useState } from 'react';
import { Button } from '@/components/ui/button';
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

export const WorkspaceSelector = ({ workspaces, selectedWorkspace, onWorkspaceChange }: WorkspaceSelectorProps) => {
  const [open, setOpen] = useState(false);
  const currentWorkspace = workspaces.find(w => w.id === selectedWorkspace);

  return (
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
              {workspaces.map((workspace) => (
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
                    <span className="text-xs text-gray-500 ml-auto">{workspace.tasks}</span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedWorkspace === workspace.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
