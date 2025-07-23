import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MoreHorizontal, Building, Edit, Trash2, Users, X } from 'lucide-react';
import { useUnifiedData } from '@/hooks/useUnifiedData';
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers';
import { useToast } from '@/hooks/use-toast';

export const WorkspaceSettings = () => {
  const { workspaces, createWorkspace, updateWorkspace, deleteWorkspace, getWorkspaceTaskCounts, users } = useUnifiedData();
  const { addWorkspaceMember, removeWorkspaceMember, getWorkspaceMembers } = useWorkspaceMembers();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState(null);
  const [managingMembers, setManagingMembers] = useState(null);
  const [newWorkspace, setNewWorkspace] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  const taskCounts = getWorkspaceTaskCounts;

  const handleCreateWorkspace = async () => {
    if (!newWorkspace.name.trim()) {
      toast({
        title: "Error",
        description: "Workspace name is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createWorkspace({
        name: newWorkspace.name,
        description: newWorkspace.description,
        color: newWorkspace.color
      });

      setNewWorkspace({ name: '', description: '', color: '#3B82F6' });
      setIsCreateOpen(false);
      
      toast({
        title: "Workspace created",
        description: `${newWorkspace.name} has been created successfully.`,
      });
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast({
        title: "Error",
        description: "Failed to create workspace.",
        variant: "destructive",
      });
    }
  };

  const handleEditWorkspace = (workspace) => {
    setEditingWorkspace(workspace);
    setNewWorkspace({
      name: workspace.name,
      description: workspace.description || '',
      color: workspace.color
    });
  };

  const handleUpdateWorkspace = async () => {
    if (!editingWorkspace) return;
    if (!newWorkspace.name.trim()) {
      toast({
        title: "Error",
        description: "Workspace name is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateWorkspace(editingWorkspace.id, {
        name: newWorkspace.name,
        description: newWorkspace.description,
        color: newWorkspace.color
      });

      setEditingWorkspace(null);
      setNewWorkspace({ name: '', description: '', color: '#3B82F6' });
      
      toast({
        title: "Workspace updated",
        description: `${newWorkspace.name} has been updated successfully.`,
      });
    } catch (error) {
      console.error('Error updating workspace:', error);
      toast({
        title: "Error",
        description: "Failed to update workspace.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string, workspaceName: string) => {
    try {
      await deleteWorkspace(workspaceId);
      
      toast({
        title: "Workspace deleted",
        description: `${workspaceName} has been deleted successfully.`,
      });
    } catch (error) {
      console.error('Error deleting workspace:', error);
      toast({
        title: "Error",
        description: "Failed to delete workspace.",
        variant: "destructive",
      });
    }
  };

  const handleAddMember = async (workspaceId: string, userId: string) => {
    try {
      await addWorkspaceMember(workspaceId, userId);
      toast({
        title: "Member added",
        description: "User has been added to the workspace.",
      });
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: "Error",
        description: "Failed to add member. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (workspaceId: string, userId: string) => {
    try {
      await removeWorkspaceMember(workspaceId, userId);
      toast({
        title: "Member removed",
        description: "User has been removed from the workspace.",
      });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <Building className="w-5 h-5" />
              <span>Workspace Management</span>
            </CardTitle>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Workspace
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Workspace</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Workspace Name</Label>
                    <Input
                      id="name"
                      value={newWorkspace.name}
                      onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                      placeholder="Enter workspace name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newWorkspace.description}
                      onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                      placeholder="Enter workspace description (optional)"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      type="color"
                      value={newWorkspace.color}
                      onChange={(e) => setNewWorkspace({ ...newWorkspace, color: e.target.value })}
                      className="w-full h-10"
                    />
                  </div>
                  <Button onClick={handleCreateWorkspace} className="w-full">
                    Create Workspace
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              Manage workspaces for your organization. Each workspace can contain multiple projects and tasks.
            </p>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workspaces.map((workspace) => {
                  const counts = taskCounts[workspace.id] || { total: 0, active: 0, completed: 0 };
                  return (
                    <TableRow key={workspace.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: workspace.color }}
                          ></div>
                          <div>
                            <div className="font-medium">{workspace.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                        {workspace.description || 'No description'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Badge variant="outline" className="text-xs">
                            {counts.active} active
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {counts.total} total
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {(workspace as any).created_at ? new Date((workspace as any).created_at).toLocaleDateString() : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditWorkspace(workspace)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setManagingMembers(workspace)}>
                              <Users className="w-4 h-4 mr-2" />
                              Manage Members
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{workspace.name}"? This action cannot be undone 
                                    and will remove all associated projects and tasks.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteWorkspace(workspace.id, workspace.name)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Workspace Dialog */}
      <Dialog open={!!editingWorkspace} onOpenChange={() => setEditingWorkspace(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Workspace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Workspace Name</Label>
              <Input
                id="edit-name"
                value={newWorkspace.name}
                onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                placeholder="Enter workspace name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={newWorkspace.description}
                onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                placeholder="Enter workspace description (optional)"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-color">Color</Label>
              <Input
                id="edit-color"
                type="color"
                value={newWorkspace.color}
                onChange={(e) => setNewWorkspace({ ...newWorkspace, color: e.target.value })}
                className="w-full h-10"
              />
            </div>
            <Button onClick={handleUpdateWorkspace} className="w-full">
              Update Workspace
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Members Dialog */}
      <Dialog open={!!managingMembers} onOpenChange={() => setManagingMembers(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Members - {managingMembers?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {managingMembers && (
              <WorkspaceMemberManager
                workspace={managingMembers}
                users={users}
                onAddMember={handleAddMember}
                onRemoveMember={handleRemoveMember}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const WorkspaceMemberManager = ({ workspace, users, onAddMember, onRemoveMember }) => {
  const { getWorkspaceMembers } = useWorkspaceMembers();
  const [members, setMembers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => {
    const loadMembers = async () => {
      const workspaceMembers = await getWorkspaceMembers(workspace.id);
      setMembers(workspaceMembers);
    };
    loadMembers();
  }, [workspace.id, getWorkspaceMembers]);

  const handleAddMember = async () => {
    if (!selectedUser) return;
    await onAddMember(workspace.id, selectedUser);
    setSelectedUser('');
    // Reload members
    const workspaceMembers = await getWorkspaceMembers(workspace.id);
    setMembers(workspaceMembers);
  };

  const handleRemoveMember = async (userId) => {
    await onRemoveMember(workspace.id, userId);
    // Reload members
    const workspaceMembers = await getWorkspaceMembers(workspace.id);
    setMembers(workspaceMembers);
  };

  const availableUsers = users.filter(user => 
    !members.some(member => member.user_id === user.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Select value={selectedUser} onValueChange={setSelectedUser}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a user to add" />
          </SelectTrigger>
          <SelectContent>
            {availableUsers.map(user => (
              <SelectItem key={user.id} value={user.id}>
                {user.full_name} ({user.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleAddMember} disabled={!selectedUser}>
          Add Member
        </Button>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Current Members ({members.length})</h4>
        {members.length === 0 ? (
          <p className="text-gray-500 text-sm">No members assigned to this workspace.</p>
        ) : (
          <div className="space-y-2">
            {members.map(member => {
              const user = users.find(u => u.id === member.user_id);
              return (
                <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">
                      {user?.initials || 'UN'}
                    </div>
                    <div>
                      <div className="font-medium">{user?.full_name || 'Unknown User'}</div>
                      <div className="text-sm text-gray-500">{user?.email}</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.user_id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};