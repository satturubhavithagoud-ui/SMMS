import { Link, useLocation } from 'react-router-dom';

export default function ClientLayout({ children }) {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { name: 'Schedule', icon: 'calendar_month', path: '/scheduler' },
    { name: 'Analytics', icon: 'analytics', path: '/analytics' },
    { name: 'Settings', icon: 'settings', path: '/settings' },
  ];

  return (
    <div className="bg-background font-body-md text-on-surface antialiased min-h-screen">
      {/* Top AppBar (Mobile context) */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-surface border-b border-surface-variant h-[64px] flex justify-between items-center px-lg md:ml-[240px]">
        <div className="flex items-center gap-md">
          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer p-sm rounded-full hover:bg-surface-container md:hidden">menu</span>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">SocialManager Pro</h1>
        </div>
        <div className="flex items-center gap-md">
          <div className="w-8 h-8 rounded-full bg-primary-fixed-dim flex items-center justify-center overflow-hidden">
            <img 
              alt="User profile" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida/ADBb0ujLIo2tXXOSmsvcPByJg4RmDdJCtaUS19xFpDcM1D4WOF_6fK-e8zAAdFwr5OQa3PBM9aItSY9ZihrjEaTVHYf6H1H9Fw22UqTZvTIrpo5BWGiwuoPg_y0G7bxp5CXAEwCy9k9_0exfDPZUOtFuBVcyB4awS2IaSxQYNwMJUVuP58AGaCGvewf0GhQ2ejmDOAZQi8JXHln78s3kRuLLi14nKKbRPC6qvyf_IIlE131rW_KrgQjdSi1bDxOGYTKHG12YjfTreIisozA" 
            />
          </div>
        </div>
      </header>

      {/* Desktop Sidebar (Optional, but good for consistency) */}
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
      <main className="pt-[80px] pb-[100px] px-md md:ml-[240px]">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
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
    </div>
  );
}
