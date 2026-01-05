import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Folder,
  File,
  FileText,
  Image,
  Video,
  Music,
  FileSpreadsheet,
  Presentation,
  ChevronLeft,
  Home,
  ExternalLink,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { formatters } from '@/lib/timezone';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
  size: number | null;
  createdTime: string;
  modifiedTime: string;
  webViewLink: string;
  thumbnailLink: string | null;
  iconLink: string | null;
}

interface FolderInfo {
  id: string;
  name: string;
  parentId: string | null;
}

interface DriveFolderBrowserProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DriveFolderBrowser = ({ workspaceId, open, onOpenChange }: DriveFolderBrowserProps) => {
  const { listFolder, isConnected } = useGoogleDrive();
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FolderInfo | null>(null);
  const [rootFolderId, setRootFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<FolderInfo[]>([]);

  const loadFolder = async (folderId?: string) => {
    setLoading(true);
    try {
      const result = await listFolder({
        folderId,
        workspaceId: !folderId ? workspaceId : undefined
      });

      if (result) {
        setFiles(result.files);
        setCurrentFolder(result.currentFolder);
        setRootFolderId(result.rootFolderId);

        // Update breadcrumbs
        if (!folderId) {
          // Reset to workspace root
          setBreadcrumbs([result.currentFolder]);
        } else {
          // Check if navigating back or forward
          const existingIndex = breadcrumbs.findIndex(b => b.id === folderId);
          if (existingIndex >= 0) {
            // Going back - truncate breadcrumbs
            setBreadcrumbs(breadcrumbs.slice(0, existingIndex + 1));
          } else {
            // Going forward - add to breadcrumbs
            setBreadcrumbs([...breadcrumbs, result.currentFolder]);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && isConnected) {
      loadFolder();
      setBreadcrumbs([]);
    }
  }, [open, isConnected, workspaceId]);

  const getFileIcon = (file: DriveFile) => {
    if (file.isFolder) {
      return <Folder className="w-5 h-5 text-blue-500" />;
    }

    const mimeType = file.mimeType || '';

    if (mimeType.startsWith('image/')) {
      return <Image className="w-5 h-5 text-green-500" />;
    }
    if (mimeType.startsWith('video/')) {
      return <Video className="w-5 h-5 text-purple-500" />;
    }
    if (mimeType.startsWith('audio/')) {
      return <Music className="w-5 h-5 text-pink-500" />;
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    }
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
      return <Presentation className="w-5 h-5 text-orange-500" />;
    }
    if (mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('text/')) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }

    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const handleItemClick = (file: DriveFile) => {
    if (file.isFolder) {
      loadFolder(file.id);
    } else {
      // Open file in new tab
      window.open(file.webViewLink, '_blank');
    }
  };

  const handleBack = () => {
    if (currentFolder?.parentId && breadcrumbs.length > 1) {
      loadFolder(currentFolder.parentId);
    }
  };

  const handleBreadcrumbClick = (folder: FolderInfo, index: number) => {
    if (index === breadcrumbs.length - 1) return; // Current folder, do nothing
    loadFolder(folder.id);
  };

  const canGoBack = breadcrumbs.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Folder className="w-5 h-5 text-blue-500" />
            <span>Browse Google Drive</span>
          </DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center justify-between py-2 border-b">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              disabled={!canGoBack || loading}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setBreadcrumbs([]);
                loadFolder();
              }}
              disabled={loading}
            >
              <Home className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadFolder(currentFolder?.id)}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Breadcrumbs */}
          <div className="flex items-center space-x-1 text-sm overflow-x-auto">
            {breadcrumbs.map((folder, index) => (
              <div key={folder.id} className="flex items-center">
                {index > 0 && <span className="text-gray-400 mx-1">/</span>}
                <button
                  onClick={() => handleBreadcrumbClick(folder, index)}
                  className={`hover:text-blue-600 ${
                    index === breadcrumbs.length - 1
                      ? 'font-medium text-gray-900'
                      : 'text-gray-600'
                  }`}
                  disabled={loading}
                >
                  {folder.name}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Folder className="w-12 h-12 mb-2 text-gray-300" />
              <p>This folder is empty</p>
            </div>
          ) : (
            <div className="divide-y">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer group"
                  onClick={() => handleItemClick(file)}
                >
                  <div className="mr-3">
                    {file.thumbnailLink && !file.isFolder ? (
                      <img
                        src={file.thumbnailLink}
                        alt={file.name}
                        className="w-8 h-8 rounded object-cover"
                        onError={(e) => {
                          // Fallback to icon if thumbnail fails to load
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      getFileIcon(file)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file.isFolder
                        ? 'Folder'
                        : formatFileSize(file.size)
                      }
                      {' · '}
                      Modified {formatters.dateOnly(file.modifiedTime)}
                    </p>
                  </div>
                  {!file.isFolder && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(file.webViewLink, '_blank');
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {files.length} items
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
