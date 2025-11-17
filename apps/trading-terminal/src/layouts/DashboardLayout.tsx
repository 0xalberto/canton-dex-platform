import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/portfolio', icon: '💼', label: 'Portfolio' },
    { path: '/orders', icon: '📝', label: 'Orders' },
    { path: '/market/BTC-USDT', icon: '📈', label: 'Markets' },
    { path: '/settings', icon: '⚙️', label: 'Settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="sidebar w-64 fixed h-full flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-700/30">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-xl pulse-glow">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold gradient-text">CantonDEX</h2>
              <p className="text-xs text-gray-400">Trading Terminal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
                            (item.path.includes('market') && location.pathname.includes('market'));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary/20 to-secondary/20 text-white border border-primary/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-700/30">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-lg">👤</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{user?.name || 'Demo User'}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email || 'demo@cantondex.io'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full btn bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Top Bar */}
        <header className="navbar h-16 px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="text-gray-400">Current Price:</span>
              <span className="ml-2 font-bold text-green-400">$45,234.50</span>
              <span className="ml-2 text-green-400 text-xs">+2.4%</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Network Status */}
            <div className="flex items-center space-x-2 glass px-3 py-2 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Canton Network</span>
            </div>

            {/* Notifications */}
            <button className="relative p-2 glass rounded-lg hover:bg-white/10 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
