import { useState, useCallback, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  [key: string]: any;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface UseAuthReturn extends AuthState {
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

export interface UseAuthOptions {
  loginFn?: (credentials: any) => Promise<User>;
  logoutFn?: () => Promise<void>;
  getUserFn?: () => Promise<User | null>;
  storageKey?: string;
}

/**
 * Hook for managing authentication state
 *
 * @example
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth({
 *   loginFn: async (credentials) => {
 *     const response = await fetch('/api/auth/login', {
 *       method: 'POST',
 *       body: JSON.stringify(credentials)
 *     });
 *     return response.json();
 *   },
 *   logoutFn: async () => {
 *     await fetch('/api/auth/logout', { method: 'POST' });
 *   }
 * });
 *
 * // Login
 * await login({ email: 'user@example.com', password: 'password' });
 *
 * // Logout
 * await logout();
 * ```
 */
export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const {
    loginFn,
    logoutFn,
    getUserFn,
    storageKey = 'auth_user',
  } = options;

  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Load user from storage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        if (getUserFn) {
          const user = await getUserFn();
          if (user) {
            setState({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }
        }

        // Fallback to localStorage
        const storedUser = localStorage.getItem(storageKey);
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadUser();
  }, [getUserFn, storageKey]);

  const login = useCallback(
    async (credentials: any) => {
      try {
        if (!loginFn) {
          throw new Error('loginFn is required');
        }

        const user = await loginFn(credentials);
        localStorage.setItem(storageKey, JSON.stringify(user));
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    [loginFn, storageKey]
  );

  const logout = useCallback(async () => {
    try {
      if (logoutFn) {
        await logoutFn();
      }

      localStorage.removeItem(storageKey);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, [logoutFn, storageKey]);

  const updateUser = useCallback(
    (user: User) => {
      localStorage.setItem(storageKey, JSON.stringify(user));
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    },
    [storageKey]
  );

  return {
    ...state,
    login,
    logout,
    updateUser,
  };
}
