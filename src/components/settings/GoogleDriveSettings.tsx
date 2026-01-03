import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HardDrive, Link2, Unlink, CheckCircle2, AlertCircle, FolderOpen, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface DriveSettings {
  id: string;
  is_connected: boolean;
  connected_email: string | null;
  root_folder_id: string | null;
  connected_at: string | null;
}

export const GoogleDriveSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<DriveSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('google_drive_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine for new setup
        throw error;
      }

      setSettings(data);
    } catch (error) {
      console.error('Error fetching Drive settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);

    // Build the Google OAuth URL
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      toast({
        title: "Configuration Required",
        description: "Google Client ID is not configured. Please add VITE_GOOGLE_CLIENT_ID to your environment variables.",
        variant: "destructive"
      });
      setConnecting(false);
      return;
    }

    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = encodeURIComponent('https://www.googleapis.com/auth/drive.file');
    const state = crypto.randomUUID(); // For CSRF protection

    // Store state in sessionStorage for verification
    sessionStorage.setItem('google_oauth_state', state);

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${scope}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${state}`;

    // Open OAuth flow in popup
    const popup = window.open(authUrl, 'google-oauth', 'width=500,height=600');

    // Listen for the callback
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'GOOGLE_OAUTH_SUCCESS') {
        window.removeEventListener('message', handleMessage);
        popup?.close();

        // Refresh settings
        await fetchSettings();

        toast({
          title: "Google Drive Connected",
          description: "Your Google Drive has been successfully connected."
        });
        setConnecting(false);
      } else if (event.data.type === 'GOOGLE_OAUTH_ERROR') {
        window.removeEventListener('message', handleMessage);
        popup?.close();

        toast({
          title: "Connection Failed",
          description: event.data.error || "Failed to connect Google Drive.",
          variant: "destructive"
        });
        setConnecting(false);
      }
    };

    window.addEventListener('message', handleMessage);

    // Fallback timeout
    setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      if (connecting) {
        setConnecting(false);
      }
    }, 120000); // 2 minute timeout
  };

  const handleDisconnect = async () => {
    try {
      const { error } = await supabase
        .from('google_drive_settings')
        .update({
          is_connected: false,
          access_token: null,
          refresh_token: null,
          token_expiry: null,
          connected_email: null
        })
        .eq('id', settings?.id);

      if (error) throw error;

      toast({
        title: "Google Drive Disconnected",
        description: "Your Google Drive has been disconnected. Files will remain in Drive."
      });

      await fetchSettings();
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect Google Drive.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="w-5 h-5" />
                Google Drive Integration
              </CardTitle>
              <CardDescription className="mt-1">
                Connect Google Drive to store and share files across your workspaces
              </CardDescription>
            </div>
            {settings?.is_connected && (
              <Badge variant="outline" className="text-green-600 border-green-300">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!settings?.is_connected ? (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Connect your Google Drive to enable file uploads. An "Agency Zen" folder will be created
                  to store all workspace files, keeping them organized and separate from your other Drive content.
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium">How it works:</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <FolderOpen className="w-4 h-4 mt-0.5 text-blue-500" />
                    <span>Creates an "Agency Zen" master folder in your Drive</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FolderOpen className="w-4 h-4 mt-0.5 text-blue-500" />
                    <span>Each workspace gets its own subfolder automatically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Link2 className="w-4 h-4 mt-0.5 text-blue-500" />
                    <span>Files uploaded to tasks/comments are stored in the workspace folder</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500" />
                    <span>Click any file to open it directly in Google Drive</span>
                  </li>
                </ul>
              </div>

              <Button onClick={handleConnect} disabled={connecting} className="w-full">
                {connecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 mr-2" />
                    Connect Google Drive
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-800">Connected Account</p>
                    <p className="text-sm text-green-600">{settings.connected_email}</p>
                    {settings.connected_at && (
                      <p className="text-xs text-green-500 mt-1">
                        Connected on {new Date(settings.connected_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
              </div>

              {settings.root_folder_id && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-blue-500" />
                    <span className="text-sm">Agency Zen folder created in Drive</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://drive.google.com/drive/folders/${settings.root_folder_id}`, '_blank')}
                  >
                    Open in Drive
                  </Button>
                </div>
              )}

              <div className="pt-4 border-t">
                <Button variant="outline" onClick={handleDisconnect} className="text-red-600 hover:text-red-700">
                  <Unlink className="w-4 h-4 mr-2" />
                  Disconnect Google Drive
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Disconnecting will not delete any files from your Google Drive.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
