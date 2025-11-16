import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'
import { authService } from '@services/authService'

export default function DashboardLayout() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuth()
      navigate('/login')
    }
  }

  const navigationItems = [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Market', href: '/market/BTC%2FUSD', icon: '📈' },
    { label: 'Portfolio', href: '/portfolio', icon: '💼' },
    { label: 'Orders', href: '/orders', icon: '📋' },
    { label: 'Settings', href: '/settings', icon: '⚙️' },
  ]

  return (
    <div className="flex h-screen bg-dark-900">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-dark-800 border-r border-dark-700 transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-dark-700">
          <h1 className="text-xl font-bold text-primary-500">CantonDEX</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-dark-700 transition-colors"
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </a>
          ))}
        </nav>

        <div className="p-4 border-t border-dark-700 space-y-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center px-4 py-2 rounded-lg hover:bg-dark-700 transition-colors text-xs"
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-dark-800 border-b border-dark-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Professional Trading Terminal</h2>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.username}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-danger-600 rounded-lg text-sm font-medium hover:bg-danger-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
