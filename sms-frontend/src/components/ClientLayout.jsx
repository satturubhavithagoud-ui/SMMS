import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getClientNotifications, markClientNotificationRead, getClientProfile } from '../services/smhService';

function getUser() {
  try {
    return JSON.parse(window.localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

function formatNotifTime(iso) {
  if (!iso) return '';
  const then = new Date(iso);
  const diff = Date.now() - then.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString();
}

const NOTIFICATION_ICONS = {
  POST_APPROVAL: 'rate_review',
  POST_APPROVED: 'check_circle',
  POST_REJECTED: 'cancel',
  POST_FAILED: 'error',
  PACKAGE_EXPIRY: 'hourglass_bottom',
  REPORT_READY: 'description',
};

const navItems = [
  { name: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
  { name: 'Schedule', icon: 'calendar_month', path: '/scheduler' },
  { name: 'Analytics', icon: 'analytics', path: '/analytics' },
  { name: 'Settings', icon: 'settings', path: '/settings' },
];

function NavLinks({ onNavigate }) {
  const location = useLocation();
  return (
    <>
      {navItems.map(item => {
        const active = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-white/10 text-on-primary'
                : 'text-on-primary/70 hover:bg-white/5 hover:text-on-primary'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        );
      })}
    </>
  );
}

export default function ClientLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getUser();
  const clientId = user?.client_id || null;

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [profileName, setProfileName] = useState(user?.first_name || user?.username || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const data = await getClientNotifications(clientId);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setNotifLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;
    loadNotifications();
    getClientProfile(clientId)
      .then(profile => {
        if (profile?.logo_url) setAvatar(profile.logo_url);
        if (profile?.first_name) setProfileName(profile.first_name);
        if (profile?.email) setProfileEmail(profile.email);
      })
      .catch(() => {});
  }, [clientId, loadNotifications]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      const data = await markClientNotificationRead(clientId, { read_all: true });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(data.unread_count || 0);
    } catch {
      loadNotifications();
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markClientNotificationRead(clientId, { notification_id: id });
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      loadNotifications();
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('user');
    navigate('/sign-in');
  };

  const initial = (profileName || 'C').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface antialiased">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-50 hidden h-full w-[248px] flex-col bg-primary py-6 text-on-primary md:flex">
        <div className="mb-8 flex items-center gap-3 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-on-primary/10">
            <span className="material-symbols-outlined text-on-primary">dashboard</span>
          </div>
          <div>
            <h1 className="font-manrope text-base font-bold leading-5">Client Portal</h1>
            <p className="text-[11px] text-on-primary/60">SocialManager Pro</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-4">
          <NavLinks />
        </nav>
        <div className="mt-4 border-t border-on-primary/10 px-6 pt-4">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-on-primary/70 transition-colors hover:bg-white/5 hover:text-on-primary"
          >
            <span className="material-symbols-outlined">logout</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* Top AppBar */}
      <header className="sticky top-0 z-40 h-16 border-b border-surface-variant/70 bg-surface/90 backdrop-blur-md md:ml-[248px]">
        <div className="flex h-full items-center justify-between gap-4 px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container md:hidden"
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="font-manrope text-lg font-bold text-primary">SocialManager Pro</h1>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setNotifOpen(prev => !prev);
                  setProfileOpen(false);
                  if (!notifOpen) loadNotifications();
                }}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container"
                aria-label="Notifications"
              >
                <span className="material-symbols-outlined">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-on-error">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-12 w-[340px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-surface-variant bg-surface-container-lowest shadow-popover">
                  <div className="flex items-center justify-between border-b border-surface-variant px-5 py-3.5">
                    <span className="font-manrope text-sm font-semibold text-on-surface">Notifications</span>
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      disabled={unreadCount === 0}
                      className="text-xs font-semibold text-primary transition-colors hover:underline disabled:text-on-surface-variant/50 disabled:cursor-not-allowed"
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="max-h-[340px] overflow-y-auto">
                    {notifLoading && notifications.length === 0 ? (
                      <div className="space-y-4 p-5">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="animate-pulse space-y-2">
                            <div className="h-3 w-2/3 rounded-full bg-surface-container-high" />
                            <div className="h-3 w-full rounded-full bg-surface-container-low" />
                          </div>
                        ))}
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-5 py-10 text-center text-sm text-on-surface-variant">
                        <span className="mb-2 block material-symbols-outlined text-3xl text-outline/40">notifications_off</span>
                        No notifications yet.
                      </div>
                    ) : (
                      <ul className="divide-y divide-surface-variant/50">
                        {notifications.map(n => (
                          <li key={n.id}>
                            <button
                              type="button"
                              onClick={() => { if (!n.is_read) handleMarkRead(n.id); }}
                              className={`flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-surface-container ${n.is_read ? '' : 'bg-primary-fixed-dim/30'}`}
                            >
                              <span className="material-symbols-outlined mt-0.5 shrink-0 text-primary">
                                {NOTIFICATION_ICONS[n.type] || 'notifications'}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold text-on-surface">{n.title}</span>
                                <span className="mt-0.5 block text-xs leading-5 text-on-surface-variant line-clamp-2">{n.message}</span>
                                <span className="mt-1 block text-[11px] text-on-surface-variant/70">{formatNotifTime(n.created_at)}</span>
                              </span>
                              {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(prev => !prev);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-2 transition-colors hover:bg-surface-container"
                aria-label="Account menu"
              >
                <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-surface-variant bg-primary-fixed-dim text-sm font-bold text-primary">
                  {avatar ? <img alt="Profile" className="h-full w-full object-cover" src={avatar} /> : initial}
                </span>
                <span className="hidden text-left lg:block">
                  <span className="block max-w-[140px] truncate text-sm font-semibold leading-4 text-on-surface">{profileName || 'Client'}</span>
                  <span className="block text-[11px] text-on-surface-variant">Client account</span>
                </span>
                <span className="material-symbols-outlined hidden text-base text-on-surface-variant lg:block">expand_more</span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-12 w-64 overflow-hidden rounded-2xl border border-surface-variant bg-surface-container-lowest shadow-popover">
                  <div className="border-b border-surface-variant px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-fixed-dim text-sm font-bold text-primary">
                        {avatar ? <img alt="Profile" className="h-full w-full object-cover" src={avatar} /> : initial}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-manrope text-sm font-semibold text-on-surface">{profileName || 'Client'}</p>
                        <p className="truncate text-xs text-on-surface-variant">{profileEmail || 'No email on file'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    {navItems.map(item => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          location.pathname === item.path
                            ? 'bg-primary/10 text-primary'
                            : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                        {item.name}
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-surface-variant p-2">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-error transition-colors hover:bg-error/5"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-950/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-[280px] flex-col bg-primary py-6 text-on-primary shadow-popover">
            <div className="mb-8 flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-on-primary/10">
                  <span className="material-symbols-outlined">dashboard</span>
                </div>
                <h1 className="font-manrope text-base font-bold leading-5">Client Portal</h1>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-on-primary/70 hover:bg-white/5"
                aria-label="Close menu"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-4">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </nav>
            <div className="mt-4 border-t border-on-primary/10 px-6 pt-4">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-on-primary/70 transition-colors hover:bg-white/5 hover:text-on-primary"
              >
                <span className="material-symbols-outlined">logout</span>
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="px-4 pb-16 pt-8 md:ml-[248px] md:px-8 md:pb-12 md:pt-10">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
