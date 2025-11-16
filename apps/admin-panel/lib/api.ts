import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { ApiResponse, PaginatedResponse } from '@/types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Get token from localStorage or cookie
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('authToken');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          if (typeof window !== 'undefined') {
            localStorage.removeItem('authToken');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<T>(url, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<T>(url, data, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<T>(url, data, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch<T>(url, data, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<T>(url, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: any): ApiResponse {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      return {
        success: false,
        error: axiosError.response?.data?.message || axiosError.message,
        message: axiosError.response?.data?.error || 'An error occurred',
      };
    }
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

// Export singleton instance
export const api = new ApiClient();

// Utility functions for common API calls
export const apiUtils = {
  // Users
  getUsers: (params?: { page?: number; pageSize?: number; search?: string }) =>
    api.get<PaginatedResponse<any>>('/api/admin/users', { params }),

  getUserById: (id: string) =>
    api.get(`/api/admin/users/${id}`),

  updateUser: (id: string, data: any) =>
    api.put(`/api/admin/users/${id}`, data),

  deleteUser: (id: string) =>
    api.delete(`/api/admin/users/${id}`),

  // Trading Pairs
  getTradingPairs: () =>
    api.get('/api/admin/trading-pairs'),

  createTradingPair: (data: any) =>
    api.post('/api/admin/trading-pairs', data),

  updateTradingPair: (id: string, data: any) =>
    api.put(`/api/admin/trading-pairs/${id}`, data),

  deleteTradingPair: (id: string) =>
    api.delete(`/api/admin/trading-pairs/${id}`),

  // Fees
  getFeeConfigs: () =>
    api.get('/api/admin/fees'),

  createFeeConfig: (data: any) =>
    api.post('/api/admin/fees', data),

  updateFeeConfig: (id: string, data: any) =>
    api.put(`/api/admin/fees/${id}`, data),

  // System Health
  getSystemHealth: () =>
    api.get('/api/admin/system-health'),

  // Canton Management
  getCantonDomains: () =>
    api.get('/api/admin/canton/domains'),

  getCantonParticipants: () =>
    api.get('/api/admin/canton/participants'),
};
