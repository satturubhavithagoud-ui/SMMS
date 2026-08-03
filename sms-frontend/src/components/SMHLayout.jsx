import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SearchContext } from '../context/SearchContext';
import { getSMHSummary } from '../services/smhService';
import { globalSearch } from '../services/searchService';
import PlatformLogo from './PlatformLogo';

function getUserFromStorage() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getInitials(user) {
  if (!user) return 'U';
  const name = user.username || user.email || '';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name[0] || 'U').toUpperCase();
}

function formatAlertTime(index) {
  const times = ['Just now', '10m ago', '1h ago', '3h ago', '1d ago'];
  return times[index] || 'Recently';
}

export default function SMHLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const user = getUserFromStorage();
  const userInitials = getInitials(user);
  const userName = user?.username || user?.email?.split('@')[0] || 'User';

  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const searchRef = useRef(null);
  const searchTimer = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/sign-in');
  };

  const fetchNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    try {
      const summary = await getSMHSummary();
      const alerts = (summary?.alerts ?? []).map((a, i) => ({
        id: i,
        title: a.title,
        message: a.message,
        time: formatAlertTime(i),
        unread: a.type === 'warning',
        type: a.type,
      }));
      setNotifications(alerts);
    } catch {
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Debounced global search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const results = await globalSearch(searchQuery);
        setSearchResults(results);
      } catch {
        setSearchResults({ clients: [], posts: [], platform: null });
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [searchQuery]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const navItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/smh-dashboard', section: 'Workspace' },
    { name: 'Clients', icon: 'group', path: '/smh-clients', section: 'Workspace' },
    { name: 'Content queue', icon: 'schedule', path: '/smh-content-queue', section: 'Workspace' },
    { name: 'Schedule', icon: 'calendar_month', path: '/smh-scheduler', section: 'Workspace' },
    { name: 'Analytics', icon: 'analytics', path: '/smh-analytics', section: 'Tools' },
    { name: 'AI Caption Studio', icon: 'auto_awesome', path: '/smh-ai-studio', section: 'Tools' },
    { name: 'Settings', icon: 'settings', path: '/smh-settings', section: 'Admin' },
  ];

  const handleSearchSelect = (type, item) => {
    setShowSearchResults(false);
    setSearchQuery('');
    if (type === 'client') navigate('/smh-clients');
    else if (type === 'post') navigate('/smh-content-queue');
    else if (type === 'platform') navigate('/smh-content-queue');
  };

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      <div className="bg-background font-body-md text-on-surface antialiased min-h-screen flex">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`w-[240px] h-screen fixed left-0 top-0 bg-primary z-50 flex flex-col py-xl border-r border-outline-variant/10 transition-transform duration-200
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        >
          <div className="px-lg mb-lg flex items-center gap-sm">
            <div className="w-8 h-8 rounded-lg bg-on-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[20px]">dashboard</span>
            </div>
            <h1 className="text-on-primary font-headline-md tracking-tight text-sm">SocialManager Pro</h1>
          </div>

          <nav className="flex-1 space-y-md overflow-y-auto px-md">
            {['Workspace', 'Tools', 'Admin'].map((section) => (
              <div key={section} className="py-2">
                <p className="px-lg mb-2 text-on-primary-container font-label-bold opacity-50 uppercase tracking-widest text-[10px]">
                  {section}
                </p>
                <ul className="space-y-1">
                  {navItems
                    .filter((item) => item.section === section)
                    .map((item) => (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          className={`flex items-center gap-md px-lg py-3 rounded-xl transition-colors duration-200 ${
                            location.pathname === item.path
                              ? 'bg-white/10 text-on-primary font-bold'
                              : 'text-on-primary/70 hover:text-on-primary hover:bg-white/5'
                          }`}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{
                              fontVariationSettings:
                                location.pathname === item.path ? "'FILL' 1" : "'FILL' 0",
                            }}
                          >
                            {item.icon}
                          </span>
                          <span className="font-label-bold">{item.name}</span>
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="mt-auto px-lg pt-lg border-t border-on-primary/10 flex items-center gap-md">
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary text-xs font-bold">
              {userInitials}
            </div>
            <div className="min-w-0">
              <p className="text-on-primary font-label-bold text-[12px] truncate">{userName}</p>
              <div className="flex items-center gap-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                <span className="text-on-primary-container text-[10px]">Online</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main area */}
        <div className="flex-1 lg:ml-[240px] min-h-screen flex flex-col min-w-0">
          <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm h-20 px-md lg:px-xl flex items-center justify-between border-b border-surface-variant shrink-0">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-sm mr-sm hover:bg-surface-container-high rounded-lg transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            {/* Search */}
            <div className="flex-1 max-w-2xl" ref={searchRef}>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">
                  search
                </span>
                <input
                  className="w-full bg-surface-container-low border-none rounded-xl pl-[48px] pr-lg py-md text-body-md focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline"
                  placeholder="Search clients, posts, platforms..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                />
                {searchLoading && (
                  <div className="absolute right-md top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}

                {/* Search results dropdown */}
                {showSearchResults && searchQuery.trim().length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-xs bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
                    {!searchResults && searchLoading ? (
                      <p className="p-md text-on-surface-variant text-sm">Searching...</p>
                    ) : searchResults &&
                      searchResults.clients.length === 0 &&
                      searchResults.posts.length === 0 &&
                      !searchResults.platform ? (
                      <p className="p-md text-on-surface-variant text-sm">No results for "{searchQuery}"</p>
                    ) : (
                      <>
                        {searchResults?.platform && (
                          <button
                            onClick={() => handleSearchSelect('platform', searchResults.platform)}
                            className="w-full text-left px-md py-sm hover:bg-surface-container flex items-center gap-sm border-b border-outline-variant/50"
                          >
                            <PlatformLogo platform={searchResults.platform} size={16} variant="badge" />
                            <span className="text-sm font-label-bold">View {searchResults.platform} posts</span>
                          </button>
                        )}
                        {searchResults?.clients?.length > 0 && (
                          <div className="p-xs">
                            <p className="px-sm py-xs text-[10px] font-label-bold text-on-surface-variant uppercase">
                              Clients
                            </p>
                            {searchResults.clients.map((c) => (
                              <button
                                key={c.id}
                                onClick={() => handleSearchSelect('client', c)}
                                className="w-full text-left px-sm py-sm rounded-lg hover:bg-surface-container flex items-center gap-sm"
                              >
                                <span className="material-symbols-outlined text-primary text-[18px]">group</span>
                                <div className="min-w-0">
                                  <p className="text-sm font-label-bold truncate">{c.name}</p>
                                  <p className="text-[10px] text-on-surface-variant truncate">{c.industry}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        {searchResults?.posts?.length > 0 && (
                          <div className="p-xs border-t border-outline-variant/50">
                            <p className="px-sm py-xs text-[10px] font-label-bold text-on-surface-variant uppercase">
                              Posts
                            </p>
                            {searchResults.posts.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => handleSearchSelect('post', p)}
                                className="w-full text-left px-sm py-sm rounded-lg hover:bg-surface-container flex items-start gap-sm"
                              >
                                <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">article</span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm line-clamp-1">{p.caption || 'Untitled post'}</p>
                                  <p className="text-[10px] text-on-surface-variant">
                                    {p.client_name} · {p.status}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-md lg:gap-xl pl-md lg:pl-xl">
              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowProfileMenu(false);
                    if (!showNotifications) fetchNotifications();
                  }}
                  className="relative p-sm hover:bg-surface-container-high rounded-full transition-colors"
                  aria-label="Notifications"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-[#FF914D] rounded-full border-2 border-surface text-[9px] font-bold text-white flex items-center justify-center px-[3px]">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-80 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl z-50 p-md space-y-sm">
                    <div className="flex justify-between items-center pb-xs border-b border-outline-variant">
                      <h4 className="font-headline-md text-sm text-primary">Notifications</h4>
                      {unreadCount > 0 && (
                        <span className="text-[10px] bg-primary/10 text-primary px-sm py-[2px] rounded-full font-bold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {notificationsLoading ? (
                      <div className="py-lg flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : notifications.length === 0 ? (
                      <p className="text-sm text-on-surface-variant py-md text-center">No notifications</p>
                    ) : (
                      <div className="space-y-xs max-h-60 overflow-y-auto">
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-sm rounded-lg text-xs hover:bg-surface-container transition-colors cursor-default ${
                              n.unread ? 'bg-primary/5 border-l-2 border-[#FF914D]' : ''
                            }`}
                          >
                            <div className="flex justify-between items-center text-[10px] text-on-surface-variant mb-[2px]">
                              <span className="flex items-center gap-xs">
                                <span
                                  className={`material-symbols-outlined text-[14px] ${
                                    n.type === 'warning' ? 'text-orange-500' : 'text-blue-500'
                                  }`}
                                >
                                  {n.type === 'warning' ? 'warning' : 'info'}
                                </span>
                                {n.title}
                              </span>
                              <span>{n.time}</span>
                            </div>
                            <p className="text-on-surface line-clamp-2 pl-[22px]">{n.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <Link
                      to="/smh-dashboard"
                      onClick={() => setShowNotifications(false)}
                      className="block text-center text-xs text-primary font-label-bold pt-sm hover:underline"
                    >
                      View all on Dashboard
                    </Link>
                  </div>
                )}
              </div>

              {/* Profile */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-sm cursor-pointer group select-none"
                  aria-label="Profile menu"
                >
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold group-hover:ring-4 group-hover:ring-primary/10 transition-all">
                    {userInitials}
                  </div>
                  <span className="material-symbols-outlined text-outline hidden sm:block">expand_more</span>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-52 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl z-50 py-sm">
                    <div className="px-md py-sm border-b border-outline-variant mb-xs">
                      <p className="font-label-bold text-sm text-on-surface truncate">{userName}</p>
                      <p className="text-[10px] text-on-surface-variant truncate">{user?.email}</p>
                    </div>
                    <Link
                      to="/smh-settings"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-sm px-md py-sm text-sm text-on-surface hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">person</span>
                      <span>Profile</span>
                    </Link>
                    <Link
                      to="/smh-settings"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-sm px-md py-sm text-sm text-on-surface hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">settings</span>
                      <span>Settings</span>
                    </Link>
                    <div className="h-px bg-outline-variant my-xs"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-sm px-md py-sm text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page content — single scroll container */}
          <div className="flex-1 px-md lg:px-xl py-lg lg:py-xl overflow-x-hidden">
            {children}
          </div>
        </div>
      </div>
    </SearchContext.Provider>
  );
}
