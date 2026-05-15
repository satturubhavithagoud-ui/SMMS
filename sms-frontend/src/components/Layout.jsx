import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const titleMap = {
  '/dashboard': 'Dashboard',
  '/clients': 'Clients',
  '/scheduler': 'Schedule',
  '/analytics': 'Analytics',
  '/ai-studio': 'AI Studio',
  '/settings': 'Settings',
};

export default function Layout() {
  const location = useLocation();
  const title = titleMap[location.pathname] || 'Dashboard';

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-[240px]">
        <Header title={title} />
        <main className="pt-[64px] min-h-[calc(100vh-64px)] overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
