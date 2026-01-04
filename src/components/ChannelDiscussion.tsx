
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare, Reply, Hash, Search, MoreHorizontal, Edit2, Trash2, Loader2, Paperclip, X, Upload, ExternalLink, File, Image, FileText } from 'lucide-react';
import { TextareaWithMentions } from '@/components/TextareaWithMentions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MentionHighlight } from '@/components/MentionHighlight';
import { useMessaging } from '@/hooks/useMessaging';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { formatters } from '@/lib/timezone';

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

interface PendingFile {
  file: File;
  preview?: string;
}

interface MessageAttachment {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
}

export const ChannelDiscussion = ({ workspaceId }: ChannelDiscussionProps) => {
  const { user } = useAuth();
  const { sendMessage, messages: allMessages, fetchMessages: fetchMessagesFromHook, loadMoreMessages, threadPagination } = useMessaging();
  const { isConnected: driveConnected, uploadFile } = useGoogleDrive();
  const [newPost, setNewPost] = useState('');
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [profiles, setProfiles] = useState<{ [key: string]: Profile }>({});
  const [loading, setLoading] = useState(true);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [messageAttachments, setMessageAttachments] = useState<{ [key: string]: MessageAttachment[] }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const threadId = `workspace-${workspaceId}-general`;
  const messages = allMessages[threadId] || [];
  const pagination = threadPagination[threadId];

  useEffect(() => {
    fetchMessagesFromHook(threadId);
    fetchProfiles();
    setLoading(false);
  }, [workspaceId, threadId, fetchMessagesFromHook]);

  // Fetch attachments for messages
  useEffect(() => {
    const fetchAttachments = async () => {
      if (messages.length === 0) return;

      const messageIds = messages.map(m => m.id);
      const { data } = await supabase
        .from('message_attachments')
        .select('*')
        .in('message_id', messageIds);

      if (data) {
        const attachmentMap: { [key: string]: MessageAttachment[] } = {};
        data.forEach(att => {
          if (!attachmentMap[att.message_id]) {
            attachmentMap[att.message_id] = [];
          }
          attachmentMap[att.message_id].push(att);
        });
        setMessageAttachments(attachmentMap);
      }
    };

    fetchAttachments();
  }, [messages]);

  const fetchMessages = () => {
    fetchMessagesFromHook(threadId);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    addFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addFiles = (files: File[]) => {
    const newPendingFiles = files.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));
    setPendingFiles(prev => [...prev, ...newPendingFiles]);
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => {
      const file = prev[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4 text-blue-500" />;
    if (fileType.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    return <File className="w-4 h-4 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
    if ((!newPost.trim() && pendingFiles.length === 0) || !user) return;

    setUploading(true);

    try {
      // Load workspace members to ensure everyone in the workspace can see the channel
      const { data: members, error: membersError } = await supabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', workspaceId);
      if (membersError) throw membersError;
      const memberIds = Array.from(new Set((members || []).map((m: { user_id: string }) => m.user_id)));

      // Check if conversation exists for this thread
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id, participants')
        .eq('thread_id', threadId)
        .maybeSingle();

      if (!existingConv) {
        // Create conversation with ALL workspace members as participants
        await supabase
          .from('conversations')
          .insert({
            thread_id: threadId,
            thread_type: 'channel',
            title: 'General Discussion',
            workspace_id: workspaceId,
            participants: memberIds,
          });
      } else {
        // Ensure conversation participants include all current workspace members
        const current = Array.isArray(existingConv.participants) ? existingConv.participants : [];
        const union = Array.from(new Set([...(current as string[]), ...memberIds]));
        if (union.length !== current.length) {
          await supabase
            .from('conversations')
            .update({ participants: union })
            .eq('id', existingConv.id);
        }
      }

      // Insert the message using messaging hook to handle mentions & notifications
      const messageContent = newPost.trim() || (pendingFiles.length > 0 ? `Shared ${pendingFiles.length} file${pendingFiles.length > 1 ? 's' : ''}` : '');
      const result = await sendMessage(
        messageContent,
        'channel',
        threadId,
        workspaceId
      );
      const messageId = result?.messageData?.id;

      // Upload files and attach to message
      if (pendingFiles.length > 0 && messageId && driveConnected) {
        for (const { file } of pendingFiles) {
          const uploadResult = await uploadFile(file, { workspaceId });
          if (uploadResult) {
            // Save attachment reference to message_attachments table
            await supabase
              .from('message_attachments')
              .insert({
                message_id: messageId,
                file_name: file.name,
                file_type: file.type,
                file_size: file.size,
                file_url: uploadResult.drive_file_url
              });
          }
        }
      }

      // Clean up pending files
      pendingFiles.forEach(pf => {
        if (pf.preview) URL.revokeObjectURL(pf.preview);
      });
      setPendingFiles([]);
      setNewPost('');
      fetchMessages(); // Refresh messages
    } catch (error) {
      console.error('Error posting message:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleReply = (postId: string) => {
    // For now, just log - reply functionality can be enhanced later
    if (replyText.trim()) {
      setReplyText('');
      setReplyTargetId(null);
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
          <div
            className={`space-y-4 relative ${isDragging ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Drag overlay */}
            {isDragging && (
              <div className="absolute inset-0 bg-blue-50 bg-opacity-90 rounded-lg flex items-center justify-center z-10">
                <div className="text-center">
                  <Upload className="w-10 h-10 mx-auto text-blue-500 mb-2" />
                  <p className="text-blue-600 font-medium">Drop files here to attach</p>
                </div>
              </div>
            )}

            <TextareaWithMentions
              value={newPost}
              onChange={setNewPost}
              placeholder="Share an update, ask a question, or start a discussion... Use @ to mention someone. Drag files here or click the attach button."
              className="min-h-[100px] resize-none"
              workspaceId={workspaceId}
            />

            {/* Pending Files */}
            {pendingFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                {pendingFiles.map((pf, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border shadow-sm"
                  >
                    {pf.preview ? (
                      <img src={pf.preview} alt="" className="w-8 h-8 object-cover rounded" />
                    ) : (
                      getFileIcon(pf.file.type)
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium truncate max-w-[150px]">{pf.file.name}</span>
                      <span className="text-xs text-gray-500">{formatFileSize(pf.file.size)}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                      onClick={() => removePendingFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {driveConnected && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-gray-500"
                  >
                    <Paperclip className="w-4 h-4 mr-1" />
                    Attach
                  </Button>
                )}
              </div>
              <Button
                onClick={handleNewPost}
                disabled={(!newPost.trim() && pendingFiles.length === 0) || uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages Feed */}
      <div className="space-y-4">
        {/* Load More Button */}
        {pagination?.hasMore && !searchTerm && filteredMessages.length > 0 && (
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadMoreMessages(threadId)}
              disabled={pagination?.loading}
            >
              {pagination?.loading ? (
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
                          <span className="text-sm text-gray-500">{formatters.timeOnly(message.created_at)}</span>
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
                        <MentionHighlight content={message.content} className="text-gray-900" />
                      )}

                      {/* Message Attachments */}
                      {messageAttachments[message.id]?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {messageAttachments[message.id].map((att) => (
                            <a
                              key={att.id}
                              href={att.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                              {getFileIcon(att.file_type)}
                              <span className="text-sm font-medium truncate max-w-[200px]">{att.file_name}</span>
                              <ExternalLink className="w-3 h-3 text-gray-400" />
                            </a>
                          ))}
                        </div>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyTargetId(replyTargetId === message.id ? null : message.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <Reply className="w-4 h-4 mr-1" />
                        Reply
                      </Button>
                    </div>
                  </div>

                  {/* Reply Input */}
                  {replyTargetId === message.id && (
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
                            <Button size="sm" variant="ghost" onClick={() => setReplyTargetId(null)}>
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
