
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare, Reply, Hash, Search } from 'lucide-react';

interface ChannelDiscussionProps {
  workspaceId: string;
}

export const ChannelDiscussion = ({ workspaceId }: ChannelDiscussionProps) => {
  const [newPost, setNewPost] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const posts = [
    {
      id: '1',
      author: 'JD',
      content: 'Hey team! Just wanted to share an update on the Q4 campaign. We\'re making great progress on the social media assets.',
      timestamp: '2 hours ago',
      replies: [
        {
          id: '1-1',
          author: 'SM',
          content: 'That\'s awesome! The Instagram templates are looking really good.',
          timestamp: '1 hour ago'
        },
        {
          id: '1-2',
          author: 'KL',
          content: 'Agreed! When do we plan to start the rollout?',
          timestamp: '45 minutes ago'
        }
      ]
    },
    {
      id: '2',
      author: 'AM',
      content: 'Quick reminder: Team meeting tomorrow at 10 AM to discuss the brand identity project.',
      timestamp: '1 day ago',
      replies: []
    },
    {
      id: '3',
      author: 'RK',
      content: 'Does anyone have the latest brand guidelines? Need them for the website mockups.',
      timestamp: '2 days ago',
      replies: [
        {
          id: '3-1',
          author: 'TW',
          content: 'I\'ll share them in the project files shortly!',
          timestamp: '2 days ago'
        }
      ]
    }
  ];

  const handleNewPost = () => {
    if (newPost.trim()) {
      console.log('New post:', newPost);
      setNewPost('');
    }
  };

  const handleReply = (postId: string) => {
    if (replyText.trim()) {
      console.log('Reply to', postId, ':', replyText);
      setReplyText('');
      setReplyingTo(null);
    }
  };

  // Filter posts based on search term
  const filteredPosts = posts.filter(post => {
    const contentMatch = post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const authorMatch = post.author.toLowerCase().includes(searchTerm.toLowerCase());
    const replyMatch = post.replies.some(reply => 
      reply.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reply.author.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return contentMatch || authorMatch || replyMatch;
  });

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
            <Textarea
              placeholder="Share an update, ask a question, or start a discussion..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[100px] resize-none"
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

      {/* Posts Feed */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <Card key={post.id}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Main Post */}
                <div className="flex space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>{post.author}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{post.author}</span>
                      <span className="text-sm text-gray-500">{post.timestamp}</span>
                    </div>
                    <p className="text-gray-900">{post.content}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Reply className="w-4 h-4 mr-1" />
                      Reply
                    </Button>
                  </div>
                </div>

                {/* Replies */}
                {post.replies.length > 0 && (
                  <div className="ml-13 space-y-3 border-l-2 border-gray-100 pl-4">
                    {post.replies.map((reply) => (
                      <div key={reply.id} className="flex space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">{reply.author}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">{reply.author}</span>
                            <span className="text-xs text-gray-500">{reply.timestamp}</span>
                          </div>
                          <p className="text-sm text-gray-800">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Input */}
                {replyingTo === post.id && (
                  <div className="ml-13 space-y-3">
                    <div className="flex space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">JD</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <Textarea
                          placeholder="Write a reply..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="min-h-[60px] text-sm resize-none"
                        />
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={() => handleReply(post.id)} disabled={!replyText.trim()}>
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
        ))}
      </div>

      {/* No results message */}
      {searchTerm && filteredPosts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No messages found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};
