import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Paperclip, Upload, ExternalLink, Trash2, FileText, Image, File, Loader2 } from 'lucide-react';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { formatters } from '@/lib/timezone';

interface FileAttachment {
  id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  drive_file_url: string;
  drive_thumbnail_url: string | null;
  created_at: string;
}

interface FileAttachmentsProps {
  workspaceId?: string;
  taskId?: string;
  commentId?: string;
  compact?: boolean;
  showUpload?: boolean;
}

export const FileAttachments = ({
  workspaceId,
  taskId,
  commentId,
  compact = false,
  showUpload = true
}: FileAttachmentsProps) => {
  const { isConnected, loading: driveLoading, uploadFile, getFiles, deleteFile } = useGoogleDrive();
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
  }, [workspaceId, taskId, commentId]);

  const loadFiles = async () => {
    const context = { workspaceId, taskId, commentId };
    const fetchedFiles = await getFiles(context);
    setFiles(fetchedFiles);
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    const context = { workspaceId, taskId, commentId };

    for (const file of Array.from(selectedFiles)) {
      await uploadFile(file, context);
    }

    await loadFiles();
    setUploading(false);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (fileId: string) => {
    const success = await deleteFile(fileId);
    if (success) {
      setFiles(prev => prev.filter(f => f.id !== fileId));
    }
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="w-4 h-4" />;
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (fileType.includes('pdf') || fileType.includes('document')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (driveLoading || loading) {
    return null;
  }

  // Don't show anything if Drive isn't connected and there are no files
  if (!isConnected && files.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {files.map((file) => (
          <a
            key={file.id}
            href={file.drive_file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700"
          >
            {getFileIcon(file.file_type)}
            <span className="max-w-[150px] truncate">{file.file_name}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        ))}
        {showUpload && isConnected && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleUpload}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="h-7 px-2"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Paperclip className="w-4 h-4" />
              )}
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group"
            >
              <a
                href={file.drive_file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 flex-1 min-w-0"
              >
                {file.drive_thumbnail_url ? (
                  <img
                    src={file.drive_thumbnail_url}
                    alt=""
                    className="w-8 h-8 object-cover rounded"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                    {getFileIcon(file.file_type)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{file.file_name}</div>
                  <div className="text-xs text-gray-500">
                    {formatFileSize(file.file_size)}
                    {file.file_size && ' • '}
                    {formatters.dateOnly(file.created_at)}
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(file.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {showUpload && isConnected && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Attach Files
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
