import { User, LoginRequest, LoginResponse } from '@/types';
import { api } from './api';

export class AuthService {
  private static TOKEN_KEY = 'authToken';
  private static USER_KEY = 'authUser';

  static async login(credentials: LoginRequest): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.post<LoginResponse>('/api/auth/login', credentials);

      if (response.success && response.data) {
        this.setToken(response.data.token);
        this.setUser(response.data.user);
        return { success: true };
      }

      return {
        success: false,
        error: response.error || 'Login failed',
      };
    } catch (error) {
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  static logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      window.location.href = '/login';
    }
  }

  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  static getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(this.USER_KEY);
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  static setUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  static hasRole(roles: string[]): boolean {
    const user = this.getUser();
    if (!user) return false;
    return roles.includes(user.role);
  }

  static async verifyToken(): Promise<boolean> {
    try {
      const response = await api.get('/api/auth/verify');
      return response.success;
    } catch {
      return false;
    }
  }
}
