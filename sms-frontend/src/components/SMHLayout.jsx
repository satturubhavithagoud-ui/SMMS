import { Link, useLocation } from 'react-router-dom';

export default function SMHLayout({ children }) {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/smh-dashboard', section: 'Workspace' },
    { name: 'Clients', icon: 'group', path: '/smh-clients', section: 'Workspace' },
    { name: 'Content queue', icon: 'schedule', path: '/smh-content-queue', section: 'Workspace' },
    { name: 'Schedule', icon: 'calendar_month', path: '/smh-scheduler', section: 'Workspace' },
    { name: 'Analytics', icon: 'analytics', path: '/smh-analytics', section: 'Tools' },
    { name: 'AI Caption Studio', icon: 'auto_awesome', path: '/smh-ai-studio', section: 'Tools' },
    { name: 'Settings', icon: 'settings', path: '/smh-settings', section: 'Admin' },
  ];

  return (
    <div className="bg-background font-body-md text-on-surface antialiased min-h-screen">
      {/* Sidebar */}
      <aside className="w-[240px] h-full fixed left-0 top-0 bg-primary z-50 flex flex-col py-xl border-r border-outline-variant/10">
        <div className="px-lg mb-lg flex items-center gap-sm">
          <div className="w-8 h-8 rounded-lg bg-on-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[20px]">dashboard</span>
          </div>
          <h1 className="text-on-primary font-headline-md tracking-tight">SocialManager Pro</h1>
        </div>
        
        <nav className="flex-1 space-y-md overflow-y-auto px-md">
          {['Workspace', 'Tools', 'Admin'].map(section => (
            <div key={section} className="py-2">
              <p className="px-lg mb-2 text-on-primary-container font-label-bold opacity-50 uppercase tracking-widest text-[10px]">{section}</p>
              <ul className="space-y-1">
                {navItems.filter(item => item.section === section).map(item => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-md px-lg py-3 rounded-xl transition-colors duration-200 ${
                        location.pathname === item.path
                          ? 'bg-white/10 text-on-primary font-bold'
                          : 'text-on-primary/70 hover:text-on-primary hover:bg-white/5'
                      }`}
                    >
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: location.pathname === item.path ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
                      <span className="font-label-bold">{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Profile Meta */}
        <div className="mt-auto px-lg pt-lg border-t border-on-primary/10 flex items-center gap-md">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary text-xs font-bold">SR</div>
          <div>
            <p className="text-on-primary font-label-bold text-[12px]">Sarah Rogers</p>
            <div className="flex items-center gap-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
              <span className="text-on-primary-container text-[10px]">Online</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-[240px] min-h-screen">
        <header className="fixed top-0 right-0 w-[calc(100%-240px)] z-40 bg-surface h-[80px] px-xl flex items-center justify-between border-b border-surface-variant">
          <div className="flex-1 max-w-2xl">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">search</span>
              <input
                className="w-full bg-surface-container-low border-none rounded-xl pl-[48px] pr-lg py-md text-body-md focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline"
                placeholder="Search clients, posts, platforms..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-xl pl-xl">
            <button className="relative p-sm hover:bg-surface-container-high rounded-full transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF914D] rounded-full border-2 border-surface"></span>
            </button>
            <div className="flex items-center gap-md cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold group-hover:ring-4 group-hover:ring-primary/10 transition-all">SR</div>
              <span className="material-symbols-outlined text-outline">expand_more</span>
            </div>
          </div>
        </header>
        <div className="pt-[112px] px-xl pb-xl">
          {children}
        </div>
      </main>
    </div>
  );
}
