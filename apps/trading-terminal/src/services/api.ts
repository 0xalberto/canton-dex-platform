import axios, { AxiosInstance, AxiosError } from 'axios'
import { useAuthStore } from '@store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const authStore = useAuthStore.getState()
        if (authStore.accessToken) {
          config.headers.Authorization = `Bearer ${authStore.accessToken}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const authStore = useAuthStore.getState()

        // Handle 401 Unauthorized - refresh token or logout
        if (error.response?.status === 401) {
          authStore.clearAuth()
          window.location.href = '/login'
        }

        // Handle 403 Forbidden
        if (error.response?.status === 403) {
          console.error('Access forbidden:', error.message)
        }

        return Promise.reject(error)
      }
    )
  }

  getClient(): AxiosInstance {
    return this.client
  }
}

export const apiClient = new ApiClient()
export default apiClient.getClient()
