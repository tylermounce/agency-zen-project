import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function GoogleAuthCallback() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      // Check for errors from Google
      if (error) {
        setStatus('error');
        setErrorMessage(error === 'access_denied' ? 'Access was denied' : error);
        notifyParent('GOOGLE_OAUTH_ERROR', error);
        return;
      }

      // Verify state for CSRF protection
      const savedState = sessionStorage.getItem('google_oauth_state');
      if (state !== savedState) {
        setStatus('error');
        setErrorMessage('Invalid state parameter');
        notifyParent('GOOGLE_OAUTH_ERROR', 'Invalid state parameter');
        return;
      }

      if (!code) {
        setStatus('error');
        setErrorMessage('No authorization code received');
        notifyParent('GOOGLE_OAUTH_ERROR', 'No authorization code');
        return;
      }

      try {
        // Exchange the code for tokens via Edge Function
        const { data, error: exchangeError } = await supabase.functions.invoke('google-drive-auth', {
          body: {
            code,
            redirectUri: `${window.location.origin}/auth/google/callback`
          }
        });

        if (exchangeError) throw exchangeError;

        if (data.success) {
          setStatus('success');
          notifyParent('GOOGLE_OAUTH_SUCCESS', null);
        } else {
          throw new Error(data.error || 'Failed to complete authentication');
        }
      } catch (err) {
        console.error('OAuth error:', err);
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Authentication failed');
        notifyParent('GOOGLE_OAUTH_ERROR', err instanceof Error ? err.message : 'Unknown error');
      }

      // Clean up
      sessionStorage.removeItem('google_oauth_state');
    };

    handleCallback();
  }, [searchParams]);

  const notifyParent = (type: string, error: string | null) => {
    if (window.opener) {
      window.opener.postMessage({ type, error }, window.location.origin);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Connecting to Google Drive</h2>
            <p className="text-gray-600">Please wait while we complete the connection...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-green-700">Connected Successfully!</h2>
            <p className="text-gray-600">You can close this window now.</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-red-700">Connection Failed</h2>
            <p className="text-gray-600">{errorMessage}</p>
            <button
              onClick={() => window.close()}
              className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
            >
              Close Window
            </button>
          </>
        )}
      </div>
    </div>
  );
}
