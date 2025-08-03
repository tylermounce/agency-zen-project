import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, File, Image, FileText, Video, Music } from 'lucide-react';

interface FileAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

interface FileAttachmentViewerProps {
  attachments: FileAttachment[];
  className?: string;
}

export const FileAttachmentViewer: React.FC<FileAttachmentViewerProps> = ({
  attachments,
  className = ''
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (type.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (type.startsWith('audio/')) return <Music className="w-4 h-4" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const handleDownload = (attachment: FileAttachment) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isImageFile = (type: string) => type.startsWith('image/');

  if (attachments.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {attachments.map((attachment) => (
        <div key={attachment.id} className="border rounded-lg p-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="text-gray-500">
                {getFileIcon(attachment.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownload(attachment)}
              className="shrink-0"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
          </div>
          
          {/* Preview for images */}
          {isImageFile(attachment.type) && (
            <div className="mt-3">
              <img
                src={attachment.url}
                alt={attachment.name}
                className="max-w-full h-auto max-h-48 rounded border cursor-pointer"
                onClick={() => handleDownload(attachment)}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};