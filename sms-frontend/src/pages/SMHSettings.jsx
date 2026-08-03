import React, { useState, useEffect, useCallback } from 'react';
import SMHLayout from '../components/SMHLayout';
import { getSMHProfile, updateSMHProfile } from '../services/smhService';

const AVATAR_COLORS = [
  'bg-primary text-on-primary',
  'bg-tertiary text-on-tertiary',
  'bg-[#0EA5E9] text-white',
  'bg-[#8B5CF6] text-white',
  'bg-[#F97316] text-white',
  'bg-[#10B981] text-white',
  'bg-[#EC4899] text-white',
];

function avatarColor(name) {
  const n = (name || '').trim();
  let hash = 0;
  for (let i = 0; i < n.length; i += 1) hash = (hash * 31 + n.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
}

function NotifToggle({ label, value, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between gap-md">
      <span className="text-body-md text-on-surface-variant">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        disabled={disabled}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-60 ${value ? 'bg-primary' : 'bg-surface-container-highest'}`}
      >
        <span className={`${value ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
      </button>
    </div>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed top-24 right-4 z-[60] flex items-center gap-sm px-lg py-md rounded-xl shadow-xl border ${
      type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      <span className="material-symbols-outlined">{type === 'success' ? 'check_circle' : 'error'}</span>
      <span className="font-label-bold">{message}</span>
    </div>
  );
}

export default function SMHSettings() {
  const [activeTab, setActiveTab] = useState('General');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingNotif, setSavingNotif] = useState(null);
  const [toast, setToast] = useState(null);

  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [errors, setErrors] = useState({});

  const [notifPrefs, setNotifPrefs] = useState({ email: true, push: true, weekly: true });
  const [billing, setBilling] = useState(null);

  const showToast = useCallback((message, type = 'success') => setToast({ message, type }), []);

  const loadProfile = useCallback(() => {
    const user = getUser();
    const userId = user?.user_id;
    if (!userId) {
      setLoading(false);
      setLoadError('User not identified. Please sign in again.');
      return;
    }
    setLoading(true);
    setLoadError(null);
    getSMHProfile(userId)
      .then(data => {
        setFirstName(data.first_name || '');
        setEmail(data.email || '');
        setDesignation(data.designation || '');
        setExperienceYears(String(data.experience_years ?? ''));
        setAgencyName(data.agency_name || '');
        const prefs = data.notification_preferences;
        setNotifPrefs({ email: prefs?.email ?? true, push: prefs?.push ?? true, weekly: prefs?.weekly ?? true });
        setBilling(data.billing || null);
      })
      .catch(err => setLoadError(err.message || 'Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const validate = () => {
    const errs = {};
    if (!firstName.trim()) errs.firstName = 'Full name is required.';
    if (!email.trim()) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email format.';
    if (experienceYears && (isNaN(Number(experienceYears)) || Number(experienceYears) < 0)) errs.experienceYears = 'Must be a valid number.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      showToast('Please fix the highlighted fields.', 'error');
      return;
    }
    const user = getUser();
    const userId = user?.user_id;
    if (!userId) { showToast('User not identified.', 'error'); return; }
    setSaving(true);
    try {
      const res = await updateSMHProfile({
        user_id: userId,
        first_name: firstName.trim(),
        email: email.trim(),
        designation: designation.trim(),
        experience_years: experienceYears ? Number(experienceYears) : 0,
        agency_name: agencyName.trim(),
      });
      const updatedUser = { ...user, username: res.user.first_name, email: res.user.email };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      if (res.user.notification_preferences) setNotifPrefs(res.user.notification_preferences);
      showToast('Profile updated successfully!');
    } catch (err) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotif = async (key, value) => {
    const user = getUser();
    const userId = user?.user_id;
    if (!userId) { showToast('User not identified.', 'error'); return; }
    const prev = notifPrefs;
    setNotifPrefs(p => ({ ...p, [key]: value }));
    setSavingNotif(key);
    try {
      const res = await updateSMHProfile({
        user_id: userId,
        notification_preferences: { [key]: value },
      });
      if (res.user?.notification_preferences) setNotifPrefs(res.user.notification_preferences);
      showToast(`${key === 'email' ? 'Email notifications' : key === 'push' ? 'Push notifications' : 'Weekly reports'} ${value ? 'enabled' : 'disabled'}`);
    } catch (err) {
      setNotifPrefs(prev);
      showToast(err.message || 'Failed to update preference.', 'error');
    } finally {
      setSavingNotif(null);
    }
  };

  const handleDiscard = () => {
    loadProfile();
    setErrors({});
  };

  const tabs = ['General', 'Security', 'Integrations', 'Billing'];

  const planName = billing?.plan || 'Not Assigned';
  const billingStatus = billing?.status || 'Not Assigned';
  const nextBilling = billing?.next_billing_date || '—';
  const hasBilling = Boolean(billing);

  return (
    <SMHLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <main className="p-xl max-w-7xl mx-auto">
        <header className="mb-xl">
          <h2 className="font-headline-xl text-headline-xl text-primary font-bold">Settings</h2>
          <p className="text-on-surface-variant text-body-md">Manage your agency workspace, profile, and billing.</p>
        </header>

        <div className="flex border-b border-outline-variant mb-xl gap-xl overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-md whitespace-nowrap font-bold transition-colors ${
                activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center gap-md py-20 text-center">
            <span className="material-symbols-outlined text-4xl text-error">cloud_off</span>
            <p className="text-on-surface-variant">{loadError}</p>
            <button onClick={loadProfile} className="px-lg py-sm bg-primary text-on-primary rounded-lg font-label-bold shadow-md hover:opacity-95">
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
            <div className="lg:col-span-8 space-y-xl min-w-0">
              <section className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-sm">
                <div className="flex items-center justify-between mb-lg">
                  <h3 className="font-headline-md text-headline-md text-on-surface">Profile Settings</h3>
                  <span className="material-symbols-outlined text-primary/40">person</span>
                </div>
                <div className="flex flex-col sm:flex-row items-start gap-lg">
                  <div className="relative group cursor-pointer shrink-0">
                    <div className={`w-24 h-24 rounded-xl flex items-center justify-center text-[36px] font-bold ring-4 ring-surface-container shadow-md ${avatarColor(firstName)}`}>
                      {(firstName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-white">photo_camera</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-md">
                    <div className="space-y-xs">
                      <label className="font-label-bold text-label-bold text-on-surface-variant">Full Name</label>
                      <input value={firstName} onChange={e => setFirstName(e.target.value)}
                        className={`w-full border rounded-lg bg-surface focus:border-primary focus:ring-1 focus:ring-primary py-sm px-md text-body-md ${errors.firstName ? 'border-red-400' : 'border-outline-variant'}`}
                        type="text" />
                      {errors.firstName && <p className="text-red-500 text-[10px]">{errors.firstName}</p>}
                    </div>
                    <div className="space-y-xs">
                      <label className="font-label-bold text-label-bold text-on-surface-variant">Email Address</label>
                      <input value={email} onChange={e => setEmail(e.target.value)}
                        className={`w-full border rounded-lg bg-surface focus:border-primary focus:ring-1 focus:ring-primary py-sm px-md text-body-md ${errors.email ? 'border-red-400' : 'border-outline-variant'}`}
                        type="email" />
                      {errors.email && <p className="text-red-500 text-[10px]">{errors.email}</p>}
                    </div>
                    <div className="space-y-xs">
                      <label className="font-label-bold text-label-bold text-on-surface-variant">Designation</label>
                      <input value={designation} onChange={e => setDesignation(e.target.value)}
                        className="w-full border border-outline-variant rounded-lg bg-surface focus:border-primary focus:ring-1 focus:ring-primary py-sm px-md text-body-md"
                        type="text" placeholder="e.g. Social Strategy Lead" />
                    </div>
                    <div className="space-y-xs">
                      <label className="font-label-bold text-label-bold text-on-surface-variant">Experience (Years)</label>
                      <input value={experienceYears} onChange={e => setExperienceYears(e.target.value)}
                        className={`w-full border rounded-lg bg-surface focus:border-primary focus:ring-1 focus:ring-primary py-sm px-md text-body-md ${errors.experienceYears ? 'border-red-400' : 'border-outline-variant'}`}
                        type="number" min="0" />
                      {errors.experienceYears && <p className="text-red-500 text-[10px]">{errors.experienceYears}</p>}
                    </div>
                    <div className="space-y-xs md:col-span-2">
                      <label className="font-label-bold text-label-bold text-on-surface-variant">Agency Name</label>
                      <input value={agencyName} onChange={e => setAgencyName(e.target.value)}
                        className="w-full border border-outline-variant rounded-lg bg-surface focus:border-primary focus:ring-1 focus:ring-primary py-sm px-md text-body-md"
                        type="text" placeholder="Your agency / workspace name" />
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="lg:col-span-4 space-y-xl min-w-0">
              <section className="bg-primary text-on-primary rounded-xl overflow-hidden shadow-lg">
                <div className="p-lg">
                  <div className="flex justify-between items-start mb-lg gap-sm">
                    <div className="min-w-0">
                      <p className="font-label-bold text-on-primary/60 uppercase tracking-widest text-[10px]">Current Plan</p>
                      <h4 className="font-headline-md text-headline-md break-words">{planName}</h4>
                    </div>
                    <span className={`px-md py-xs text-[10px] font-bold rounded-full whitespace-nowrap ${
                      hasBilling ? 'bg-primary-fixed text-primary' : 'bg-on-primary/15 text-on-primary'
                    }`}>
                      {billingStatus.toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-md mb-lg">
                    <div className="flex items-center justify-between gap-sm">
                      <span className="text-on-primary/70 text-body-md">Next billing:</span>
                      <span className="font-bold text-right">{nextBilling}</span>
                    </div>
                  </div>
                  <button className="w-full bg-on-primary text-primary py-sm rounded-lg font-bold transition-transform active:scale-95">Manage Billing</button>
                </div>
              </section>

              <section className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-sm">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-lg">Notifications</h3>
                <div className="space-y-md">
                  <NotifToggle label="Email Notifications" value={notifPrefs.email} disabled={savingNotif === 'email'} onChange={v => handleToggleNotif('email', v)} />
                  <NotifToggle label="Push Notifications" value={notifPrefs.push} disabled={savingNotif === 'push'} onChange={v => handleToggleNotif('push', v)} />
                  <NotifToggle label="Weekly Reports" value={notifPrefs.weekly} disabled={savingNotif === 'weekly'} onChange={v => handleToggleNotif('weekly', v)} />
                </div>
              </section>
            </div>
          </div>
        )}

        <footer className="mt-xl pt-lg border-t border-outline-variant flex justify-end gap-md">
          <button onClick={handleDiscard} className="px-xl py-md text-on-surface-variant font-label-bold hover:text-primary transition-colors">Discard Changes</button>
          <button onClick={handleSave} disabled={saving || loading}
            className="px-xl py-md bg-primary text-on-primary rounded-xl font-label-bold shadow-md hover:opacity-95 transition-all active:scale-95 disabled:opacity-60 flex items-center gap-sm">
            {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-on-primary"></div>}
            {saving ? 'Saving...' : 'Save & Update Profile'}
          </button>
        </footer>
      </main>
    </SMHLayout>
  );
}
