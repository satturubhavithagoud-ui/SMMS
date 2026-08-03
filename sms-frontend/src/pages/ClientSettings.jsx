import { useState, useEffect, useCallback } from 'react';
import ClientLayout from '../components/ClientLayout';
import PlatformLogo from '../components/PlatformLogo';
import { PageHeader, SectionCard } from '../components/ui';
import {
  getClientProfile,
  updateClientProfile,
  saveClientPreferences,
  changeClientPassword,
  disconnectClientPlatform,
} from '../services/smhService';
import { getConnectedPlatforms, initiateOAuth } from '../services/authService';

const NOTIFICATION_PREFS = [
  { key: 'notify_post_approval', label: 'Post approval requests', description: 'When an SMH member submits content for your approval.' },
  { key: 'notify_post_approved', label: 'Post approved', description: 'When your content is approved and scheduled.' },
  { key: 'notify_post_rejected', label: 'Post rejected', description: 'When your content is rejected for changes.' },
  { key: 'notify_post_failed', label: 'Publishing failures', description: 'When a scheduled post fails to publish.' },
  { key: 'notify_report_ready', label: 'Monthly reports', description: 'When a new performance report is ready.' },
  { key: 'notify_package_expiry', label: 'Package expiry', description: 'Reminders before your subscription expires.' },
  { key: 'email_digest', label: 'Weekly email digest', description: 'A weekly summary of your account activity via email.' },
];

function getClientId() {
  if (typeof window === 'undefined') return null;
  try {
    const user = JSON.parse(window.localStorage.getItem('user') || '{}');
    return user?.client_id || null;
  } catch {
    return null;
  }
}

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;
  return (
    <div
      className={`fixed right-4 top-20 z-[70] flex items-center gap-2 rounded-xl border px-4 py-3 shadow-popover ${
        toast.type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-red-200 bg-red-50 text-red-800'
      }`}
    >
      <span className="material-symbols-outlined">{toast.type === 'success' ? 'check_circle' : 'error'}</span>
      <span className="text-sm font-semibold">{toast.message}</span>
    </div>
  );
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-primary' : 'border border-outline-variant bg-surface-container-high'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="field-label !mb-0">{label}</label>
      {children}
    </div>
  );
}

export default function ClientSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const clientId = getClientId();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [toast, setToast] = useState(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [industry, setIndustry] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  const [prefs, setPrefs] = useState({});
  const [savingPref, setSavingPref] = useState(null);

  const [platforms, setPlatforms] = useState([]);
  const [platformsLoading, setPlatformsLoading] = useState(true);
  const [platformsError, setPlatformsError] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [connectMessage, setConnectMessage] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const tabs = [
    { id: 'general', label: 'General', icon: 'person' },
    { id: 'security', label: 'Security', icon: 'lock' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
  ];

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getClientProfile(clientId);
      setProfile(data);
      setFullName(data.username || '');
      setEmail(data.email || '');
      setOrganization(data.organization_name || '');
      setIndustry(data.industry || '');
      setContactNumber(data.contact_number || '');
      setLogoPreview(data.logo_url || null);
      setPrefs(data.preferences || {});
    } catch (err) {
      setError(err.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const loadPlatforms = useCallback(async () => {
    setPlatformsLoading(true);
    setPlatformsError(null);
    try {
      const data = await getConnectedPlatforms();
      setPlatforms(data);
    } catch (err) {
      setPlatformsError(err.message || 'Unable to load platforms.');
    } finally {
      setPlatformsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    loadPlatforms();
  }, [fetchProfile, loadPlatforms]);

  useEffect(() => {
    const allowedOrigins = [window.location.origin, 'http://localhost:5181', 'http://127.0.0.1:5181'];
    const handleOAuthMessage = (event) => {
      if (!allowedOrigins.includes(event.origin)) return;
      const data = event.data;
      if (!data || data.type !== 'oauth_result') return;
      if (data.success) {
        setToast({
          type: 'success',
          message: `Connected ${data.platform || 'platform'}${data.account ? ` (${data.account})` : ''}.`,
        });
      } else {
        setToast({ type: 'error', message: `OAuth failed: ${data.error || 'Unknown error'}` });
      }
      setSelectedPlatform(null);
      loadPlatforms();
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [loadPlatforms]);

  function handleLogoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleSaveProfile(event) {
    event.preventDefault();
    const errors = {};
    if (!fullName.trim()) errors.fullName = 'Full name is required.';
    if (!email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Enter a valid email address.';
    }
    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) {
      setToast({ type: 'error', message: 'Please fix the highlighted fields.' });
      return;
    }
    setSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append('full_name', fullName);
      formData.append('email', email);
      formData.append('organization_name', organization);
      formData.append('industry', industry);
      formData.append('contact_number', contactNumber);
      if (logoFile) formData.append('logo', logoFile);

      const result = await updateClientProfile(clientId, formData);
      const updated = result.profile;
      setProfile(updated);
      setFullName(updated.username || '');
      setEmail(updated.email || '');
      setOrganization(updated.organization_name || '');
      setIndustry(updated.industry || '');
      setContactNumber(updated.contact_number || '');
      setLogoPreview(updated.logo_url || null);
      setLogoFile(null);
      setToast({ type: 'success', message: result.message || 'Profile updated.' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleConnect(event) {
    event.preventDefault();
    setConnectMessage(null);
    if (!selectedPlatform) {
      setConnectMessage({ type: 'error', text: 'Please choose a platform to connect.' });
      return;
    }
    setConnecting(true);
    try {
      const response = await initiateOAuth({
        platform: selectedPlatform,
        client_id: clientId,
      });

      if (response.auth_url) {
        const oauthWindow = window.open(
          response.auth_url,
          'oauth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );
        if (!oauthWindow) {
          setConnectMessage({ type: 'error', text: 'Popup blocked. Redirecting to OAuth in this tab...' });
          window.location.href = response.auth_url;
          return;
        }
        setConnectMessage({ type: 'info', text: 'Complete the authorization in the popup to connect your account.' });
        const checkClosed = setInterval(() => {
          if (oauthWindow.closed) {
            clearInterval(checkClosed);
            setConnectMessage(null);
            setSelectedPlatform(null);
            loadPlatforms();
          }
        }, 1000);
      } else {
        setConnectMessage({ type: 'error', text: 'Failed to initiate OAuth flow.' });
      }
    } catch (err) {
      setConnectMessage({ type: 'error', text: err.message || 'Unable to initiate OAuth.' });
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect(platformValue, platformLabel) {
    setDisconnecting(platformValue);
    try {
      const result = await disconnectClientPlatform(clientId, platformValue);
      setToast({ type: 'success', message: result.message || `${platformLabel} disconnected.` });
      loadPlatforms();
    } catch (err) {
      setToast({ type: 'error', message: err.message || `Failed to disconnect ${platformLabel}.` });
    } finally {
      setDisconnecting(null);
    }
  }

  async function handleTogglePref(key, value) {
    setPrefs((current) => ({ ...current, [key]: value }));
    setSavingPref(key);
    try {
      const result = await saveClientPreferences(clientId, { [key]: value });
      setPrefs(result.preferences || { ...prefs, [key]: value });
      setToast({ type: 'success', message: 'Notification preferences saved.' });
    } catch (err) {
      setPrefs((current) => ({ ...current, [key]: !value }));
      setToast({ type: 'error', message: err.message || 'Failed to save preferences.' });
    } finally {
      setSavingPref(null);
    }
  }

  async function handleChangePassword(event) {
    event.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setToast({ type: 'error', message: 'All password fields are required.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast({ type: 'error', message: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setToast({ type: 'error', message: 'Password must be at least 8 characters long.' });
      return;
    }
    setSavingPassword(true);
    try {
      const result = await changeClientPassword(clientId, {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setToast({ type: 'success', message: result.message || 'Password changed successfully.' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to change password.' });
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <ClientLayout>
      <PageHeader
        title="Settings"
        subtitle="Manage your account, security and notification preferences."
      />

      {/* Tabs */}
      <div className="mb-6 flex w-full gap-1 overflow-x-auto rounded-2xl border border-surface-variant/70 bg-surface-container-lowest p-1 shadow-card">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-on-primary shadow-card'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-5">
          <div className="card space-y-4 p-6">
            <div className="h-4 w-40 rounded bg-surface-container-high" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="h-11 rounded-xl bg-surface-container-high" />
              ))}
            </div>
          </div>
        </div>
      ) : error ? (
        <section className="card flex flex-col items-center gap-4 px-6 py-14 text-center">
          <span className="material-symbols-outlined text-5xl text-error">error</span>
          <div>
            <h3 className="card-heading">Error loading settings</h3>
            <p className="mt-1 text-sm text-on-surface-variant">{error}</p>
          </div>
          <button onClick={fetchProfile} className="btn btn-primary">
            Retry
          </button>
        </section>
      ) : (
        <>
          {activeTab === 'general' && (
            <div className="space-y-5">
              <SectionCard title="Profile Information" subtitle="Update your personal and organization details" icon="person">
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="flex flex-col items-center gap-5 md:flex-row md:items-start">
                    <div className="flex shrink-0 flex-col items-center gap-2">
                      <label className="group relative cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                        {logoPreview ? (
                          <img
                            alt="Profile"
                            className="h-24 w-24 rounded-2xl object-cover shadow-card ring-4 ring-surface-container"
                            src={logoPreview}
                          />
                        ) : (
                          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-card ring-4 ring-surface-container">
                            <span className="material-symbols-outlined text-[40px]">person</span>
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-primary/40 opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="material-symbols-outlined text-on-primary">photo_camera</span>
                        </div>
                      </label>
                      <span className="text-[11px] text-on-surface-variant">Click to upload logo</span>
                    </div>
                    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
                      <Field label="Full Name">
                        <input
                          className={`input ${profileErrors.fullName ? '!border-error focus:!border-error focus:!ring-error/20' : ''}`}
                          type="text"
                          value={fullName}
                          onChange={e => {
                            setFullName(e.target.value);
                            setProfileErrors(p => ({ ...p, fullName: '' }));
                          }}
                        />
                        {profileErrors.fullName && <p className="text-xs text-error">{profileErrors.fullName}</p>}
                      </Field>
                      <Field label="Email Address">
                        <input
                          className={`input ${profileErrors.email ? '!border-error focus:!border-error focus:!ring-error/20' : ''}`}
                          type="email"
                          value={email}
                          onChange={e => {
                            setEmail(e.target.value);
                            setProfileErrors(p => ({ ...p, email: '' }));
                          }}
                        />
                        {profileErrors.email && <p className="text-xs text-error">{profileErrors.email}</p>}
                      </Field>
                      <Field label="Organization">
                        <input className="input" type="text" value={organization} onChange={e => setOrganization(e.target.value)} />
                      </Field>
                      <Field label="Industry">
                        <input className="input" type="text" value={industry} onChange={e => setIndustry(e.target.value)} />
                      </Field>
                      <div className="md:col-span-2">
                        <Field label="Contact Number">
                          <input className="input" type="tel" value={contactNumber} onChange={e => setContactNumber(e.target.value)} />
                        </Field>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" disabled={savingProfile} className="btn btn-primary">
                      {savingProfile ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">save</span>
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </SectionCard>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                <SectionCard
                  title="Connect Platforms"
                  subtitle="Authenticate with social media platforms using OAuth 2.0"
                  icon="link"
                  className="lg:col-span-7"
                >
                  <form onSubmit={handleConnect} className="space-y-4">
                    {platformsLoading ? (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {[0, 1, 2, 3, 4, 5].map(i => (
                          <div key={i} className="h-[104px] animate-pulse rounded-2xl border border-outline-variant/60 bg-surface-container-low/40" />
                        ))}
                      </div>
                    ) : platformsError ? (
                      <div className="flex flex-col items-center gap-3 rounded-2xl border border-error/20 bg-error-container/40 px-6 py-8 text-center">
                        <span className="material-symbols-outlined text-3xl text-error">link_off</span>
                        <p className="text-sm text-on-surface-variant">{platformsError}</p>
                        <button type="button" onClick={loadPlatforms} className="btn btn-outline btn-sm">Retry</button>
                      </div>
                    ) : platforms.length === 0 ? (
                      <p className="rounded-xl bg-surface-container-low px-4 py-6 text-center text-sm text-on-surface-variant">
                        No platforms available to connect.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {platforms.map((platform) => {
                          const isSelected = selectedPlatform === platform.value;
                          return (
                            <button
                              key={platform.value}
                              type="button"
                              onClick={() => setSelectedPlatform(isSelected ? null : platform.value)}
                              className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all ${
                                isSelected
                                  ? 'border-primary bg-primary/10 text-primary shadow-card'
                                  : 'border-outline-variant/60 bg-surface-container-low/40 text-on-surface hover:-translate-y-0.5 hover:border-outline-variant hover:shadow-card'
                              }`}
                            >
                              <PlatformLogo platform={platform.value} size={28} />
                              <span className="text-sm font-semibold">{platform.label}</span>
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${platform.connected ? 'text-emerald-600' : 'text-on-surface-variant/70'}`}>
                                {platform.connected ? 'Connected' : 'Not connected'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {connectMessage && (
                      <p className={`text-sm ${connectMessage.type === 'error' ? 'text-error' : connectMessage.type === 'success' ? 'text-emerald-600' : 'text-on-surface-variant'}`}>
                        {connectMessage.text}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={connecting || !selectedPlatform || platformsLoading}
                      className="btn btn-primary w-full"
                    >
                      {connecting ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent" />
                          Authenticating...
                        </>
                      ) : (
                        'Start OAuth Authentication'
                      )}
                    </button>
                  </form>
                </SectionCard>

                <SectionCard
                  title="Platform Status"
                  subtitle="Real API connection status for your accounts"
                  icon="cloud_done"
                  className="lg:col-span-5"
                  bodyClassName="p-0 md:p-0"
                >
                  <ul className="divide-y divide-surface-variant/50">
                    {platformsLoading ? (
                      [0, 1, 2].map(i => (
                        <li key={i} className="flex items-center gap-3 px-5 py-4 md:px-6">
                          <span className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-surface-container-high" />
                          <span className="flex-1 space-y-2">
                            <span className="block h-3 w-24 animate-pulse rounded bg-surface-container-high" />
                            <span className="block h-2.5 w-32 animate-pulse rounded bg-surface-container-low" />
                          </span>
                        </li>
                      ))
                    ) : platformsError ? (
                      <li className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                        <span className="material-symbols-outlined text-4xl text-error">cloud_off</span>
                        <p className="text-sm text-on-surface-variant">{platformsError}</p>
                        <button type="button" onClick={loadPlatforms} className="btn btn-outline btn-sm">
                          Retry
                        </button>
                      </li>
                    ) : platforms.length === 0 ? (
                      <li className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                        <span className="material-symbols-outlined text-4xl text-outline/40">link</span>
                        <p className="text-sm text-on-surface-variant">No platforms have been connected yet.</p>
                      </li>
                    ) : (
                      platforms.map((platform) => (
                        <li key={platform.value} className="flex items-center justify-between gap-3 px-5 py-4 md:px-6">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-high">
                              <PlatformLogo platform={platform.value} size={20} />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-on-surface">{platform.label}</p>
                              <p className="truncate text-xs text-on-surface-variant">
                                {platform.connected
                                  ? (platform.account_username || 'Connected to API')
                                  : platform.supports_graph
                                  ? 'Not connected'
                                  : 'Publish not supported'}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {platform.connected ? (
                              <>
                                <span className="badge badge-success">Connected</span>
                                <button
                                  type="button"
                                  onClick={() => handleDisconnect(platform.value, platform.label)}
                                  disabled={disconnecting === platform.value}
                                  className="btn btn-ghost btn-sm text-error hover:bg-error/5"
                                >
                                  {disconnecting === platform.value ? 'Removing...' : 'Disconnect'}
                                </button>
                              </>
                            ) : (
                              <span className="badge badge-neutral">Pending</span>
                            )}
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </SectionCard>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="mx-auto flex max-w-2xl flex-col items-center space-y-5">
              <SectionCard
                title="Change Password"
                subtitle="Update the password used to sign in to your account"
                icon="lock"
                className="w-full"
              >
                <form onSubmit={handleChangePassword} className="mx-auto w-full max-w-md space-y-5">
                  <Field label="Current Password">
                    <input
                      className="input"
                      type="password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      autoComplete="current-password"
                      placeholder="Enter current password"
                    />
                  </Field>
                  <Field label="New Password">
                    <input
                      className="input"
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                    />
                  </Field>
                  <Field label="Confirm New Password">
                    <input
                      className="input"
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder="Re-enter new password"
                    />
                  </Field>
                  <div className="flex justify-end">
                    <button type="submit" disabled={savingPassword} className="btn btn-primary w-full sm:w-auto">
                      {savingPassword ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                          Update Password
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </SectionCard>

              <SectionCard
                title="Two-Factor Authentication"
                subtitle="Add an extra layer of security to your account"
                icon="security"
                className="w-full"
              >
                <div className="flex items-center justify-between gap-4 rounded-xl border border-surface-variant/60 bg-surface-container-low/40 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <span className="material-symbols-outlined text-[20px]">key</span>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">Two-factor authentication</p>
                      <p className="text-xs text-on-surface-variant">
                        {prefs.two_factor_enabled ? 'Enabled — extra verification required on sign in.' : 'Disabled — one-step sign in only.'}
                      </p>
                    </div>
                  </div>
                  <Toggle
                    checked={Boolean(prefs.two_factor_enabled)}
                    disabled={savingPref === 'two_factor_enabled'}
                    onChange={(value) => handleTogglePref('two_factor_enabled', value)}
                  />
                </div>
                {savingPref === 'two_factor_enabled' && (
                  <p className="mt-3 text-xs text-on-surface-variant">Saving...</p>
                )}
              </SectionCard>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="mx-auto flex max-w-3xl flex-col items-center">
              <SectionCard
                title="Notification Preferences"
                subtitle="Choose which notifications you want to receive"
                icon="notifications"
                className="w-full"
                bodyClassName="p-0 md:p-0"
              >
                <ul className="divide-y divide-surface-variant/50">
                  {NOTIFICATION_PREFS.map((item) => (
                    <li key={item.key} className="flex items-center justify-between gap-4 px-5 py-4 md:px-6">
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{item.label}</p>
                        <p className="mt-0.5 text-xs text-on-surface-variant">{item.description}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {savingPref === item.key && <span className="text-xs text-on-surface-variant">Saving...</span>}
                        <Toggle
                          checked={Boolean(prefs[item.key])}
                          disabled={savingPref === item.key}
                          onChange={(value) => handleTogglePref(item.key, value)}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            </div>
          )}
        </>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </ClientLayout>
  );
}
