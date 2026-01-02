import React from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { MentionHighlight } from '@/components/MentionHighlight';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatters } from '@/lib/timezone';
import { Notification } from '@/types';

interface InboxProps {
  workspaceId?: string; // Pass workspaceId for workspace-specific inbox
}

export const Inbox: React.FC<InboxProps> = ({ workspaceId }) => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead,
    deleteNotification,
    getNotificationsByType 
  } = useNotifications(workspaceId);

  const mentionNotifications = getNotificationsByType('mention');

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Navigate to the message/thread
    // You'll need to implement this based on your routing
    console.log('Navigate to:', notification.thread_id);
  };

  if (loading) {
    return <div>Loading notifications...</div>;
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          {workspaceId ? 'Workspace Inbox' : 'All Notifications'}
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount}</Badge>
          )}
        </CardTitle>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Mark All Read
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {notifications.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No notifications yet
          </p>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                !notification.is_read ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {notification.sender_name}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {notification.notification_type}
                    </Badge>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-2">
                    <MentionHighlight content={notification.content} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatters.dateTime(notification.created_at)}
                    </span>
                    <div className="flex gap-2">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          Mark Read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};