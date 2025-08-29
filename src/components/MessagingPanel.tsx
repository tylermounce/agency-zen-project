
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Search, Plus, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TextareaWithMentions } from '@/components/TextareaWithMentions';
import { FileUploadArea } from '@/components/FileUploadArea';
import { MentionHighlight } from '@/components/MentionHighlight';
import { useMessaging } from '@/hooks/useMessaging';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { formatters } from '@/lib/timezone';

import { useNotifications } from '@/hooks/useNotifications';
import { useUnifiedData } from '@/hooks/useUnifiedData';

interface MessagingPanelProps {
  workspaceId: string;
  selectedProjectThread?: string;
}

export const MessagingPanel = ({ workspaceId, selectedProjectThread }: MessagingPanelProps) => {
  const { user } = useAuth();
  const { users } = useUsers();
  const { conversations, messages, sendMessage, createConversation, fetchMessages, getProjectThreadId } = useMessaging();
  
  const { hasUnreadInThread, markThreadAsRead, getUnreadCountForThread } = useNotifications();
  const { getWorkspace, mapWorkspaceIdToName, getWorkspaceProjects } = useUnifiedData();
  const [selectedConversation, setSelectedConversation] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
  
  // New conversation dialog state - simplified to just project selection
  const [newConversationDialog, setNewConversationDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');

  // Get current workspace info using unified data
  const currentWorkspace = getWorkspace(workspaceId);
  const currentWorkspaceName = currentWorkspace?.name || mapWorkspaceIdToName(workspaceId);

  // Filter conversations for current workspace - include ALL project conversations for this workspace
  const workspaceConversations = conversations.filter(c => {
    // Include project conversations that belong to this workspace (by name)
    return c.thread_type === 'project' && c.workspace_id === currentWorkspaceName;
  });

  // Auto-select the project thread if provided
  useEffect(() => {
    if (selectedProjectThread) {
      // Find existing conversation for this project
      const existingThreadId = getProjectThreadId(selectedProjectThread, currentWorkspaceName);
      if (existingThreadId) {
        setSelectedConversation(existingThreadId);
        fetchMessages(existingThreadId);
      }
    }
  }, [selectedProjectThread, currentWorkspaceName, getProjectThreadId, fetchMessages]);

  const getUserById = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const conversation = conversations.find(c => c.thread_id === selectedConversation);
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
      // Message send failed - could implement error handling UI here
    }
  };

  const handleConversationSelect = (threadId: string) => {
    setSelectedConversation(threadId);
    fetchMessages(threadId);
    // Delay marking as read so user can see the unread indicator
    setTimeout(() => {
      markThreadAsRead(threadId);
    }, 1000);
  };

  const handleCreateProjectConversation = async () => {
    if (!selectedProject || !user) return;
    
    const project = getWorkspaceProjects(workspaceId).find(p => p.id === selectedProject);
    if (!project) return;
    
    try {
      // Create conversation using project title as the thread title
      const conversation = await createConversation(
        'project',
        project.title,
        [user.id],
        currentWorkspaceName || workspaceId
      );
      
      if (conversation) {
        setSelectedConversation(conversation.thread_id);
        fetchMessages(conversation.thread_id);
      }
      
      setNewConversationDialog(false);
      setSelectedProject('');
    } catch (error) {
      // Error creating conversation - could add user notification here
    }
  };

  const currentConversation = conversations.find(c => c.thread_id === selectedConversation);
  const currentMessages = selectedConversation ? messages[selectedConversation] || [] : [];
  const workspaceProjects = getWorkspaceProjects(workspaceId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Conversations List */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Project Messages
            </CardTitle>
            <Dialog open={newConversationDialog} onOpenChange={setNewConversationDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  New Project Thread
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start Project Conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="project-select">Select Project</Label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a project to message about" />
                      </SelectTrigger>
                      <SelectContent>
                        {workspaceProjects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setNewConversationDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateProjectConversation} disabled={!selectedProject}>
                      Start Messaging
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input placeholder="Search conversations..." className="pl-10" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 p-4">
              {workspaceConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationSelect(conversation.thread_id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation === conversation.thread_id
                      ? 'bg-blue-50 border-blue-200 border'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm truncate">{conversation.title}</h4>
                      {hasUnreadInThread(conversation.thread_id) && (
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      )}
                      {getUnreadCountForThread(conversation.thread_id) > 0 && (
                        <Badge variant="destructive" className="text-xs px-1 py-0 min-w-[16px] h-4">
                          {getUnreadCountForThread(conversation.thread_id)}
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Project
                    </Badge>
                  </div>
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
              {workspaceConversations.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  <p className="mb-2">No project conversations yet</p>
                  <p className="text-sm">Select a project above to start messaging</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="lg:col-span-2">
        {currentConversation ? (
          <>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col">
                    <h3 className="font-semibold">{currentConversation.title}</h3>
                    <p className="text-sm text-gray-500">Project Thread</p>
                  </div>
                  <div className="flex -space-x-1">
                    {currentConversation.participants.map((participantId, index) => {
                      const participant = getUserById(participantId);
                      return (
                        <Avatar key={index} className="w-6 h-6 border border-white">
                          <AvatarFallback className="text-xs">
                            {participant?.initials || 'UN'}
                          </AvatarFallback>
                        </Avatar>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {currentMessages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <p>No messages yet</p>
                      <p className="text-sm">Start the project conversation below</p>
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
              
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <TextareaWithMentions
                      value={newMessage}
                      onChange={setNewMessage}
                      placeholder="Message this project team... Use @ to mention someone"
                      className="min-h-[60px] resize-none w-full"
                      workspaceId={workspaceId}
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
            </CardContent>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 h-full">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Select a project to message about</p>
              <p className="text-sm">Choose from your project conversations on the left or create a new one</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
