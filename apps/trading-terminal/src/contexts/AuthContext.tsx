import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser';

interface User {
  partyId: string;
  displayName: string;
  email?: string;
  authMethod: 'passkey' | 'email' | 'token' | 'google';
  token: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  registerPasskey: (email: string, displayName: string) => Promise<void>;
  loginWithPasskey: () => Promise<void>;
  registerWithEmail: (email: string, password: string, name: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithToken: (partyId: string, token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:4000/auth';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('canton_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('canton_user');
      }
    }
  }, []);

  const registerPasskey = async (email: string, displayName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Get registration options from server
      const optionsResponse = await fetch(`${API_BASE_URL}/register/passkey/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, displayName }),
      });

      if (!optionsResponse.ok) {
        throw new Error('Failed to get registration options');
      }

      const options = await optionsResponse.json();

      // Start WebAuthn registration
      const credential = await startRegistration(options);

      // Verify registration with server
      const verifyResponse = await fetch(`${API_BASE_URL}/register/passkey/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, credential }),
      });

      if (!verifyResponse.ok) {
        throw new Error('Failed to verify registration');
      }

      const userData = await verifyResponse.json();
      setUser(userData.user);
      localStorage.setItem('canton_user', JSON.stringify(userData.user));
    } catch (err: any) {
      setError(err.message || 'Passkey registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPasskey = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get authentication options
      const optionsResponse = await fetch(`${API_BASE_URL}/login/passkey/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!optionsResponse.ok) {
        throw new Error('Failed to get authentication options');
      }

      const options = await optionsResponse.json();

      // Start WebAuthn authentication
      const credential = await startAuthentication(options);

      // Verify authentication with server
      const verifyResponse = await fetch(`${API_BASE_URL}/login/passkey/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });

      if (!verifyResponse.ok) {
        throw new Error('Failed to verify authentication');
      }

      const userData = await verifyResponse.json();
      setUser(userData.user);
      localStorage.setItem('canton_user', JSON.stringify(userData.user));
    } catch (err: any) {
      setError(err.message || 'Passkey login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/register/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      const userData = await response.json();
      setUser(userData.user);
      localStorage.setItem('canton_user', JSON.stringify(userData.user));
    } catch (err: any) {
      setError(err.message || 'Email registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/login/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const userData = await response.json();
      setUser(userData.user);
      localStorage.setItem('canton_user', JSON.stringify(userData.user));
    } catch (err: any) {
      setError(err.message || 'Email login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Redirect to Google OAuth
      window.location.href = `${API_BASE_URL}/login/google`;
    } catch (err: any) {
      setError(err.message || 'Google login failed');
      setIsLoading(false);
      throw err;
    }
  };

  const loginWithToken = async (partyId: string, token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const userData: User = {
        partyId,
        displayName: partyId,
        authMethod: 'token',
        token,
      };
      setUser(userData);
      localStorage.setItem('canton_user', JSON.stringify(userData));
    } catch (err: any) {
      setError(err.message || 'Token login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('canton_user');
  };

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
