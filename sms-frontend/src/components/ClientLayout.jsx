import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';

export default function ClientLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState('');
  const [userInfo, setUserInfo] = useState({ name: 'Client', email: '' });
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const menuRef = useRef(null);

  // Close menu if clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadUserData = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      if (stored) {
        setUserInfo({
          name: stored.username || 'Client',
          email: stored.email || '',
        });
        if (stored.profile_picture) {
          setProfilePic(stored.profile_picture);
        } else {
          setProfilePic('');
        }
      }
      return stored?.client_id;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  useEffect(() => {
    const clientId = loadUserData();

    // Fetch live profile details if logged in
    if (clientId) {
      apiRequest(`/client-profile/?client_id=${clientId}`)
        .then((data) => {
          if (data) {
            setUserInfo({
              name: data.full_name || 'Client',
              email: data.email || '',
            });
            if (data.profile_picture) {
              setProfilePic(data.profile_picture);
              // Save in localStorage
              try {
                const stored = JSON.parse(localStorage.getItem('user') || '{}');
                stored.profile_picture = data.profile_picture;
                stored.username = data.full_name;
                stored.email = data.email;
                localStorage.setItem('user', JSON.stringify(stored));
              } catch (e) {}
            }
          }
        })
        .catch((err) => console.error('Error fetching client header profile:', err));
    }

    // Listen to profile updates
    const handleProfileUpdate = () => {
      loadUserData();
    };
    window.addEventListener('user-profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('user-profile-updated', handleProfileUpdate);
  }, []);

  const triggerLogout = () => {
    setMenuOpen(false);
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    localStorage.removeItem('user');
    navigate('/sign-in');
  };

  const navItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { name: 'Schedule', icon: 'calendar_month', path: '/scheduler' },
    { name: 'Analytics', icon: 'analytics', path: '/analytics' },
    { name: 'Settings', icon: 'settings', path: '/settings' },
  ];

  return (
    <div className="bg-background font-body-md text-on-surface antialiased min-h-screen">
      {/* Top AppBar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-surface border-b border-surface-variant h-[64px] flex justify-between items-center px-lg md:ml-[240px]">
        <div className="flex items-center gap-md">
          <h1 className="font-headline-md text-headline-md font-bold text-primary">Content Manager</h1>
        </div>
        <div className="flex items-center gap-md relative" ref={menuRef}>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-9 h-9 rounded-full bg-primary-fixed-dim flex items-center justify-center overflow-hidden border border-surface-variant hover:opacity-90 active:scale-95 transition-all outline-none cursor-pointer"
          >
            {profilePic ? (
              <img 
                alt="User profile" 
                className="w-full h-full object-cover" 
                src={profilePic} 
              />
            ) : (
              <span className="material-symbols-outlined text-primary text-xl">person</span>
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-[45px] w-64 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 z-50">
              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-primary-fixed-dim flex items-center justify-center overflow-hidden shrink-0">
                  {profilePic ? (
                    <img 
                      alt="User profile" 
                      className="w-full h-full object-cover" 
                      src={profilePic} 
                    />
                  ) : (
                    <span className="material-symbols-outlined text-primary text-xl">person</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-gray-800 truncate">{userInfo.name}</p>
                  <p className="text-xs text-gray-500 truncate">{userInfo.email}</p>
                </div>
              </div>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  triggerLogout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left cursor-pointer border-0"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[240px] h-full fixed left-0 top-0 bg-primary z-50 flex-col py-xl border-r border-outline-variant/10 text-on-primary">
        <div className="px-lg mb-lg flex items-center gap-sm">
          <div className="w-8 h-8 rounded-lg bg-on-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[20px]">dashboard</span>
          </div>
          <h1 className="text-on-primary font-headline-md tracking-tight">Client Portal</h1>
        </div>
        <nav className="flex-1 space-y-xs overflow-y-auto px-md">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-md px-lg py-md rounded-xl transition-colors duration-200 ${
                location.pathname === item.path
                  ? 'bg-white/10 text-on-primary font-bold'
                  : 'text-on-primary/70 hover:text-on-primary hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: location.pathname === item.path ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="pt-[80px] pb-[100px] px-lg md:ml-[240px]">
        {children}
      </main>

      {/* Bottom Navigation Bar (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-surface-variant/20 h-[72px] flex items-center justify-around px-md z-50 md:hidden">
        {navItems.map(item => (
          <Link 
            key={item.path}
            to={item.path} 
            className={`flex flex-col items-center gap-xs transition-colors ${
              location.pathname === item.path ? 'text-primary' : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: location.pathname === item.path ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
            <span className="font-label-bold text-[10px]">{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Custom Logout Confirmation Modal */}
      {showLogoutModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setShowLogoutModal(false)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)' }}
          ></div>
          
          {/* Modal Content */}
          <div 
            className="relative bg-white rounded-2xl p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
            style={{ position: 'relative', width: '380px', maxWidth: '90%', display: 'block', backgroundColor: '#ffffff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #f3f4f6', boxSizing: 'border-box' }}
          >
            <div className="flex items-center gap-3 mb-3" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0" style={{ width: '2.5rem', height: '2.5rem', borderRadius: '9999px', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined text-red-600">warning</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900" style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', margin: 0 }}>Exit Application</h3>
            </div>
            
            <p className="text-sm text-gray-500 mb-6 leading-relaxed" style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem', lineHeight: 1.625, margin: '0.5rem 0' }}>
              Do you want to logout exit from this application?
            </p>
            
            <div className="flex items-center justify-end gap-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition cursor-pointer border border-gray-200 bg-white outline-none"
                style={{ cursor: 'pointer', outline: 'none' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition cursor-pointer border-0 shadow-sm hover:shadow outline-none"
                style={{ cursor: 'pointer', outline: 'none' }}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
