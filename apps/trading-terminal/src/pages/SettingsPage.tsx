export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your account preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card">
          <h3 className="text-lg font-semibold mb-4">Party Identity Management</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Full Name</label>
              <input type="text" className="input-modern" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <input type="email" className="input-modern" placeholder="john@cantondex.io" />
            </div>
            <button className="btn btn-primary w-full">Save Changes</button>
          </div>
        </div>

        <div className="glass-card">
          <h3 className="text-lg font-semibold mb-4">Security</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Auth</p>
                <p className="text-sm text-gray-400">Enable 2FA</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
            <button className="btn glass w-full">Change Password</button>
          </div>
        </div>

        <div className="glass-card">
          <h3 className="text-lg font-semibold mb-4">Notifications</h3>
          <div className="space-y-4">
            {['Trade Alerts', 'Price Alerts', 'News Updates'].map((item) => (
              <div key={item} className="flex items-center justify-between">
                <p className="text-sm">{item}</p>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
