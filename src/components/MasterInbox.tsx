
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { TextareaWithMentions } from '@/components/TextareaWithMentions';
import { FileUploadArea } from '@/components/FileUploadArea';
import { MentionHighlight } from '@/components/MentionHighlight';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Search, Inbox, MessageSquare, Hash, User, ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatters } from '@/lib/timezone';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const { users, loading: usersLoading } = useUsers();
  const { conversations, messages, sendMessage, createConversation, fetchMessages, loadMoreMessages, threadPagination } = useMessaging();

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
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'dm' | 'channel' | 'project'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const workspaceNames = workspaces.map(w => w.name);
  const projectTitles = projects.map(p => p.title);

  // Map workspace ID to workspace name
  const getWorkspaceName = (workspaceId: string | null) => {
    if (!workspaceId) return null;
    const workspace = workspaces.find(w => w.id === workspaceId);
    return workspace?.name || workspaceId;
  };

  const getThreadIcon = (type: string) => {
    switch (type) {
      case 'project': return <MessageSquare className="w-4 h-4" />;
      case 'dm': return <User className="w-4 h-4" />;
      case 'channel': return <Hash className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'dm':
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">DM</Badge>;
      case 'channel':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Channel</Badge>;
      case 'project':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Project</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Filter conversations based on type and search
  const filteredConversations = conversations.filter(conv => {
    const matchesType = filterType === 'all' || conv.thread_type === filterType;
    const matchesSearch = !searchQuery ||
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conv.workspace_id && getWorkspaceName(conv.workspace_id)?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  // Count conversations by type
  const typeCounts = {
    all: conversations.length,
    dm: conversations.filter(c => c.thread_type === 'dm').length,
    channel: conversations.filter(c => c.thread_type === 'channel').length,
    project: conversations.filter(c => c.thread_type === 'project').length,
  };

  const getUserById = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) return;

    const conversation = conversations.find(c => c.thread_id === selectedThread);
    if (!conversation) return;

    try {
      const result = await sendMessage(
        newMessage,
        conversation.thread_type,
        conversation.thread_id,
        conversation.workspace_id || undefined
      );
      
      // Note: Notifications are already created in useMessaging.sendMessage
      // No need to create them again here to avoid duplicates
      
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
        const result = await sendMessage(
          newMessageContent,
          conversation.thread_type,
          conversation.thread_id,
          conversation.workspace_id || undefined
        );
        
        // Note: Notifications are already created in useMessaging.sendMessage
        // No need to create them again here to avoid duplicates
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
  const currentPagination = selectedThread ? threadPagination[selectedThread] : undefined;

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
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search conversations..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Filter Tabs */}
            <div className="flex gap-1">
              <Button
                variant={filterType === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterType('all')}
                className="text-xs"
              >
                All ({typeCounts.all})
              </Button>
              <Button
                variant={filterType === 'dm' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterType('dm')}
                className="text-xs"
              >
                <User className="w-3 h-3 mr-1" />
                DMs ({typeCounts.dm})
              </Button>
              <Button
                variant={filterType === 'channel' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterType('channel')}
                className="text-xs"
              >
                <Hash className="w-3 h-3 mr-1" />
                Channels ({typeCounts.channel})
              </Button>
              <Button
                variant={filterType === 'project' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterType('project')}
                className="text-xs"
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                Projects ({typeCounts.project})
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-1 p-2">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => {
                    setSelectedThread(conversation.thread_id);
                    // Delay marking as read so user can see the unread indicator
                    setTimeout(() => {
                      markThreadAsRead(conversation.thread_id);
                    }, 1000);
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedThread === conversation.thread_id
                      ? 'bg-blue-50 border-blue-200 border'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        {getThreadIcon(conversation.thread_type)}
                        {hasUnreadInThread(conversation.thread_id) && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <h4 className="font-medium text-sm truncate flex-1">{conversation.title}</h4>
                      {getUnreadCountForThread(conversation.thread_id) > 0 && (
                        <Badge variant="destructive" className="text-xs px-1 py-0 min-w-[16px] h-4 flex-shrink-0">
                          {getUnreadCountForThread(conversation.thread_id)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      {getTypeBadge(conversation.thread_type)}
                    </div>
                  </div>
                  {conversation.workspace_id && (
                    <p className="text-xs text-gray-500 mb-1 truncate">{getWorkspaceName(conversation.workspace_id)}</p>
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
                        ? formatters.dateOnly(conversation.last_message_at)
                        : formatters.dateOnly(conversation.created_at)
                      }
                    </span>
                  </div>
                </div>
              ))}
              {filteredConversations.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  {searchQuery || filterType !== 'all' ? (
                    <>
                      <p>No conversations match your filter</p>
                      <p className="text-sm">Try adjusting your search or filter</p>
                    </>
                  ) : (
                    <>
                      <p>No conversations yet</p>
                      <p className="text-sm">Start a new message to begin</p>
                    </>
                  )}
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
                      {getWorkspaceName(currentConversation.workspace_id)}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex-1 p-6 overflow-hidden">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-4">
                    {/* Load More Button */}
                    {currentPagination?.hasMore && currentMessages.length > 0 && (
                      <div className="text-center pb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadMoreMessages(selectedThread)}
                          disabled={currentPagination?.loading}
                        >
                          {currentPagination?.loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            'Load older messages'
                          )}
                        </Button>
                      </div>
                    )}
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
                                  {formatters.dateTime(message.created_at)}
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
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <TextareaWithMentions
                        placeholder="Type your message... Use @ to mention someone"
                        value={newMessage}
                        onChange={setNewMessage}
                        className="min-h-[60px] resize-none w-full"
                        workspaceId={currentConversation?.workspace_id}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-col space-y-2">
                      <FileUploadArea
                        onFilesChange={setAttachedFiles}
                        attachedFiles={attachedFiles}
                        className="shrink-0"
                      />
                      <Button size="icon" onClick={handleSendMessage} disabled={!newMessage.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
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
