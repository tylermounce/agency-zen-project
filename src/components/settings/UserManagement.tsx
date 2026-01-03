import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, ShieldCheck, MoreHorizontal, Users, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { formatters } from '@/lib/timezone';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  last_sign_in_at: string;
  role: 'admin' | 'user' | null;
  allRoles: ('admin' | 'user')[];
}

export const UserManagement = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  // Delete user state
  const [userToDelete, setUserToDelete] = useState<UserWithRole | null>(null);
  const [deleteUserDialog, setDeleteUserDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch all users from profiles table with their roles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine the data
      const usersWithRoles = profilesData.map(user => {
        const userRoles = rolesData.filter(role => role.user_id === user.id);
        const primaryRole = userRoles.find(role => role.role === 'admin') || userRoles[0];
        
        return {
          id: user.id,
          email: user.email || '',
          full_name: user.full_name || user.email || '',
          created_at: user.created_at,
          last_sign_in_at: '',
          role: primaryRole?.role || null,
          allRoles: userRoles.map(role => role.role)
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      // Check if role already exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', newRole)
        .single();

      if (existingRole) {
        toast({
          title: "Role already exists",
          description: `User already has the ${newRole} role.`,
          variant: "destructive",
        });
        return;
      }

      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (error) throw error;

      // Refresh users
      await fetchUsers();

      toast({
        title: "Role added",
        description: `${newRole.charAt(0).toUpperCase() + newRole.slice(1)} role has been added.`,
      });
    } catch (error) {
      console.error('Error adding user role:', error);
      toast({
        title: "Error",
        description: "Failed to add user role.",
        variant: "destructive",
      });
    }
  };

  const removeSpecificRole = async (userId: string, roleToRemove: 'admin' | 'user') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', roleToRemove);

      if (error) throw error;

      // Refresh users
      await fetchUsers();

      toast({
        title: "Role removed",
        description: `${roleToRemove.charAt(0).toUpperCase() + roleToRemove.slice(1)} role has been removed.`,
      });
    } catch (error) {
      console.error('Error removing user role:', error);
      toast({
        title: "Error",
        description: "Failed to remove user role.",
        variant: "destructive",
      });
    }
  };

  const removeUserRole = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: null } : user
      ));

      toast({
        title: "Role removed",
        description: "User role has been removed.",
      });
    } catch (error) {
      console.error('Error removing user role:', error);
      toast({
        title: "Error",
        description: "Failed to remove user role.",
        variant: "destructive",
      });
    }
  };

  const getUserInitials = (name: string, email: string) => {
    if (name && name !== email) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);

    try {
      // Delete user roles first
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userToDelete.id);

      // Delete workspace memberships
      await supabase
        .from('workspace_members')
        .delete()
        .eq('user_id', userToDelete.id);

      // Delete the user's profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id);

      if (profileError) throw profileError;

      toast({
        title: "User removed",
        description: `${userToDelete.full_name || userToDelete.email} has been removed from the account.`,
      });

      setDeleteUserDialog(false);
      setUserToDelete(null);
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to remove user. They may still have associated data.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>User Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-gray-600">
                Manage user roles and permissions. Users can have multiple roles - admins can access all features and manage others, while users have basic access. Multiple admins are supported.
              </p>
              <Badge variant="outline" className="text-xs">
                {users.length} total users
              </Badge>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Roles & Permissions</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {getUserInitials(user.full_name, user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.allRoles && user.allRoles.length > 0 ? (
                          user.allRoles.map((role) => (
                            <Badge 
                              key={role}
                              variant={role === 'admin' ? 'default' : 'secondary'}
                              className="flex items-center space-x-1 text-xs"
                            >
                              {role === 'admin' ? (
                                <ShieldCheck className="w-3 h-3" />
                              ) : (
                                <Shield className="w-3 h-3" />
                              )}
                              <span className="capitalize">{role}</span>
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline">No roles</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatters.dateOnly(user.created_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => addUserRole(user.id, 'admin')}
                            disabled={user.allRoles?.includes('admin')}
                          >
                            Add Admin Role
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => addUserRole(user.id, 'user')}
                            disabled={user.allRoles?.includes('user')}
                          >
                            Add User Role
                          </DropdownMenuItem>
                          {user.allRoles?.includes('admin') && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  Remove Admin Role
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Admin Role</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove the admin role from {user.full_name}? 
                                    They will lose administrator privileges.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => removeSpecificRole(user.id, 'admin')}>
                                    Remove Admin Role
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          {user.allRoles?.includes('user') && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  Remove User Role
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove User Role</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove the user role from {user.full_name}?
                                    They will lose basic user access.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => removeSpecificRole(user.id, 'user')}>
                                    Remove User Role
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          {user.id !== currentUser?.id && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setUserToDelete(user);
                                  setDeleteUserDialog(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove User
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={deleteUserDialog} onOpenChange={setDeleteUserDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User from Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {userToDelete?.full_name || userToDelete?.email} from the account?
              This will remove all their roles, workspace memberships, and profile data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
            >
              {deleting ? 'Removing...' : 'Remove User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};