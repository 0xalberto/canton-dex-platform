import { useState } from 'react'
import { useAuthStore } from '@store/authStore'

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user)
  const [settings, setSettings] = useState({
    darkMode: true,
    enableNotifications: true,
    emailAlerts: true,
    twoFactorAuth: false,
  })

  const handleToggle = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Account Information</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <p className="text-gray-300">{user?.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <p className="text-gray-300">{user?.username}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">KYC Status</label>
            <p className="text-gray-300 capitalize">{user?.kycStatus}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Preferences</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Dark Mode</label>
            <input
              type="checkbox"
              checked={settings.darkMode}
              onChange={() => handleToggle('darkMode')}
              className="w-4 h-4"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Enable Notifications</label>
            <input
              type="checkbox"
              checked={settings.enableNotifications}
              onChange={() => handleToggle('enableNotifications')}
              className="w-4 h-4"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Email Alerts</label>
            <input
              type="checkbox"
              checked={settings.emailAlerts}
              onChange={() => handleToggle('emailAlerts')}
              className="w-4 h-4"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Two-Factor Authentication</label>
            <input
              type="checkbox"
              checked={settings.twoFactorAuth}
              onChange={() => handleToggle('twoFactorAuth')}
              className="w-4 h-4"
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Security</h2>
        </div>
        <div className="space-y-4">
          <button className="btn-secondary">Change Password</button>
          <button className="btn-secondary">View API Keys</button>
          <button className="btn-secondary">Active Sessions</button>
        </div>
      </div>
    </div>
  )
}
