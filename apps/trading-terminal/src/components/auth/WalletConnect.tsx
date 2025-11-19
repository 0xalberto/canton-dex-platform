import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './WalletConnect.css';

type TabType = 'passkey' | 'email' | 'token';

export const WalletConnect: React.FC = () => {
  const {
    user,
    isLoading,
    error,
    registerPasskey,
    loginWithPasskey,
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    loginWithToken,
    logout,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('passkey');
  const [isRegister, setIsRegister] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [partyId, setPartyId] = useState('');
  const [token, setToken] = useState('');

  if (user) {
    return (
      <div className="wallet-connected">
        <div className="user-info">
          <div className="user-avatar">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <div className="user-name">{user.displayName}</div>
            {user.email && <div className="user-email">{user.email}</div>}
            <div className="user-party-id">{user.partyId}</div>
            <div className="user-auth-method">
              {user.authMethod === 'passkey' && '🔐 Passkey'}
              {user.authMethod === 'email' && '📧 Email'}
              {user.authMethod === 'token' && '🔑 Token'}
              {user.authMethod === 'google' && '🌐 Google'}
            </div>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={logout}>
          Disconnect
        </button>
      </div>
    );
  }

  const handlePasskeyAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await registerPasskey(email, displayName);
      } else {
        await loginWithPasskey();
      }
    } catch (err) {
      console.error('Passkey auth error:', err);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await registerWithEmail(email, password, displayName);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err) {
      console.error('Email auth error:', err);
    }
  };

  const handleTokenAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithToken(partyId, token);
    } catch (err) {
      console.error('Token auth error:', err);
    }
  };

  return (
    <div className="wallet-connect-container">
      <div className="wallet-connect-header">
        <h2>Connect Participant Node</h2>
        <p className="subtitle">
          Authenticate with your Canton Party Identity using Passkey, Email, or Token
        </p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'passkey' ? 'active' : ''}`}
          onClick={() => setActiveTab('passkey')}
        >
          🔐 Passkey
        </button>
        <button
          className={`tab ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          📧 Email
        </button>
        <button
          className={`tab ${activeTab === 'token' ? 'active' : ''}`}
          onClick={() => setActiveTab('token')}
        >
          🔑 Token
        </button>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      <div className="tab-content">
        {activeTab === 'passkey' && (
          <form onSubmit={handlePasskeyAuth} className="auth-form">
            <div className="form-info">
              <strong>Recommended Method:</strong> Use Face ID, Touch ID, Windows Hello,
              or any FIDO2 hardware key for secure authentication.
            </div>
            
            {isRegister && (
              <>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your Name"
                    required
                  />
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Processing...' : isRegister ? 'Register Passkey' : 'Login with Passkey'}
            </button>

            <div className="toggle-mode">
              {isRegister ? 'Already have a passkey?' : "Don't have a passkey?"}{' '}
              <button
                type="button"
                className="link-button"
                onClick={() => setIsRegister(!isRegister)}
              >
                {isRegister ? 'Login' : 'Register'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'email' && (
          <form onSubmit={handleEmailAuth} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {isRegister && (
              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  required
                />
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Processing...' : isRegister ? 'Register' : 'Login'}
            </button>

            <div className="divider">or</div>

            <button
              type="button"
              className="btn btn-google"
              onClick={loginWithGoogle}
              disabled={isLoading}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.96H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.04l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.96L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Continue with Google
            </button>

            <div className="toggle-mode">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                className="link-button"
                onClick={() => setIsRegister(!isRegister)}
              >
                {isRegister ? 'Login' : 'Register'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'token' && (
          <form onSubmit={handleTokenAuth} className="auth-form">
            <div className="form-info">
              <strong>For Development & Testing:</strong> Use this method with
              Canton DevNet tokens.
            </div>

            <div className="form-group">
              <label>Party ID</label>
              <input
                type="text"
                value={partyId}
                onChange={(e) => setPartyId(e.target.value)}
                placeholder="participant1::party_id"
                required
              />
            </div>

            <div className="form-group">
              <label>JWT Token</label>
              <textarea
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                rows={4}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Login with Token'}
            </button>
          </form>
        )}
      </div>

      <div className="wallet-connect-footer">
        <p>
          <strong>Note:</strong> Canton Network is NOT Ethereum-based. MetaMask
          and WalletConnect are not compatible.
        </p>
      </div>
    </div>
  );
};
