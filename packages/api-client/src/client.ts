import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { APIClientConfig, RequestOptions } from './types';

/**
 * Create and configure an Axios client instance
 */
export function createAPIClient(config: APIClientConfig): AxiosInstance {
  const {
    baseURL,
    timeout = 30000,
    headers = {},
    withCredentials = false,
  } = config;

  const client = axios.create({
    baseURL,
    timeout,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    withCredentials,
  });

  return client;
}

/**
 * Default API client instance
 * Can be configured by calling `configureAPIClient`
 */
let defaultClient: AxiosInstance | null = null;

/**
 * Configure the default API client
 */
export function configureAPIClient(config: APIClientConfig): AxiosInstance {
  defaultClient = createAPIClient(config);
  return defaultClient;
}

/**
 * Get the default API client instance
 */
export function getAPIClient(): AxiosInstance {
  if (!defaultClient) {
    throw new Error(
      'API client not configured. Call configureAPIClient() first.'
    );
  }
  return defaultClient;
}

/**
 * Check if API client is configured
 */
export function isAPIClientConfigured(): boolean {
  return defaultClient !== null;
}

/**
 * Reset the default API client
 */
export function resetAPIClient(): void {
  defaultClient = null;
}

/**
 * Helper function to make GET requests
 */
export async function get<T = any>(
  url: string,
  config?: RequestOptions
): Promise<T> {
  const client = getAPIClient();
  const response = await client.get<T>(url, config);
  return response.data;
}

/**
 * Helper function to make POST requests
 */
export async function post<T = any>(
  url: string,
  data?: any,
  config?: RequestOptions
): Promise<T> {
  const client = getAPIClient();
  const response = await client.post<T>(url, data, config);
  return response.data;
}

/**
 * Helper function to make PUT requests
 */
export async function put<T = any>(
  url: string,
  data?: any,
  config?: RequestOptions
): Promise<T> {
  const client = getAPIClient();
  const response = await client.put<T>(url, data, config);
  return response.data;
}

/**
 * Helper function to make PATCH requests
 */
export async function patch<T = any>(
  url: string,
  data?: any,
  config?: RequestOptions
): Promise<T> {
  const client = getAPIClient();
  const response = await client.patch<T>(url, data, config);
  return response.data;
}

/**
 * Helper function to make DELETE requests
 */
export async function del<T = any>(
  url: string,
  config?: RequestOptions
): Promise<T> {
  const client = getAPIClient();
  const response = await client.delete<T>(url, config);
  return response.data;
}
