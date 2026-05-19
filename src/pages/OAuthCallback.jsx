import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleOAuthCallback } from '../services/authService';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Processing OAuth callback...');

  const notifyOpener = (payload) => {
    if (typeof window === 'undefined') return;
    if (window.opener) {
      try {
        window.opener.postMessage({ type: 'oauth_result', ...payload }, '*');
      } catch (err) {
        console.warn('Failed to postMessage to opener:', err);
      }
    }
  };

  const completeCallback = (message, payload = null, delay = 2000) => {
    setStatus(message);

    if (payload) {
      notifyOpener(payload);
    }

    setTimeout(() => {
      if (typeof window !== 'undefined' && window.opener) {
        window.close();
      } else {
        navigate('/settings');
      }
    }, delay);
  };

  useEffect(() => {
    const processCallback = async () => {
      // What Facebook sends back
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      // What Django sends back after processing
      const success = searchParams.get('success');
      const platform = searchParams.get('platform');
      const account = searchParams.get('account');
      const details = searchParams.get('details');

      // Case 1: Facebook returned an error
      if (error) {
        completeCallback(
          `Authentication failed: ${error.replace(/_/g, ' ')}${details ? ` — ${details}` : ''}`,
          { success: false, error, details },
          3000
        );
        return;
      }

      // Case 2: Django already processed and redirected back with success
      if (success && platform) {
        completeCallback(
          `Successfully connected ${platform}${account ? ` (${account})` : ''}! Redirecting...`,
          { success: true, platform, account },
          2000
        );
        return;
      }

      // Case 3: Facebook returned code — send it to Django
      if (code) {
        try {
          setStatus('Connecting to Facebook...');
          const response = await handleOAuthCallback({ code, state });

          if (response.success) {
            completeCallback(`Successfully connected! Redirecting...`, { success: true, platform: response.platform, account: response.account }, 2000);
          } else {
            completeCallback(`Authentication failed: ${response.error || 'Unknown error'}`, { success: false, error: response.error }, 3000);
          }
        } catch (err) {
          completeCallback('Authentication failed. Please try again.', { success: false, error: err.message || 'unknown_error' }, 3000);
        }
        return;
      }

      // Case 4: No valid params at all
      completeCallback('Invalid callback parameters. Redirecting...', null, 2000);
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#fbf8fc] flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-primary">security</span>
          </div>
          <h1 className="text-2xl font-bold text-[#031635] mb-2">OAuth Authentication</h1>
          <p className="text-gray-600">{status}</p>
        </div>
        <div className="animate-pulse">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div className="bg-primary h-2 rounded-full" style={{width: '60%'}}></div>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Please wait while we complete the authentication process...
        </p>
      </div>
    </div>
  );
}