import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Search, Plus, MessageSquare, Paperclip } from 'lucide-react';
import { TextareaWithMentions } from '@/components/TextareaWithMentions';
import { useMessaging } from '@/hooks/useMessaging';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { useUnifiedData } from '@/hooks/useUnifiedData';

interface MessagingPanelProps {
  workspaceId: string;
  selectedProjectThread?: string;
}

export const MessagingPanel = ({ workspaceId, selectedProjectThread }: MessagingPanelProps) => {
  const { user } = useAuth();
  const { users } = useUsers();
  const { conversations, messages, sendMessage, createConversation, fetchMessages, getProjectThreadId } = useMessaging();
  const { getWorkspace, mapWorkspaceIdToName } = useUnifiedData();
  const [selectedConversation, setSelectedConversation] = useState('');
  const [newMessage, setNewMessage] = useState('');

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
      await sendMessage(
        newMessage,
        conversation.thread_type,
        conversation.thread_id,
        conversation.workspace_id || undefined
      );
      setNewMessage('');
    } catch (err) {
      // Message send failed - could implement error handling UI here
    }
  };

  const handleConversationSelect = (threadId: string) => {
    setSelectedConversation(threadId);
    fetchMessages(threadId);
  };

  const currentConversation = conversations.find(c => c.thread_id === selectedConversation);
  const currentMessages = selectedConversation ? messages[selectedConversation] || [] : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Conversations List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Project Messages
            </CardTitle>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              New Message
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input placeholder="Search conversations..." className="pl-10" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="space-y-1 p-4">
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
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm truncate">{conversation.title}</h4>
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
                        ? new Date(conversation.last_message_at).toLocaleDateString()
                        : new Date(conversation.created_at).toLocaleDateString()
                      }
                    </span>
                  </div>
                </div>
              ))}
              {workspaceConversations.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  <p>No project conversations yet</p>
                  <p className="text-sm">Start messaging from the Master Inbox</p>
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
                  <h3 className="font-semibold">{currentConversation.title}</h3>
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
                              {message.content}
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
              
              <div className="flex space-x-2">
                <TextareaWithMentions
                  value={newMessage}
                  onChange={setNewMessage}
                  placeholder="Type your message... Use @ to mention someone"
                  className="min-h-[60px] resize-none"
                  workspaceId={workspaceId}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <div className="flex flex-col space-y-2">
                  <Button size="icon" variant="outline">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button size="icon" onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 h-full">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Select a project conversation</p>
              <p className="text-sm">Choose from your project conversations on the left</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
