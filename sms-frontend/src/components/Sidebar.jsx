import { NavLink } from 'react-router-dom';

const navItems = [
  { name: 'Dashboard', icon: 'dashboard', path: '/dashboard', section: 'Workspace' },
  { name: 'Clients', icon: 'group', path: '/clients', section: 'Workspace' },
  { name: 'Content Queue', icon: 'auto_stories', path: '/content-queue', section: 'Workspace' },
  { name: 'Schedule', icon: 'calendar_month', path: '/scheduler', section: 'Workspace' },
  { name: 'Analytics', icon: 'analytics', path: '/analytics', section: 'Tools' },
  { name: 'AI Studio', icon: 'auto_awesome', path: '/ai-studio', section: 'Tools' },
  { name: 'Settings', icon: 'settings', path: '/settings', section: 'Admin' },
];

export default function Sidebar() {
  return (
    <aside className="w-[240px] h-full fixed left-0 top-0 bg-primary border-r border-outline-variant/10 flex flex-col py-xl z-50 overflow-y-auto">
      {/* Logo Section */}
      <div className="px-lg mb-xl flex items-center gap-sm">
        <span className="text-headline-md font-headline-xl font-bold text-on-primary">SMH</span>
        <span className="bg-tertiary-fixed text-on-tertiary-fixed text-[10px] px-sm py-xs rounded font-bold tracking-wider uppercase">Handler</span>
      </div>

      {/* Profile Section */}
      <div className="px-lg mb-xl flex items-center gap-md">
        <div className="w-10 h-10 rounded-full bg-primary-fixed-dim flex items-center justify-center text-primary font-bold">
          SR
        </div>
        <div className="overflow-hidden">
          <p className="font-label-bold text-label-bold text-on-primary truncate">SocialManager Pro</p>
          <p className="text-[10px] text-on-primary/60 uppercase tracking-tight">Agency Account</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-unit">
        {navItems.map((item, index) => {
          const showSection = index === 0 || item.section !== navItems[index - 1].section;
          return (
            <div key={item.path}>
              {showSection && (
                <div className="px-lg py-xs mt-lg first:mt-0 text-[10px] font-bold text-on-primary/40 uppercase tracking-widest">
                  {item.section}
                </div>
              )}
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-md px-lg py-md transition-colors duration-200 ${
                    isActive
                      ? 'bg-on-primary/10 text-on-primary border-l-4 border-inverse-primary'
                      : 'text-on-primary/70 hover:text-on-primary hover:bg-on-primary/5'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="font-body-md text-body-md">{item.name}</span>
              </NavLink>
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="mt-auto px-lg pt-md border-t border-on-primary/10">
        <div className="flex items-center gap-sm">
          <div className="w-2 h-2 rounded-full bg-teal-400"></div>
          <span className="text-[11px] text-on-primary/80">Online</span>
        </div>
      </div>
    </aside>
  );
}
