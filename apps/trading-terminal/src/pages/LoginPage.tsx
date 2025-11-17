import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      login({ id: '1', email, name: 'Demo User' }, 'demo-token');
      setLoading(false);
      navigate('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Animated Background Orbs */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      
      <div className="w-full max-w-md fade-in">
        {/* Logo & Title */}
        <div className="text-center mb-8 float">
          <div className="inline-block p-4 glass rounded-2xl mb-4 pulse-glow">
            <svg className="w-16 h-16 text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">CantonDEX</h1>
          <p className="text-gray-400">Privacy-First Institutional Trading</p>
        </div>

        {/* Login Form */}
        <div className="glass-card card-3d">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-modern"
                placeholder="demo@cantondex.io"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-modern"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" className="mr-2 rounded" />
                <span className="text-gray-400">Remember me</span>
              </label>
              <a href="#" className="text-primary-light hover:text-primary transition-colors">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner w-5 h-5 mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-primary-light hover:text-primary transition-colors font-semibold"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="text-center glass rounded-xl p-3">
            <div className="text-2xl mb-1">🔒</div>
            <p className="text-xs text-gray-400">Sub-Transaction Privacy</p>
          </div>
          <div className="text-center glass rounded-xl p-3">
            <div className="text-2xl mb-1">⚡</div>
            <p className="text-xs text-gray-400">Atomic Settlement</p>
          </div>
          <div className="text-center glass rounded-xl p-3">
            <div className="text-2xl mb-1">🏛️</div>
            <p className="text-xs text-gray-400">Institutional Grade</p>
          </div>
        </div>
      </div>
    </div>
  );
}
