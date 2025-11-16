import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { APIClientConfig, APIError } from './types';

/**
 * Setup request and response interceptors for the API client
 */
export function setupInterceptors(
  client: AxiosInstance,
  config: APIClientConfig
): void {
  // Request interceptor - Add authentication token
  client.interceptors.request.use(
    async (requestConfig: InternalAxiosRequestConfig) => {
      // Get token from config function
      if (config.getToken) {
        const token = await config.getToken();
        if (token && requestConfig.headers) {
          requestConfig.headers.Authorization = `Bearer ${token}`;
        }
      }

      return requestConfig;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - Handle errors
  client.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error: AxiosError) => {
      const apiError: APIError = {
        message: 'An error occurred',
        statusCode: error.response?.status,
      };

      if (error.response) {
        // Server responded with error
        const data = error.response.data as any;
        apiError.message = data?.message || error.message;
        apiError.code = data?.code;
        apiError.errors = data?.errors;

        // Handle 401 Unauthorized
        if (error.response.status === 401 && config.onUnauthorized) {
          await config.onUnauthorized();
        }

        // Call custom error handler
        if (config.onError) {
          config.onError(apiError);
        }
      } else if (error.request) {
        // Request was made but no response received
        apiError.message = 'No response from server';
      } else {
        // Error in request setup
        apiError.message = error.message;
      }

      return Promise.reject(apiError);
    }
  );
}

/**
 * Create a request retry interceptor
 */
export function createRetryInterceptor(
  client: AxiosInstance,
  maxRetries: number = 3,
  retryDelay: number = 1000
): void {
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as any;

      if (!config || !config.retry) {
        return Promise.reject(error);
      }

      config.__retryCount = config.__retryCount || 0;

      if (config.__retryCount >= maxRetries) {
        return Promise.reject(error);
      }

      config.__retryCount += 1;

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelay));

      return client.request(config);
    }
  );
}

/**
 * Create a request logging interceptor for debugging
 */
export function createLoggingInterceptor(client: AxiosInstance): void {
  client.interceptors.request.use(
    (config) => {
      console.log('[API Request]', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
        params: config.params,
      });
      return config;
    },
    (error) => {
      console.error('[API Request Error]', error);
      return Promise.reject(error);
    }
  );

  client.interceptors.response.use(
    (response) => {
      console.log('[API Response]', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
      return response;
    },
    (error: AxiosError) => {
      console.error('[API Response Error]', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
        data: error.response?.data,
      });
      return Promise.reject(error);
    }
  );
}

/**
 * Create a cache interceptor using browser cache
 */
export function createCacheInterceptor(
  client: AxiosInstance,
  cacheDuration: number = 5 * 60 * 1000 // 5 minutes
): void {
  const cache = new Map<string, { data: any; timestamp: number }>();

  client.interceptors.request.use(
    (config) => {
      // Only cache GET requests
      if (config.method?.toLowerCase() !== 'get') {
        return config;
      }

      const cacheKey = `${config.url}?${JSON.stringify(config.params || {})}`;
      const cached = cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < cacheDuration) {
        // Return cached response
        return Promise.reject({
          config,
          response: {
            data: cached.data,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          },
          cached: true,
        });
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => {
      // Cache successful GET responses
      if (response.config.method?.toLowerCase() === 'get') {
        const cacheKey = `${response.config.url}?${JSON.stringify(
          response.config.params || {}
        )}`;
        cache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now(),
        });
      }
      return response;
    },
    (error) => {
      // If it's a cached response, return it as success
      if (error.cached) {
        return Promise.resolve(error.response);
      }
      return Promise.reject(error);
    }
  );
}
