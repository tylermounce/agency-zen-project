import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  FolderOpen,
  Upload,
  Search,
  ExternalLink,
  Trash2,
  FileText,
  Image,
  File,
  Loader2,
  Grid,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { useUsers } from '@/hooks/useUsers';
import { formatters } from '@/lib/timezone';
import { supabase } from '@/integrations/supabase/client';

interface FileAttachment {
  id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  drive_file_id: string;
  drive_file_url: string;
  drive_thumbnail_url: string | null;
  workspace_id: string | null;
  task_id: string | null;
  comment_id: string | null;
  uploaded_by: string;
  created_at: string;
}

interface WorkspaceFilesProps {
  workspaceId: string;
}

export const WorkspaceFiles = ({ workspaceId }: WorkspaceFilesProps) => {
  const { isConnected, loading: driveLoading, uploadFile, deleteFile } = useGoogleDrive();
  const { users } = useUsers();
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [folderUrl, setFolderUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
    loadFolderUrl();
  }, [workspaceId]);

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('file_attachments')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFolderUrl = async () => {
    try {
      const { data } = await supabase
        .from('workspace_drive_folders')
        .select('drive_folder_url')
        .eq('workspace_id', workspaceId)
        .single();

      if (data) {
        setFolderUrl(data.drive_folder_url);
      }
    } catch (error) {
      // Folder may not exist yet
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);

    for (const file of Array.from(selectedFiles)) {
      await uploadFile(file, { workspaceId });
    }

    await loadFiles();
    await loadFolderUrl();
    setUploading(false);

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
    if (!fileType) return <File className="w-6 h-6 text-gray-400" />;
    if (fileType.startsWith('image/')) return <Image className="w-6 h-6 text-blue-500" />;
    if (fileType.includes('pdf')) return <FileText className="w-6 h-6 text-red-500" />;
    if (fileType.includes('document') || fileType.includes('word')) return <FileText className="w-6 h-6 text-blue-600" />;
    if (fileType.includes('sheet') || fileType.includes('excel')) return <FileText className="w-6 h-6 text-green-600" />;
    return <File className="w-6 h-6 text-gray-400" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.full_name || user?.email || 'Unknown';
  };

  const filteredFiles = files
    .filter(file =>
      file.file_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.file_name.localeCompare(b.file_name);
          break;
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'size':
          comparison = (a.file_size || 0) - (b.file_size || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  if (driveLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <FolderOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Google Drive Not Connected</h3>
            <p className="text-gray-500 mb-4">
              Connect Google Drive in Settings to enable file uploads.
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/settings'}>
              Go to Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Files</h2>
          <p className="text-gray-600 mt-1">
            All files uploaded to this workspace
          </p>
        </div>
        <div className="flex items-center gap-2">
          {folderUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(folderUrl, '_blank')}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Open in Drive
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Search, Sort, and View Toggle */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(value: 'name' | 'date' | 'size') => setSortBy(value)}>
            <SelectTrigger className="w-[140px]">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="date">Date Added</SelectItem>
              <SelectItem value="size">Size</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-2"
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? (
              <ArrowUp className="w-4 h-4" />
            ) : (
              <ArrowDown className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-r-none"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-l-none"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Files Display */}
      {filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FolderOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No files found' : 'No files yet'}
              </h3>
              <p className="text-gray-500">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Upload files to tasks or directly to this workspace'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredFiles.map((file) => (
            <Card key={file.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <a
                  href={file.drive_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {file.drive_thumbnail_url ? (
                    <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={file.drive_thumbnail_url}
                        alt={file.file_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square mb-3 rounded-lg bg-gray-100 flex items-center justify-center">
                      {getFileIcon(file.file_type)}
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm font-medium truncate" title={file.file_name}>
                      {file.file_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.file_size)}
                    </p>
                  </div>
                </a>
                <div className="flex items-center justify-between mt-2 pt-2 border-t">
                  <span className="text-xs text-gray-400">
                    {formatters.dateOnly(file.created_at)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(file.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Size</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Uploaded By</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Date</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50 group">
                    <td className="px-4 py-3">
                      <a
                        href={file.drive_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3"
                      >
                        {file.drive_thumbnail_url ? (
                          <img
                            src={file.drive_thumbnail_url}
                            alt=""
                            className="w-8 h-8 rounded object-cover"
                          />
                        ) : (
                          getFileIcon(file.file_type)
                        )}
                        <span className="text-sm font-medium text-gray-900 hover:text-blue-600">
                          {file.file_name}
                        </span>
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatFileSize(file.file_size)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {getUserName(file.uploaded_by)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatters.dateOnly(file.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(file.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* File Count */}
      {filteredFiles.length > 0 && (
        <p className="text-sm text-gray-500 text-center">
          {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      )}
    </div>
  );
};
