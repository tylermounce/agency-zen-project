import { useState, useCallback, useEffect } from 'react';
import { useUsers } from '@/hooks/useUsers';
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers';

interface User {
  id: string;
  full_name: string | null;
  email: string | null;
  initials: string;
}

interface MentionState {
  isActive: boolean;
  query: string;
  position: number;
  suggestions: User[];
}

export const useUserMentions = (workspaceId?: string) => {
  const { users } = useUsers();
  const { getWorkspaceMembers } = useWorkspaceMembers();
  const [mentionState, setMentionState] = useState<MentionState>({
    isActive: false,
    query: '',
    position: 0,
    suggestions: []
  });
  const [workspaceUsers, setWorkspaceUsers] = useState<User[]>([]);

  // Fetch workspace members when workspaceId changes
  useEffect(() => {
    const fetchWorkspaceUsers = async () => {
      if (!workspaceId) {
        setWorkspaceUsers(users);
        return;
      }
      
      try {
        const members = await getWorkspaceMembers(workspaceId);
        const memberUserIds = members.map(member => member.user_id);
        const filteredUsers = users.filter(user => memberUserIds.includes(user.id));
        setWorkspaceUsers(filteredUsers);
      } catch (error) {
        // Fallback to all users if workspace member fetch fails
        setWorkspaceUsers(users);
      }
    };

    fetchWorkspaceUsers();
  }, [workspaceId, users, getWorkspaceMembers]);

  // Filter users based on mention query
  const filterUsers = useCallback((query: string) => {
    if (!query) return workspaceUsers.slice(0, 5);
    
    const lowercaseQuery = query.toLowerCase();
    return workspaceUsers
      .filter(user => {
        const fullNameMatch = user.full_name?.toLowerCase().includes(lowercaseQuery);
        return fullNameMatch;
      })
      .slice(0, 5);
  }, [workspaceUsers]);

  // Handle text input changes to detect @ mentions
  const handleTextChange = useCallback((text: string, cursorPosition: number) => {
    const beforeCursor = text.substring(0, cursorPosition);
    // Match @ followed by any characters until we hit another @ or end of string
    const mentionMatch = beforeCursor.match(/@([^@]*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1];
      const position = mentionMatch.index || 0;
      const suggestions = filterUsers(query);
      
      setMentionState({
        isActive: true,
        query,
        position,
        suggestions
      });
    } else {
      setMentionState(prev => ({ ...prev, isActive: false }));
    }
  }, [filterUsers]);

  // Handle user selection from mentions
  const handleUserSelect = useCallback((user: User, currentText: string, cursorPosition: number) => {
    const beforeCursor = currentText.substring(0, cursorPosition);
    const afterCursor = currentText.substring(cursorPosition);
    // Match @ followed by any characters until we hit another @ or end of string
    const mentionMatch = beforeCursor.match(/@([^@]*)$/);
    
    if (mentionMatch) {
      const mentionStart = mentionMatch.index || 0;
      const beforeMention = currentText.substring(0, mentionStart);
      // Use the user's full name for the mention, with proper spacing
      const userMention = `@${user.full_name || 'Unknown User'} `;
      const newText = beforeMention + userMention + afterCursor;
      const newCursorPosition = beforeMention.length + userMention.length;
      
      setMentionState(prev => ({ ...prev, isActive: false }));
      
      return {
        text: newText,
        cursorPosition: newCursorPosition
      };
    }
    
    return { text: currentText, cursorPosition };
  }, []);

  const closeMentions = useCallback(() => {
    setMentionState(prev => ({ ...prev, isActive: false }));
  }, []);

  return {
    mentionState,
    handleTextChange,
    handleUserSelect,
    closeMentions
  };
};