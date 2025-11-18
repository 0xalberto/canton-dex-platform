import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import {
  ApiResponse,
  PaginatedResponse,
  SystemHealth,
  ServiceHealth,
  HealthStatus,
  CantonParticipant,
  ParticipantStatus,
  CantonDomain,
  DomainStatus,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const SETTLEMENT_API_URL =
  process.env.NEXT_PUBLIC_SETTLEMENT_API_URL || 'http://localhost:8003';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
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

const normalizeHealthStatus = (value?: string): HealthStatus => {
  switch ((value || '').toLowerCase()) {
    case 'healthy':
    case 'connected':
    case 'operational':
      return HealthStatus.HEALTHY;
    case 'degraded':
    case 'warning':
      return HealthStatus.DEGRADED;
    case 'down':
    case 'error':
    case 'disconnected':
      return HealthStatus.DOWN;
    default:
      return HealthStatus.UNKNOWN;
  }
};

const buildServiceList = (services: Record<string, any> = {}): ServiceHealth[] => {
  return Object.entries(services).map(([name, details]) => {
    if (typeof details === 'string') {
      return {
        name,
        status: normalizeHealthStatus(details),
        uptime: 99.99,
        details: { status: details },
      };
    }

    return {
      name,
      status: normalizeHealthStatus(details?.status || details?.state),
      uptime: details?.uptime ?? 99.99,
      responseTime: details?.response_time,
      details,
    };
  });
};

const fetchExternalJSON = async <T>(url: string): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return {
        success: false,
        error: `Request failed with status ${response.status}`,
      };
    }
    const data = (await response.json()) as T;
    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to reach external service',
    };
  }
};

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
  getSystemHealth: async (): Promise<ApiResponse<SystemHealth>> => {
    const [healthResponse, statusResponse] = await Promise.all([
      api.get<any>('/health'),
      api.get<any>('/status'),
    ]);

    if (!healthResponse.success || !healthResponse.data) {
      return {
        success: false,
        error: healthResponse.error || 'Unable to retrieve health summary',
      };
    }

    const summary = healthResponse.data;
    const services: ServiceHealth[] = [];

    if (statusResponse.success && statusResponse.data) {
      services.push(...buildServiceList(statusResponse.data));
    }

    if (summary.services) {
      services.push(...buildServiceList(summary.services));
    }

    const systemHealth: SystemHealth = {
      status: normalizeHealthStatus(summary.status),
      services,
      lastChecked: new Date().toISOString(),
    };

    return { success: true, data: systemHealth };
  },

  // Canton Management
  getCantonParticipants: async (): Promise<ApiResponse<CantonParticipant[]>> => {
    const response = await api.get<{ parties: { party: string }[] }>('/canton/parties');
    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'Unable to fetch participant list',
      };
    }

    const participants: CantonParticipant[] = (response.data.parties || []).map(
      ({ party }) => ({
        id: party,
        name: party,
        status: ParticipantStatus.ONLINE,
        domains: [],
        ledgerId: party,
        createdAt: new Date().toISOString(),
      })
    );

    return { success: true, data: participants };
  },

  getCantonDomains: async (): Promise<ApiResponse<CantonDomain[]>> => {
    const response = await fetchExternalJSON<{ settlements?: any[] }>(
      `${SETTLEMENT_API_URL}/settlements`
    );

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'Unable to fetch settlement history',
      };
    }

    const settlements = response.data.settlements || [];
    const domains: CantonDomain[] = settlements.map((settlement, index) => ({
      id: settlement.settlement_id || `domain-${index}`,
      name: `${settlement.symbol || 'Asset'} Domain`,
      status: DomainStatus.ACTIVE,
      participantId: settlement.buyer_party || 'unknown',
      connectedParticipants: 2,
      createdAt: settlement.executed_at || new Date().toISOString(),
      lastSyncAt: settlement.executed_at || new Date().toISOString(),
    }));

    if (!domains.length) {
      domains.push({
        id: 'default-domain',
        name: 'Settlement Domain',
        status: DomainStatus.ACTIVE,
        participantId: 'SecuritiesIssuer::participant',
        connectedParticipants: 2,
        createdAt: new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
      });
    }

    return { success: true, data: domains };
  },
};
