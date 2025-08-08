import { useMemo, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

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
  const [query, setQuery] = useState("");
  const { isMobile, setOpenMobile } = useSidebar();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return workspaces;
    return workspaces.filter((w) => w.name.toLowerCase().includes(q));
  }, [query, workspaces]);

  const handleSelect = (id: string) => {
    onWorkspaceChange(id);
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar className="bg-sidebar text-sidebar-foreground" collapsible="icon">
      <SidebarHeader>
        <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
        <SidebarInput
          placeholder="Search workspaces"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filtered.map((w) => (
                <SidebarMenuItem key={w.id}>
                  <SidebarMenuButton
                    isActive={selectedWorkspace === w.id}
                    onClick={() => handleSelect(w.id)}
                  >
                    {/* Color dot */}
                    <span className={`inline-block size-2 rounded-full ${w.color}`} />
                    <span className="truncate">{w.name}</span>
                    <SidebarMenuBadge className="bg-muted text-muted-foreground">
                      {w.tasks}
                    </SidebarMenuBadge>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
