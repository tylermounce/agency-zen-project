import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send, Trash2, Edit2, X, Check, Loader2 } from 'lucide-react';
import { useTaskComments } from '@/hooks/useTaskComments';
import { useAuth } from '@/contexts/AuthContext';
import { formatters } from '@/lib/timezone';

interface TaskCommentsProps {
  taskId: string;
}

export const TaskComments = ({ taskId }: TaskCommentsProps) => {
  const { user } = useAuth();
  const { comments, loading, error, addComment, updateComment, deleteComment } = useTaskComments(taskId);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    const success = await addComment(newComment);
    if (success) {
      setNewComment('');
    }
    setSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const handleEdit = (commentId: string, content: string) => {
    setEditingId(commentId);
    setEditContent(content);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim()) return;

    const success = await updateComment(editingId, editContent);
    if (success) {
      setEditingId(null);
      setEditContent('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleDelete = async (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      await deleteComment(commentId);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return formatters.dateTime(timestamp);
  };

  const isEdited = (comment: { created_at: string; updated_at: string }) => {
    return comment.updated_at !== comment.created_at;
  };

  if (loading && comments.length === 0) {
    return (
      <div className="flex items-center justify-center py-4 text-gray-500">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading notes...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
        <MessageSquare className="w-4 h-4" />
        <span>Notes ({comments.length})</span>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No notes yet. Add the first one below.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3 p-3 bg-gray-50 rounded-lg">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                  {comment.user_initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {comment.user_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(comment.created_at)}
                      {isEdited(comment) && ' (edited)'}
                    </span>
                  </div>
                  {user?.id === comment.user_id && editingId !== comment.id && (
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                        onClick={() => handleEdit(comment.id, comment.content)}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                        onClick={() => handleDelete(comment.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
                {editingId === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="text-sm min-h-[60px]"
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={handleSaveEdit} className="h-7">
                        <Check className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-7">
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add new comment */}
      <div className="border-t pt-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Add a note... (Cmd+Enter to submit)"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[80px] text-sm"
            disabled={submitting}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!newComment.trim() || submitting}
              size="sm"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Add Note
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
