import { useState, useEffect } from 'react';
import ClientLayout from '../components/ClientLayout';
import { getConnectedPlatforms, initiateOAuth } from '../services/authService';

const PLATFORM_META = {
  instagram: { label: 'Instagram', icon: 'photo_camera', color: '#E1306C' },
  facebook: { label: 'Facebook', icon: 'groups', color: '#1877F2' },
  linkedin: { label: 'LinkedIn', icon: 'business_center', color: '#0A66C2' },
  pinterest: { label: 'Pinterest', icon: 'push_pin', color: '#BD081C' },
  youtube: { label: 'YouTube', icon: 'play_circle', color: '#FF0000' },
  twitter: { label: 'Twitter', icon: 'close', color: '#1DA1F2' },
};

function getClientId() {
  if (typeof window === 'undefined') return null;
  try {
    const user = JSON.parse(window.localStorage.getItem('user') || '{}');
    return user?.client_id || null;
  } catch {
    return null;
  }
}

export default function ClientSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const clientId = getClientId();

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'security', label: 'Security' },
    { id: 'team', label: 'Team' },
    { id: 'notifications', label: 'Notifications' },
  ];

  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [connectMessage, setConnectMessage] = useState('');
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    loadPlatforms();
  }, []);

  useEffect(() => {
    const allowedOrigins = [window.location.origin, 'http://localhost:5174', 'http://127.0.0.1:5174'];
    const handleOAuthMessage = (event) => {
      if (!allowedOrigins.includes(event.origin)) {
        return;
      }
      const data = event.data;
      if (!data || data.type !== 'oauth_result') {
        return;
      }

      if (data.success) {
        setConnectMessage(
          `Successfully connected ${data.platform || 'platform'}${data.account ? ` (${data.account})` : ''}. Refreshing...`
        );
      } else {
        setConnectMessage(`OAuth failed: ${data.error || 'Unknown error'}`);
      }
      loadPlatforms();
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  async function loadPlatforms() {
    try {
      const data = await getConnectedPlatforms();
      setPlatforms(data);
    } catch (error) {
      console.error('Unable to load connected platforms:', error);
    }
  }

  function togglePlatform(value) {
    setSelectedPlatforms((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  }

  async function handleConnect(event) {
    event.preventDefault();
    setConnectMessage('');

    if (selectedPlatforms.length === 0) {
      setConnectMessage('Please choose at least one platform to connect.');
      return;
    }

    if (selectedPlatforms.length > 1) {
      setConnectMessage('Please connect one platform at a time for OAuth.');
      return;
    }

    setConnecting(true);
    try {
      const platform = selectedPlatforms[0];
      const response = await initiateOAuth({
        platform: platform,
        client_id: clientId,
      });

      if (response.auth_url) {
        // Open OAuth URL in new window
        const oauthWindow = window.open(
          response.auth_url,
          'oauth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        if (!oauthWindow) {
          setConnectMessage('Popup blocked. Redirecting to OAuth in this tab...');
          window.location.href = response.auth_url;
          return;
        }

        // Poll for window close
        const checkClosed = setInterval(() => {
          if (oauthWindow.closed) {
            clearInterval(checkClosed);
            setConnectMessage('OAuth flow completed. Refreshing platform status...');
            setSelectedPlatforms([]);
            loadPlatforms();
          }
        }, 1000);
      } else {
        setConnectMessage('Failed to initiate OAuth flow.');
      }
    } catch (error) {
      setConnectMessage(error.message || 'Unable to initiate OAuth.');
    } finally {
      setConnecting(false);
    }
  }

  return (
    <ClientLayout>
      <header className="mb-xl px-xs">
        <h2 className="font-headline-xl text-headline-xl text-primary font-bold">Settings</h2>
        <p className="text-on-surface-variant text-body-md">Manage your account and notification preferences.</p>
      </header>

      {/* Horizontal Settings Navigation */}
      <div className="flex border-b border-outline-variant mb-xl gap-xl px-xs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-md text-on-surface-variant hover:text-primary transition-colors ${
              activeTab === tab.id ? 'text-primary font-bold border-b-2 border-primary' : ''
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'general' && (
        <div className="space-y-xl animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
            <div className="lg:col-span-8">
              <section className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-sm h-full">
                <div className="flex items-center justify-between mb-lg">
                  <h3 className="font-headline-md text-headline-md text-on-surface">Profile Information</h3>
                  <span className="material-symbols-outlined text-primary/40">person</span>
                </div>
                <div className="flex flex-col md:flex-row items-start gap-xl">
                  <div className="relative group cursor-pointer shrink-0">
                    <img alt="Upload" className="w-24 h-24 rounded-xl object-cover ring-4 ring-surface-container shadow-md" src="https://lh3.googleusercontent.com/aida/ADBb0uiyDTxLulY7CukQTwM8-mLnxlzTnvYp78oUmWUPR5uaFksQWMfwL70VtiAXNX1Uzv_mxHse1c8WC7hRBMvwF-1DE3f07HnEko_0OjSmydCstYlKTwezwb7_0ylf3nmseUbLWIHIhKbIwflmxmct8nAC048wtTXy0HhXMZ9X295R9JaiDpMNeOC-Ipfi2IavvXFEKobHqNIITZC-GE7ccMNboECUFRQG4mh_l17AFzBd3UkltNJ393TSv93buaRTE5EJ6wbYTjv2ByY" />
                    <div className="absolute inset-0 bg-primary/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-on-primary">photo_camera</span>
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-md w-full">
                    <div className="space-y-xs">
                      <label className="font-label-bold text-label-bold text-on-surface-variant">Full Name</label>
                      <input className="w-full border-outline-variant border rounded-lg bg-surface focus:border-primary focus:ring-1 focus:ring-primary py-sm px-md text-body-md" type="text" defaultValue="Alex Chen" />
                    </div>
                    <div className="space-y-xs">
                      <label className="font-label-bold text-label-bold text-on-surface-variant">Email Address</label>
                      <input className="w-full border-outline-variant border rounded-lg bg-surface focus:border-primary focus:ring-1 focus:ring-primary py-sm px-md text-body-md" type="email" defaultValue="alex@socialpro.io" />
                    </div>
                    <div className="md:col-span-2 space-y-xs">
                      <label className="font-label-bold text-label-bold text-on-surface-variant">Bio / Role</label>
                      <textarea className="w-full border-outline-variant border rounded-lg bg-surface focus:border-primary focus:ring-1 focus:ring-primary py-sm px-md text-body-md resize-none" rows="3" defaultValue="Brand Manager overseeing digital strategy and content approvals. Focused on maintaining consistent visual identity across channels."></textarea>
                    </div>
                  </div>
                </div>
              </section>
            </div>
            <div className="lg:col-span-4 space-y-xl">
              <section className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-sm">
                <div className="flex items-center justify-between mb-lg">
                  <div>
                    <h3 className="font-headline-md text-headline-md text-on-surface">Connect Platforms</h3>
                    <p className="text-on-surface-variant text-sm">Authenticate with social media platforms using OAuth 2.0 for secure API access.</p>
                  </div>
                  <span className="material-symbols-outlined text-primary/40">security</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {platforms.map((platform) => {
                    const meta = PLATFORM_META[platform.value] || { label: platform.label, icon: 'link', color: '#666' };
                    const isSelected = selectedPlatforms.includes(platform.value);
                    return (
                      <button
                        key={platform.value}
                        type="button"
                        onClick={() => togglePlatform(platform.value)}
                        className={`flex items-center gap-3 rounded-3xl border px-4 py-3 text-left transition-all ${
                          isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant/50 bg-surface text-on-surface'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${meta.color}1A` }}>
                          <span className="material-symbols-outlined text-lg" style={{ color: meta.color }}>{meta.icon}</span>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium">{meta.label}</p>
                          <p className="text-[11px] text-on-surface-variant">{platform.connected ? 'Connected' : 'Not connected'}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {connectMessage && <p className="text-sm text-on-surface mt-4">{connectMessage}</p>}
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={connecting}
                  className="mt-4 w-full rounded-3xl bg-primary px-6 py-3 font-semibold text-on-primary transition-all disabled:opacity-50"
                >
                  {connecting ? 'Authenticating...' : 'Start OAuth Authentication'}
                </button>
              </section>

              <section className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-sm">
                <div className="flex items-center justify-between mb-lg">
                  <div>
                    <h3 className="font-headline-md text-headline-md text-on-surface">Platform Status</h3>
                    <p className="text-on-surface-variant text-sm">Real API connection status for your selected accounts.</p>
                  </div>
                  <span className="material-symbols-outlined text-primary/40">cloud_done</span>
                </div>
                <div className="space-y-md">
                  {platforms.map((platform) => {
                    const meta = PLATFORM_META[platform.value] || { label: platform.label, icon: 'link', color: '#666' };
                    return (
                      <div key={platform.value} className="flex items-center justify-between p-sm border border-outline-variant rounded-lg bg-surface-container-low/20">
                        <div className="flex items-center gap-sm">
                          <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${meta.color}1A` }}>
                            <span className="material-symbols-outlined text-[18px]" style={{ color: meta.color }}>{meta.icon}</span>
                          </div>
                          <div>
                            <p className="font-label-bold leading-tight">{meta.label}</p>
                            <p className="text-[10px] text-on-surface-variant">{platform.connected ? 'Connected to API' : 'Not connected'}</p>
                          </div>
                        </div>
                        <span className={`text-[11px] font-bold ${platform.connected ? 'text-teal-600' : 'text-on-surface-variant'}`}>
                          {platform.connected ? 'Connected' : 'Pending'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Simplified for other tabs */}
      {activeTab !== 'general' && (
        <div className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant h-64 flex items-center justify-center italic text-on-surface-variant animate-in fade-in duration-300">
          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} settings content
        </div>
      )}
    </ClientLayout>
  );
}
