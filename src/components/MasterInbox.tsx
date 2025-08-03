
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { TextareaWithMentions } from '@/components/TextareaWithMentions';
import { MentionHighlight } from '@/components/MentionHighlight';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Search, Inbox, MessageSquare, Hash, User, ArrowLeft, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotificationCreation } from '@/hooks/useNotificationCreation';
import { useNotifications } from '@/hooks/useNotifications';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMessaging } from '@/hooks/useMessaging';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { useUnifiedData } from '@/hooks/useUnifiedData';

interface MasterInboxProps {
  userId: string;
  onBack: () => void;
}

export const MasterInbox = ({ userId, onBack }: MasterInboxProps) => {
  const { user } = useAuth();
  const { users, loading: usersLoading } = useUsers();
  const { conversations, messages, sendMessage, createConversation, fetchMessages } = useMessaging();
  const { createMentionNotifications } = useNotificationCreation();
  const { notifications, unreadCount, hasUnreadInThread, markThreadAsRead, getUnreadCountForThread } = useNotifications();
  const { workspaces, projects } = useUnifiedData();
  
  const [selectedThread, setSelectedThread] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [messageType, setMessageType] = useState('dm');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [newMessageContent, setNewMessageContent] = useState('');

  const workspaceNames = workspaces.map(w => w.name);
  const projectTitles = projects.map(p => p.title);

  const getThreadIcon = (type: string) => {
    switch (type) {
      case 'project': return <MessageSquare className="w-4 h-4" />;
      case 'dm': return <User className="w-4 h-4" />;
      case 'channel': return <Hash className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getUserById = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) return;

    const conversation = conversations.find(c => c.thread_id === selectedThread);
    if (!conversation) return;

    try {
      await sendMessage(
        newMessage,
        conversation.thread_type,
        conversation.thread_id,
        conversation.workspace_id || undefined
      );
      
      // Create notifications for mentioned users
      await createMentionNotifications(
        newMessage.trim(),
        conversation.thread_id,
        conversation.thread_type,
        conversation.workspace_id || undefined
      );
      
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleNewMessage = async () => {
    if (!user) return;

    try {
      let title = '';
      let participants: string[] = [];
      let workspaceId: string | undefined;

      if (messageType === 'dm') {
        if (!selectedUser) return;
        const targetUser = users.find(u => u.id === selectedUser);
        title = `DM with ${targetUser?.full_name || 'Unknown User'}`;
        participants = [selectedUser];
      } else if (messageType === 'project') {
        if (!selectedProject || !selectedWorkspace) return;
        title = selectedProject;
        participants = []; // Could be expanded to include project members
        workspaceId = selectedWorkspace;
      }

      const conversation = await createConversation(
        messageType,
        title,
        participants,
        workspaceId
      );

      if (conversation && newMessageContent.trim()) {
        await sendMessage(
          newMessageContent,
          conversation.thread_type,
          conversation.thread_id,
          conversation.workspace_id || undefined
        );
        
        // Create notifications for mentioned users
        await createMentionNotifications(
          newMessageContent.trim(),
          conversation.thread_id,
          conversation.thread_type,
          conversation.workspace_id || undefined
        );
      }

      // Reset form
      setShowNewMessageDialog(false);
      setSelectedUser('');
      setSelectedProject('');
      setSelectedWorkspace('');
      setNewMessageContent('');
      setMessageType('dm');
      
      // Select the new conversation
      if (conversation) {
        setSelectedThread(conversation.thread_id);
        await fetchMessages(conversation.thread_id);
      }
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  // Load messages when thread is selected
  React.useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread);
    }
  }, [selectedThread, fetchMessages]);

  const currentConversation = conversations.find(c => c.thread_id === selectedThread);
  const currentMessages = selectedThread ? messages[selectedThread] || [] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" onClick={onBack} className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Inbox className="w-6 h-6" />
            <h1 className="text-2xl font-semibold text-gray-900">Master Inbox</h1>
            <Badge variant="secondary">{conversations.length} conversations</Badge>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <Button onClick={() => setShowNewMessageDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Message
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Conversations List */}
        <div className="w-80 bg-white border-r border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Search conversations..." className="pl-10" />
            </div>
          </div>
          <ScrollArea className="h-full">
            <div className="space-y-1 p-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => {
                    setSelectedThread(conversation.thread_id);
                    markThreadAsRead(conversation.thread_id);
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedThread === conversation.thread_id
                      ? 'bg-blue-50 border-blue-200 border'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        {getThreadIcon(conversation.thread_type)}
                        {hasUnreadInThread(conversation.thread_id) && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                      <h4 className="font-medium text-sm truncate">{conversation.title}</h4>
                      {getUnreadCountForThread(conversation.thread_id) > 0 && (
                        <Badge variant="destructive" className="text-xs px-1 py-0 min-w-[16px] h-4">
                          {getUnreadCountForThread(conversation.thread_id)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {conversation.workspace_id && (
                    <p className="text-xs text-gray-500 mb-1">{conversation.workspace_id}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-1">
                      {conversation.participants.slice(0, 3).map((participantId, index) => {
                        const participant = getUserById(participantId);
                        return (
                          <Avatar key={index} className="w-5 h-5 border border-white">
                            <AvatarFallback className="text-xs">
                              {participant?.initials || 'UN'}
                            </AvatarFallback>
                          </Avatar>
                        );
                      })}
                      {conversation.participants.length > 3 && (
                        <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                          +{conversation.participants.length - 3}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {conversation.last_message_at 
                        ? new Date(conversation.last_message_at).toLocaleDateString()
                        : new Date(conversation.created_at).toLocaleDateString()
                      }
                    </span>
                  </div>
                </div>
              ))}
              {conversations.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  <p>No conversations yet</p>
                  <p className="text-sm">Start a new message to begin</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {currentConversation ? (
            <>
              <div className="bg-white border-b border-gray-100 p-4">
                <div className="flex items-center space-x-3">
                  {getThreadIcon(currentConversation.thread_type)}
                  <h3 className="font-semibold">{currentConversation.title}</h3>
                  {currentConversation.workspace_id && (
                    <Badge variant="outline" className="text-xs">
                      {currentConversation.workspace_id}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex-1 p-6 overflow-hidden">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-4">
                    {currentMessages.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <p>No messages yet</p>
                        <p className="text-sm">Start the conversation below</p>
                      </div>
                    ) : (
                      currentMessages.map((message) => {
                        const sender = getUserById(message.sender_id);
                        const isCurrentUser = message.sender_id === user?.id;
                        return (
                          <div key={message.id} className={`flex space-x-3 ${isCurrentUser ? 'justify-end' : ''}`}>
                            {!isCurrentUser && (
                              <Avatar className="w-8 h-8">
                                <AvatarFallback>{sender?.initials || 'UN'}</AvatarFallback>
                              </Avatar>
                            )}
                            <div className={`flex-1 space-y-1 max-w-xs ${isCurrentUser ? 'items-end' : ''}`}>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-sm">
                                  {isCurrentUser ? 'You' : (sender?.full_name || 'Unknown User')}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(message.created_at).toLocaleString()}
                                </span>
                              </div>
                              <div className={`rounded-lg p-3 text-sm ${
                                isCurrentUser 
                                  ? 'bg-blue-500 text-white ml-auto' 
                                  : 'bg-gray-50'
                              }`}>
                                <MentionHighlight content={message.content} />
                              </div>
                            </div>
                            {isCurrentUser && (
                              <Avatar className="w-8 h-8">
                                <AvatarFallback>{sender?.initials || 'YU'}</AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
              
              <div className="bg-white border-t border-gray-100 p-4">
                <div className="flex space-x-2">
                  <TextareaWithMentions
                    placeholder="Type your message... Use @ to mention someone"
                    value={newMessage}
                    onChange={setNewMessage}
                    className="min-h-[60px] resize-none"
                    workspaceId={currentConversation?.workspace_id}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Select a conversation to start messaging</p>
                <p className="text-sm">Choose from your conversations on the left, or start a new message</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Message Dialog */}
      <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Message Type</label>
              <Select value={messageType} onValueChange={setMessageType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dm">Direct Message</SelectItem>
                  <SelectItem value="project">Project Thread</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {messageType === 'dm' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Send to</label>
                <Select value={selectedUser} onValueChange={setSelectedUser} disabled={usersLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={usersLoading ? "Loading users..." : "Select a user"} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(u => u.id !== user?.id).map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name} ({user.initials})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {messageType === 'project' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Workspace</label>
                  <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select workspace" />
                    </SelectTrigger>
                    <SelectContent>
                      {workspaceNames.map((workspaceName) => (
                        <SelectItem key={workspaceName} value={workspaceName}>
                          {workspaceName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project</label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectTitles.map((projectTitle) => (
                        <SelectItem key={projectTitle} value={projectTitle}>
                          {projectTitle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <TextareaWithMentions
                placeholder="Type your message... Use @ to mention someone"
                value={newMessageContent}
                onChange={setNewMessageContent}
                className="min-h-[100px]"
                workspaceId={messageType === 'project' ? selectedWorkspace : undefined}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowNewMessageDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleNewMessage}
              disabled={
                (messageType === 'dm' && !selectedUser) || 
                (messageType === 'project' && (!selectedProject || !selectedWorkspace)) ||
                !newMessageContent.trim()
              }
            >
              Send Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
