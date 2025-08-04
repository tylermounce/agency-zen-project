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
    console.log('🔍 handleTextChange called:', { text, cursorPosition, workspaceId });
    
    const beforeCursor = text.substring(0, cursorPosition);
    // Match @ followed by any characters until we hit another @ or end of string
    const mentionMatch = beforeCursor.match(/@([^@]*)$/);
    
    console.log('🔍 Mention detection:', { beforeCursor, mentionMatch });
    
    if (mentionMatch) {
      const query = mentionMatch[1];
      const position = mentionMatch.index || 0;
      const suggestions = filterUsers(query);
      
      console.log('✅ Mention detected:', { query, position, suggestions: suggestions.map(s => s.full_name) });
      
      setMentionState({
        isActive: true,
        query,
        position,
        suggestions
      });
    } else {
      console.log('❌ No mention detected, deactivating');
      setMentionState(prev => ({ ...prev, isActive: false }));
    }
  }, [filterUsers, workspaceId]);

  // Handle user selection from mentions
  const handleUserSelect = useCallback((user: User, currentText: string, cursorPosition: number) => {
    console.log('🔍 handleUserSelect called:', { user: { id: user.id, full_name: user.full_name }, currentText, cursorPosition });
    
    const beforeCursor = currentText.substring(0, cursorPosition);
    const afterCursor = currentText.substring(cursorPosition);
    // Match @ followed by any characters until we hit another @ or end of string
    const mentionMatch = beforeCursor.match(/@([^@]*)$/);
    
    console.log('🔍 User select mention detection:', { beforeCursor, afterCursor, mentionMatch });
    
    if (mentionMatch) {
      const mentionStart = mentionMatch.index || 0;
      const beforeMention = currentText.substring(0, mentionStart);
      // Store the mention with user ID for backend processing, but display name for users
      const userMention = `@{userId:${user.id}} `;
      const newText = beforeMention + userMention + afterCursor;
      const newCursorPosition = beforeMention.length + userMention.length;
      
      console.log('✅ Building user mention:', {
        mentionStart,
        beforeMention,
        userMention,
        afterCursor,
        newText,
        newCursorPosition
      });
      
      setMentionState(prev => ({ ...prev, isActive: false }));
      
      return {
        text: newText,
        cursorPosition: newCursorPosition
      };
    }
    
    console.log('❌ No mention match found, returning unchanged');
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