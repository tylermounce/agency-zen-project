import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DriveSettings {
  id: string;
  is_connected: boolean;
  connected_email: string | null;
  root_folder_id: string | null;
}

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

export const useGoogleDrive = () => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<DriveSettings | null>(null);

  // Fetch connection status
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('google_drive_settings')
          .select('id, is_connected, connected_email, root_folder_id')
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        setSettings(data);
        setIsConnected(data?.is_connected ?? false);
      } catch (error) {
        console.error('Error fetching Drive settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Upload file to Google Drive
  const uploadFile = useCallback(async (
    file: File,
    context: {
      workspaceId?: string;
      taskId?: string;
      commentId?: string;
    }
  ): Promise<FileAttachment | null> => {
    if (!isConnected) {
      toast({
        title: "Google Drive not connected",
        description: "Please connect Google Drive in Settings first.",
        variant: "destructive"
      });
      return null;
    }

    try {
      // Convert file to base64
      const base64 = await fileToBase64(file);

      // Upload via Edge Function
      const { data, error } = await supabase.functions.invoke('google-drive-upload', {
        body: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileData: base64,
          workspaceId: context.workspaceId,
          taskId: context.taskId,
          commentId: context.commentId
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "File uploaded",
          description: `${file.name} has been uploaded to Google Drive.`
        });
        return data.attachment;
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive"
      });
      return null;
    }
  }, [isConnected, toast]);

  // Get files for a specific context
  const getFiles = useCallback(async (context: {
    workspaceId?: string;
    taskId?: string;
    commentId?: string;
  }): Promise<FileAttachment[]> => {
    try {
      let query = supabase.from('file_attachments').select('*');

      if (context.taskId) {
        query = query.eq('task_id', context.taskId);
      } else if (context.commentId) {
        query = query.eq('comment_id', context.commentId);
      } else if (context.workspaceId) {
        query = query.eq('workspace_id', context.workspaceId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching files:', error);
      return [];
    }
  }, []);

  // Delete file attachment (doesn't delete from Drive, just removes reference)
  const deleteFile = useCallback(async (fileId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('file_attachments')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      toast({
        title: "File removed",
        description: "The file reference has been removed."
      });
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to remove file",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  return {
    isConnected,
    loading,
    settings,
    uploadFile,
    getFiles,
    deleteFile
  };
};

// Helper to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};
