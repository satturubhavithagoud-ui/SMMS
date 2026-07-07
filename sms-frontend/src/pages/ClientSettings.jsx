import { useState, useEffect, useRef } from 'react';
import ClientLayout from '../components/ClientLayout';
import {
  getConnectedPlatforms,
  initiateOAuth,
  getClientProfile,
  updateClientProfile,
  disconnectPlatform,
} from '../services/authService';

/* ────────── Platform visual definitions ────────── */
const PLATFORM_META = {
  instagram: { label: 'Instagram', icon: 'photo_camera', color: '#E1306C', gradient: 'from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]' },
  facebook:  { label: 'Facebook',  icon: 'groups',       color: '#1877F2', gradient: 'from-[#1877F2] to-[#0a52a1]' },
  youtube:   { label: 'YouTube',   icon: 'play_circle',  color: '#FF0000', gradient: 'from-[#FF0000] to-[#cc0000]' },
  twitter:   { label: 'Twitter',   icon: 'tag',          color: '#1DA1F2', gradient: 'from-[#1DA1F2] to-[#0d8bd9]' },
  linkedin:  { label: 'LinkedIn',  icon: 'business_center', color: '#0A66C2', gradient: 'from-[#0A66C2] to-[#064a8a]' },
  pinterest: { label: 'Pinterest', icon: 'push_pin',     color: '#BD081C', gradient: 'from-[#BD081C] to-[#8c0615]' },
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

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export default function ClientSettings() {
  const clientId = getClientId();

  /* ── Profile state ── */
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    organization_name: '',
    bio: '',
    phone: '',
    profile_picture: '',
  });
  const [profileFile, setProfileFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  /* ── Platform state ── */
  const [platforms, setPlatforms] = useState([]);
  const [platformsLoading, setPlatformsLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const [disconnectingPlatform, setDisconnectingPlatform] = useState(null);
  const [platformMessage, setPlatformMessage] = useState({ type: '', text: '' });

  /* ────────── Load data on mount ────────── */
  useEffect(() => {
    loadProfile();
    loadPlatforms();
  }, []);

  /* ── OAuth popup message listener ── */
  useEffect(() => {
    const allowedOrigins = [window.location.origin, 'http://localhost:5181', 'http://127.0.0.1:5181'];
    const handleOAuthMessage = (event) => {
      if (!allowedOrigins.includes(event.origin)) return;
      const data = event.data;
      if (!data || data.type !== 'oauth_result') return;

      if (data.success) {
        setPlatformMessage({
          type: 'success',
          text: `Successfully connected ${data.platform || 'platform'}${data.account ? ` (${data.account})` : ''}.`,
        });
      } else {
        setPlatformMessage({ type: 'error', text: `OAuth failed: ${data.error || 'Unknown error'}` });
      }
      loadPlatforms();
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  /* ────────── API helpers ────────── */
  async function loadProfile() {
    try {
      setProfileLoading(true);
      const data = await getClientProfile(clientId);
      setProfile({
        full_name: data.full_name || '',
        email: data.email || '',
        organization_name: data.organization_name || '',
        bio: data.bio || '',
        phone: data.phone || '',
        profile_picture: data.profile_picture || '',
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setProfileLoading(false);
    }
  }

  async function loadPlatforms() {
    try {
      setPlatformsLoading(true);
      const data = await getConnectedPlatforms(clientId);
      setPlatforms(data);
    } catch (err) {
      console.error('Failed to load platforms:', err);
    } finally {
      setPlatformsLoading(false);
    }
  }

  /* ────────── Profile handlers ────────── */
  function handleProfileChange(e) {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    setProfileMessage({ type: '', text: '' });
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileFile(file);
    setProfilePreview(URL.createObjectURL(file));
    setProfileMessage({ type: '', text: '' });
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('full_name', profile.full_name);
      formData.append('email', profile.email);
      formData.append('organization_name', profile.organization_name);
      formData.append('bio', profile.bio);
      formData.append('phone', profile.phone);
      if (profileFile) {
        formData.append('profile_picture', profileFile);
      }

      const result = await updateClientProfile(clientId, formData);
      setProfile({
        full_name: result.full_name || '',
        email: result.email || '',
        organization_name: result.organization_name || '',
        bio: result.bio || '',
        phone: result.phone || '',
        profile_picture: result.profile_picture || '',
      });
      setProfileFile(null);
      setProfilePreview('');
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });

      // Also update localStorage user data
      try {
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        stored.username = result.full_name;
        stored.email = result.email;
        if (result.profile_picture) {
          stored.profile_picture = result.profile_picture;
        }
        localStorage.setItem('user', JSON.stringify(stored));
        window.dispatchEvent(new Event('user-profile-updated'));
      } catch {
        // Ignore localStorage sync failures after a successful profile save.
      }
    } catch (err) {
      setProfileMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  }

  /* ────────── Platform handlers ────────── */
  async function handleConnectPlatform(platformValue) {
    setConnectingPlatform(platformValue);
    setPlatformMessage({ type: '', text: '' });

    try {
      const response = await initiateOAuth({ platform: platformValue, client_id: clientId });
      if (response.auth_url) {
        const oauthWindow = window.open(response.auth_url, 'oauth', 'width=600,height=700,scrollbars=yes,resizable=yes');
        if (!oauthWindow) {
          setPlatformMessage({ type: 'error', text: 'Popup blocked. Please allow popups for this site.' });
          setConnectingPlatform(null);
          return;
        }
        const checkClosed = setInterval(() => {
          if (oauthWindow.closed) {
            clearInterval(checkClosed);
            setConnectingPlatform(null);
            loadPlatforms();
          }
        }, 1000);
      } else {
        setPlatformMessage({ type: 'error', text: 'Failed to initiate OAuth.' });
      }
    } catch (err) {
      setPlatformMessage({ type: 'error', text: err.message || 'Unable to initiate OAuth.' });
    } finally {
      if (!connectingPlatform) setConnectingPlatform(null);
    }
  }

  async function handleDisconnectPlatform(platformValue) {
    setDisconnectingPlatform(platformValue);
    setPlatformMessage({ type: '', text: '' });

    try {
      await disconnectPlatform({ platform: platformValue, client_id: clientId });
      setPlatformMessage({
        type: 'success',
        text: `${PLATFORM_META[platformValue]?.label || platformValue} disconnected successfully.`,
      });
      loadPlatforms();
    } catch (err) {
      setPlatformMessage({ type: 'error', text: err.message || 'Failed to disconnect platform.' });
    } finally {
      setDisconnectingPlatform(null);
    }
  }

  /* ────────── Derived values ────────── */
  const avatarSrc = profilePreview || profile.profile_picture || '';
  const connectedCount = platforms.filter((p) => p.connected).length;

  /* ═══════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════ */
  return (
    <ClientLayout>
      {/* ──── Page Header ──── */}
      <header className="mb-xl px-xs">
        <h2 className="font-headline-xl text-headline-xl text-on-surface font-bold">Settings</h2>
        <p className="text-on-surface-variant text-body-md mt-1">
          Manage your profile information and connected social media platforms.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-xl">
        {/* ════════════════════════════════════════════
            LEFT COLUMN — Edit Profile
            ════════════════════════════════════════════ */}
        <div className="xl:col-span-7 space-y-xl">
          <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
            {/* Section header with gradient accent */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-5 border-b border-outline-variant/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">person</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-on-surface">Edit Profile</h3>
                    <p className="text-xs text-on-surface-variant">Update your personal information and profile picture</p>
                  </div>
                </div>
              </div>
            </div>

            {profileLoading ? (
              <div className="flex items-center justify-center h-48">
                <span className="material-symbols-outlined animate-spin text-3xl text-primary">sync</span>
              </div>
            ) : (
              <form onSubmit={handleProfileSave} className="p-6 space-y-6">
                {/* Avatar */}
                <div className="flex flex-col sm:flex-row items-start gap-5">
                  <div className="relative group shrink-0">
                    <div className="w-28 h-28 rounded-2xl overflow-hidden ring-4 ring-surface-container shadow-lg bg-surface-container">
                      {avatarSrc ? (
                        <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                          <span className="material-symbols-outlined text-4xl text-primary/50">person</span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="material-symbols-outlined text-white text-xl">photo_camera</span>
                        <span className="text-white text-[10px] font-medium">Change</span>
                      </div>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1 w-full space-y-1">
                    <p className="text-sm font-semibold text-on-surface">Profile Picture</p>
                    <p className="text-xs text-on-surface-variant">Upload a photo to personalize your account. JPG, PNG or GIF up to 5MB.</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition"
                    >
                      <span className="material-symbols-outlined text-sm">upload</span>
                      Upload new photo
                    </button>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Full Name</label>
                    <input
                      name="full_name"
                      value={profile.full_name}
                      onChange={handleProfileChange}
                      placeholder="Your full name"
                      className="w-full border border-outline-variant rounded-xl bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 py-3 px-4 text-sm text-on-surface outline-none transition-all"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Email (Primary)</label>
                    <input
                      name="email"
                      type="email"
                      value={profile.email}
                      onChange={handleProfileChange}
                      placeholder="name@company.com"
                      className="w-full border border-outline-variant rounded-xl bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 py-3 px-4 text-sm text-on-surface outline-none transition-all"
                    />
                  </div>

                  {/* Organization Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Organization</label>
                    <input
                      name="organization_name"
                      value={profile.organization_name}
                      onChange={handleProfileChange}
                      placeholder="Your company or brand"
                      className="w-full border border-outline-variant rounded-xl bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 py-3 px-4 text-sm text-on-surface outline-none transition-all"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Phone Number</label>
                    <input
                      name="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={handleProfileChange}
                      placeholder="+1 (555) 000-0000"
                      className="w-full border border-outline-variant rounded-xl bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 py-3 px-4 text-sm text-on-surface outline-none transition-all"
                    />
                  </div>

                  {/* Bio */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Bio</label>
                    <textarea
                      name="bio"
                      value={profile.bio}
                      onChange={handleProfileChange}
                      placeholder="Tell us about yourself or your brand..."
                      rows={3}
                      className="w-full border border-outline-variant rounded-xl bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 py-3 px-4 text-sm text-on-surface outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Feedback message */}
                {profileMessage.text && (
                  <div
                    className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 ${
                      profileMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {profileMessage.type === 'success' ? 'check_circle' : 'error'}
                    </span>
                    {profileMessage.text}
                  </div>
                )}

                {/* Save button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                  >
                    {profileSaving ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-base">sync</span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">save</span>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>

        {/* ════════════════════════════════════════════
            RIGHT COLUMN — Connect Platforms
            ════════════════════════════════════════════ */}
        <div className="xl:col-span-5 space-y-xl">
          <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
            {/* Section header */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-5 border-b border-outline-variant/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">share</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-on-surface">Connected Platforms</h3>
                    <p className="text-xs text-on-surface-variant">
                      {connectedCount > 0
                        ? `${connectedCount} of ${platforms.length} platforms connected`
                        : 'Connect your social media accounts'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {platformsLoading ? (
              <div className="flex items-center justify-center h-48">
                <span className="material-symbols-outlined animate-spin text-3xl text-primary">sync</span>
              </div>
            ) : (
              <div className="p-5 space-y-3">
                {/* Platform message */}
                {platformMessage.text && (
                  <div
                    className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 mb-2 ${
                      platformMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {platformMessage.type === 'success' ? 'check_circle' : 'error'}
                    </span>
                    {platformMessage.text}
                  </div>
                )}

                {/* Platform list */}
                {platforms.map((platform) => {
                  const meta = PLATFORM_META[platform.value] || { label: platform.label, icon: 'link', color: '#666', gradient: 'from-gray-500 to-gray-600' };
                  const isConnected = platform.connected;
                  const isConnecting = connectingPlatform === platform.value;
                  const isDisconnecting = disconnectingPlatform === platform.value;

                  return (
                    <div
                      key={platform.value}
                      className={`group relative flex items-center gap-4 rounded-xl border p-4 transition-all duration-200 ${
                        isConnected
                          ? 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/50'
                          : 'border-outline-variant/60 bg-surface hover:bg-surface-container-low/30 hover:border-outline-variant'
                      }`}
                    >
                      {/* Platform icon */}
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                        style={{ backgroundColor: `${meta.color}15` }}
                      >
                        <span className="material-symbols-outlined text-xl" style={{ color: meta.color }}>
                          {meta.icon}
                        </span>
                      </div>

                      {/* Platform info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-on-surface">{meta.label}</p>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">
                          {isConnected ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                              Connected
                              {platform.account_username && ` · ${platform.account_username}`}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block"></span>
                              Not connected
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Connect / Disconnect button */}
                      {isConnected ? (
                        <button
                          type="button"
                          onClick={() => handleDisconnectPlatform(platform.value)}
                          disabled={isDisconnecting}
                          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-100 hover:border-red-300 transition-all disabled:opacity-50"
                        >
                          {isDisconnecting ? (
                            <>
                              <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                              <span className="hidden sm:inline">Disconnecting...</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-sm">link_off</span>
                              <span className="hidden sm:inline">Disconnect</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleConnectPlatform(platform.value)}
                          disabled={isConnecting}
                          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary/10 hover:border-primary/50 transition-all disabled:opacity-50"
                        >
                          {isConnecting ? (
                            <>
                              <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                              <span className="hidden sm:inline">Connecting...</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-sm">add_link</span>
                              <span className="hidden sm:inline">Connect</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Quick stats card */}
          <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm p-5">
            <h4 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">info</span>
              Platform Connection Guide
            </h4>
            <div className="space-y-3 text-xs text-on-surface-variant">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-emerald-500 text-sm mt-0.5 shrink-0">check_circle</span>
                <p><span className="font-semibold text-on-surface">Facebook, Instagram, YouTube</span> — Connect via OAuth 2.0 for full API access including publishing and analytics.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5 shrink-0">schedule</span>
                <p><span className="font-semibold text-on-surface">Twitter, LinkedIn, Pinterest</span> — Integration coming soon. Select to be notified when available.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-blue-500 text-sm mt-0.5 shrink-0">security</span>
                <p>All connections use industry-standard OAuth 2.0. We never store your social media passwords.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </ClientLayout>
  );
}
