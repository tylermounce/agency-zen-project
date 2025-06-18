
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Search, Plus, MessageSquare, Paperclip } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MessagingPanelProps {
  workspaceId: string;
}

export const MessagingPanel = ({ workspaceId }: MessagingPanelProps) => {
  const [selectedConversation, setSelectedConversation] = useState('1');
  const [newMessage, setNewMessage] = useState('');

  const conversations = [
    {
      id: '1',
      title: 'Q4 Social Media Campaign',
      lastMessage: 'The Instagram templates look great! Ready for review.',
      timestamp: '2 hours ago',
      unread: 3,
      participants: ['JD', 'SM', 'KL'],
      type: 'project'
    },
    {
      id: '2',
      title: 'Brand Identity Feedback',
      lastMessage: 'Client approved the color palette. Moving to logo concepts.',
      timestamp: '1 day ago',
      unread: 0,
      participants: ['AM', 'RK'],
      type: 'project'
    },
    {
      id: '3',
      title: 'Team Standup',
      lastMessage: 'Daily standup at 9 AM tomorrow',
      timestamp: '2 days ago',
      unread: 1,
      participants: ['JD', 'SM', 'AM', 'RK', 'KL', 'TW'],
      type: 'general'
    }
  ];

  const messages = [
    {
      id: '1',
      sender: 'SM',
      content: 'Hey team! I\'ve finished the Instagram post templates for the Q4 campaign. They\'re ready for review.',
      timestamp: '2 hours ago',
      attachments: ['instagram-templates.zip']
    },
    {
      id: '2',
      sender: 'JD',
      content: 'Great work! The templates look fantastic. I especially love the color scheme consistency.',
      timestamp: '1 hour ago',
      attachments: []
    },
    {
      id: '3',
      sender: 'KL',
      content: 'Agreed! Should we schedule a client review for tomorrow?',
      timestamp: '45 minutes ago',
      attachments: []
    }
  ];

  const sendMessage = () => {
    if (newMessage.trim()) {
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Conversations List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Messages
            </CardTitle>
            <Button size="sm">
              <Plus className="w-4 h-4" />
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
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation === conversation.id
                      ? 'bg-blue-50 border-blue-200 border'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm truncate">{conversation.title}</h4>
                    {conversation.unread > 0 && (
                      <Badge className="bg-blue-500 text-white text-xs px-2 py-1">
                        {conversation.unread}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {conversation.lastMessage}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-1">
                      {conversation.participants.slice(0, 3).map((participant, index) => (
                        <Avatar key={index} className="w-5 h-5 border border-white">
                          <AvatarFallback className="text-xs">{participant}</AvatarFallback>
                        </Avatar>
                      ))}
                      {conversation.participants.length > 3 && (
                        <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                          +{conversation.participants.length - 3}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{conversation.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="font-semibold">
                {conversations.find(c => c.id === selectedConversation)?.title}
              </h3>
              <div className="flex -space-x-1">
                {conversations
                  .find(c => c.id === selectedConversation)
                  ?.participants.map((participant, index) => (
                    <Avatar key={index} className="w-6 h-6 border border-white">
                      <AvatarFallback className="text-xs">{participant}</AvatarFallback>
                    </Avatar>
                  ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="flex space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>{message.sender}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{message.sender}</span>
                      <span className="text-xs text-gray-500">{message.timestamp}</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      {message.content}
                    </div>
                    {message.attachments.length > 0 && (
                      <div className="flex items-center space-x-2 mt-2">
                        {message.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center space-x-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            <Paperclip className="w-3 h-3" />
                            <span>{attachment}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="flex space-x-2">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <div className="flex flex-col space-y-2">
              <Button size="icon" variant="outline">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button size="icon" onClick={sendMessage}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
