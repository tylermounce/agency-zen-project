
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare, Reply, Hash, Search, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { TextareaWithMentions } from '@/components/TextareaWithMentions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChannelDiscussionProps {
  workspaceId: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  thread_id: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

export const ChannelDiscussion = ({ workspaceId }: ChannelDiscussionProps) => {
  const { user } = useAuth();
  const [newPost, setNewPost] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<{ [key: string]: Profile }>({});
  const [loading, setLoading] = useState(true);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const threadId = `workspace-${workspaceId}-general`;

  useEffect(() => {
    fetchMessages();
    fetchProfiles();
  }, [workspaceId]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      // Error loading messages - could add user notification here
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email');

      if (error) throw error;
      
      const profileMap: { [key: string]: Profile } = {};
      data?.forEach(profile => {
        profileMap[profile.id] = profile;
      });
      setProfiles(profileMap);
    } catch (error) {
      // Error loading profiles - could add user notification here
    }
  };

  const handleNewPost = async () => {
    if (!newPost.trim() || !user) return;

    try {
      // Check if conversation exists for this thread
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('thread_id', threadId)
        .single();

      if (!existingConv) {
        // Create conversation if it doesn't exist
        await supabase
          .from('conversations')
          .insert({
            thread_id: threadId,
            thread_type: 'channel',
            title: 'General Discussion',
            workspace_id: workspaceId,
            participants: [user.id]
          });
      }

      // Insert the message
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newPost,
          sender_id: user.id,
          thread_id: threadId,
          thread_type: 'channel',
          workspace_id: workspaceId
        });

      if (error) throw error;

      setNewPost('');
      fetchMessages(); // Refresh messages
    } catch (error) {
      // Error posting message - could add user notification here
    }
  };

  const handleReply = (postId: string) => {
    // For now, just log - reply functionality can be enhanced later
    if (replyText.trim()) {
      setReplyText('');
      setReplyingTo(null);
    }
  };

  const handleEditMessage = (messageId: string, currentContent: string) => {
    setEditingMessage(messageId);
    setEditText(currentContent);
  };

  const saveEditMessage = async (messageId: string) => {
    if (!editText.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ content: editText })
        .eq('id', messageId);

      if (error) throw error;

      setEditingMessage(null);
      setEditText('');
      fetchMessages(); // Refresh messages
    } catch (error) {
      // Error updating message - could add user notification here
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      fetchMessages(); // Refresh messages
    } catch (error) {
      // Error deleting message - could add user notification here
    }
  };

  // Filter messages based on search term
  const filteredMessages = messages.filter(message => {
    const contentMatch = message.content.toLowerCase().includes(searchTerm.toLowerCase());
    const profile = profiles[message.sender_id];
    const authorMatch = profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       profile?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return contentMatch || authorMatch;
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  };

  const getAuthorInitials = (senderId: string) => {
    const profile = profiles[senderId];
    if (profile?.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return profile?.email?.substring(0, 2).toUpperCase() || 'U';
  };

  const getAuthorName = (senderId: string) => {
    const profile = profiles[senderId];
    return profile?.full_name || profile?.email || 'Unknown User';
  };

  if (loading) {
    return <div className="text-center py-8">Loading messages...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Channel Header */}
      <div className="flex items-center space-x-3">
        <Hash className="w-6 h-6 text-gray-500" />
        <h2 className="text-xl font-semibold">General Discussion</h2>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* New Post */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <TextareaWithMentions
              value={newPost}
              onChange={setNewPost}
              placeholder="Share an update, ask a question, or start a discussion... Use @ to mention someone"
              className="min-h-[100px] resize-none"
              workspaceId={workspaceId}
            />
            <div className="flex justify-end">
              <Button onClick={handleNewPost} disabled={!newPost.trim()}>
                <Send className="w-4 h-4 mr-2" />
                Post
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages Feed */}
      <div className="space-y-4">
        {filteredMessages.length === 0 && !searchTerm ? (
          <div className="text-center py-8 text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          filteredMessages.map((message) => (
            <Card key={message.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Main Message */}
                  <div className="flex space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>{getAuthorInitials(message.sender_id)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{getAuthorName(message.sender_id)}</span>
                          <span className="text-sm text-gray-500">{formatTimestamp(message.created_at)}</span>
                        </div>
                        {message.sender_id === user?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditMessage(message.id, message.content)}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteMessage(message.id)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      {editingMessage === message.id ? (
                        <div className="space-y-2">
                          <TextareaWithMentions
                            value={editText}
                            onChange={setEditText}
                            placeholder="Edit your message..."
                            className="min-h-[60px] resize-none"
                            workspaceId={workspaceId}
                          />
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={() => saveEditMessage(message.id)}>
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingMessage(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-900">{message.content}</p>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(replyingTo === message.id ? null : message.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <Reply className="w-4 h-4 mr-1" />
                        Reply
                      </Button>
                    </div>
                  </div>

                  {/* Reply Input */}
                  {replyingTo === message.id && (
                    <div className="ml-13 space-y-3">
                      <div className="flex space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">{user ? getAuthorInitials(user.id) : 'U'}</AvatarFallback>
                        </Avatar>
                         <div className="flex-1 space-y-2">
                           <TextareaWithMentions
                             value={replyText}
                             onChange={setReplyText}
                             placeholder="Write a reply... Use @ to mention someone"
                             className="min-h-[60px] text-sm resize-none"
                             workspaceId={workspaceId}
                           />
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={() => handleReply(message.id)} disabled={!replyText.trim()}>
                              Reply
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* No search results message */}
      {searchTerm && filteredMessages.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No messages found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};
