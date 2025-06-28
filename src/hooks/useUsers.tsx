
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  full_name: string;
  initials: string;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .order('full_name');

        if (error) throw error;

        const formattedUsers = data.map(user => ({
          id: user.id,
          email: user.email || '',
          full_name: user.full_name || user.email || '',
          initials: user.full_name 
            ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
            : user.email?.substring(0, 2).toUpperCase() || 'UN'
        }));

        setUsers(formattedUsers);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { users, loading, error };
};
