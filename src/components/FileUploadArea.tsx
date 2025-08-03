import React, { useCallback, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, Upload, X, File } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { cn } from '@/lib/utils';

interface AttachedFile {
  file: File;
  preview?: string;
}

interface FileUploadAreaProps {
  onFilesChange: (files: AttachedFile[]) => void;
  attachedFiles: AttachedFile[];
  className?: string;
  disabled?: boolean;
}

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  onFilesChange,
  attachedFiles,
  className,
  disabled = false
}) => {
  const { validateFile } = useFileUpload();
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const validFiles: AttachedFile[] = [];
    
    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (!error) {
        const attachedFile: AttachedFile = { file };
        
        // Create preview for images
        if (file.type.startsWith('image/')) {
          attachedFile.preview = URL.createObjectURL(file);
        }
        
        validFiles.push(attachedFile);
      }
    });

    if (validFiles.length > 0) {
      onFilesChange([...attachedFiles, ...validFiles]);
    }
  }, [attachedFiles, onFilesChange, validateFile]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    handleFiles(files);
  }, [disabled, handleFiles]);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    const newFiles = [...attachedFiles];
    // Revoke preview URL if it exists
    if (newFiles[index].preview) {
      URL.revokeObjectURL(newFiles[index].preview!);
    }
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("relative", className)}>
      <div
        onDrag={handleDrag}
        onDragStart={handleDrag}
        onDragEnd={handleDrag}
        onDragOver={handleDrag}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDrop={handleDrop}
        className={cn(
          "relative transition-colors",
          dragActive && "bg-blue-50 border-blue-300"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
        
        {/* Attachment button */}
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={openFileDialog}
          disabled={disabled}
          className="shrink-0"
        >
          <Paperclip className="w-4 h-4" />
        </Button>

        {/* Drag overlay */}
        {dragActive && (
          <div className="absolute inset-0 bg-blue-50/90 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-blue-600 font-medium">Drop files here</p>
            </div>
          </div>
        )}
      </div>

      {/* Attached files list */}
      {attachedFiles.length > 0 && (
        <div className="mt-2 space-y-2">
          {attachedFiles.map((attachedFile, index) => (
            <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
              <File className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachedFile.file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(attachedFile.file.size)}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => removeFile(index)}
                className="shrink-0 h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};