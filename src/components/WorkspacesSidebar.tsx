import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface WorkspaceItem {
  id: string;
  name: string;
  color: string; // Tailwind color class provided by data (e.g., "bg-emerald-500")
  tasks: number;
}

interface WorkspacesSidebarProps {
  workspaces: WorkspaceItem[];
  selectedWorkspace: string;
  onWorkspaceChange: (workspaceId: string) => void;
}

export function WorkspacesSidebar({
  workspaces,
  selectedWorkspace,
  onWorkspaceChange,
}: WorkspacesSidebarProps) {
  const { isMobile, setOpenMobile, state } = useSidebar();
  const isCollapsed = state === "collapsed";

  // Helper: supports Tailwind bg-* classes or custom hex/RGB/HSL codes from settings
  const dotProps = (color: string) => {
    const isTw = typeof color === "string" && color.trim().startsWith("bg-");
    return {
      className: `inline-block size-3.5 rounded-full ${isTw ? color : ""}`,
      style: isTw ? undefined : { backgroundColor: color },
    };
  };

  const handleSelect = (id: string) => {
    onWorkspaceChange(id);
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar className="bg-sidebar text-sidebar-foreground" collapsible="icon">
      <SidebarHeader>
        <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <TooltipProvider delayDuration={300}>
              <SidebarMenu>
                {workspaces.map((w) => (
                  <SidebarMenuItem key={w.id}>
                    <SidebarMenuButton
                      isActive={selectedWorkspace === w.id}
                      onClick={() => handleSelect(w.id)}
                    >
                      {isCollapsed ? (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span {...dotProps(w.color)} aria-label={w.name} />
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{w.name}</span>
                                <span className="text-muted-foreground">{w.tasks} tasks</span>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </>
                      ) : (
                        <>
                          <span {...dotProps(w.color)} />
                          <span className="truncate">{w.name}</span>
                        </>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </TooltipProvider>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
