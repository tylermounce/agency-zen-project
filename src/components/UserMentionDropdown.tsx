import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface User {
  id: string;
  full_name: string | null;
  email: string | null;
  initials: string;
}

interface UserMentionDropdownProps {
  users: User[];
  isVisible: boolean;
  onUserSelect: (user: User) => void;
  position: { top: number; left: number };
}

export const UserMentionDropdown: React.FC<UserMentionDropdownProps> = ({
  users,
  isVisible,
  onUserSelect,
  position
}) => {
  if (!isVisible || users.length === 0) return null;

  return (
    <div
      className="fixed z-50 bg-background border border-border rounded-lg shadow-lg max-w-xs w-64"
      style={{
        top: position.top,
        left: position.left
      }}
    >
      <div className="p-2">
        <div className="text-xs text-muted-foreground mb-2 px-2">Mention someone</div>
        <div className="space-y-1">
          {users.map((user) => (
            <div
              key={user.id}
              onClick={() => onUserSelect(user)}
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
            >
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs">
                  {user.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {user.full_name || 'Unknown User'}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {user.email}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};