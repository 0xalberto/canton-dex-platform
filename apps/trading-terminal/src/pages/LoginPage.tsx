import { useNavigate } from 'react-router-dom';
import { WalletConnect } from '../components/auth/WalletConnect';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

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

        {/* Canton Wallet Connect */}
        <WalletConnect />

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
