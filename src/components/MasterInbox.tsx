
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Search, Inbox, MessageSquare, Hash, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MasterInboxProps {
  userId: string;
}

export const MasterInbox = ({ userId }: MasterInboxProps) => {
  const [selectedThread, setSelectedThread] = useState('1');
  const [newMessage, setNewMessage] = useState('');

  // All threads across workspaces and DMs
  const allThreads = [
    {
      id: '1',
      type: 'project',
      workspace: 'TechCorp Inc.',
      title: 'Q4 Social Media Campaign',
      lastMessage: 'The Instagram templates look great! Ready for review.',
      timestamp: '2 hours ago',
      unread: 3,
      participants: ['JD', 'SM', 'KL']
    },
    {
      id: '2',
      type: 'dm',
      workspace: null,
      title: 'Sarah Mitchell',
      lastMessage: 'Can you review the brand guidelines when you have a moment?',
      timestamp: '4 hours ago',
      unread: 1,
      participants: ['SM']
    },
    {
      id: '3',
      type: 'project',
      workspace: 'Fashion Forward',
      title: 'Spring Collection Launch',
      lastMessage: 'Photography session scheduled for next week',
      timestamp: '1 day ago',
      unread: 0,
      participants: ['AM', 'TW']
    },
    {
      id: '4',
      type: 'channel',
      workspace: 'Internal Projects',
      title: '#general',
      lastMessage: 'Team meeting moved to 3 PM tomorrow',
      timestamp: '1 day ago',
      unread: 2,
      participants: ['JD', 'SM', 'AM', 'RK', 'KL', 'TW']
    },
    {
      id: '5',
      type: 'dm',
      workspace: null,
      title: 'Alex Morgan',
      lastMessage: 'Thanks for the feedback on the designs!',
      timestamp: '2 days ago',
      unread: 0,
      participants: ['AM']
    }
  ];

  const messages = [
    {
      id: '1',
      sender: 'SM',
      content: 'Hey! I\'ve finished the Instagram post templates for the Q4 campaign. They\'re ready for review.',
      timestamp: '2 hours ago'
    },
    {
      id: '2',
      sender: 'JD',
      content: 'Great work! The templates look fantastic. I especially love the color scheme consistency.',
      timestamp: '1 hour ago'
    },
    {
      id: '3',
      sender: 'KL',
      content: 'Agreed! Should we schedule a client review for tomorrow?',
      timestamp: '45 minutes ago'
    }
  ];

  const getThreadIcon = (type: string) => {
    switch (type) {
      case 'project': return <MessageSquare className="w-4 h-4" />;
      case 'dm': return <User className="w-4 h-4" />;
      case 'channel': return <Hash className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-3">
          <Inbox className="w-6 h-6" />
          <h1 className="text-2xl font-semibold text-gray-900">Master Inbox</h1>
          <Badge variant="secondary">{allThreads.filter(t => t.unread > 0).length} unread</Badge>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Threads List */}
        <div className="w-80 bg-white border-r border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Search conversations..." className="pl-10" />
            </div>
          </div>
          <ScrollArea className="h-full">
            <div className="space-y-1 p-2">
              {allThreads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => setSelectedThread(thread.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedThread === thread.id
                      ? 'bg-blue-50 border-blue-200 border'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getThreadIcon(thread.type)}
                      <h4 className="font-medium text-sm truncate">{thread.title}</h4>
                    </div>
                    {thread.unread > 0 && (
                      <Badge className="bg-blue-500 text-white text-xs px-2 py-1">
                        {thread.unread}
                      </Badge>
                    )}
                  </div>
                  {thread.workspace && (
                    <p className="text-xs text-gray-500 mb-1">{thread.workspace}</p>
                  )}
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {thread.lastMessage}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-1">
                      {thread.participants.slice(0, 3).map((participant, index) => (
                        <Avatar key={index} className="w-5 h-5 border border-white">
                          <AvatarFallback className="text-xs">{participant}</AvatarFallback>
                        </Avatar>
                      ))}
                      {thread.participants.length > 3 && (
                        <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                          +{thread.participants.length - 3}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{thread.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-100 p-4">
            <div className="flex items-center space-x-3">
              {getThreadIcon(allThreads.find(t => t.id === selectedThread)?.type || 'project')}
              <h3 className="font-semibold">
                {allThreads.find(t => t.id === selectedThread)?.title}
              </h3>
              {allThreads.find(t => t.id === selectedThread)?.workspace && (
                <Badge variant="outline" className="text-xs">
                  {allThreads.find(t => t.id === selectedThread)?.workspace}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex-1 p-6">
            <ScrollArea className="h-full pr-4">
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
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          <div className="bg-white border-t border-gray-100 p-4">
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
              <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
