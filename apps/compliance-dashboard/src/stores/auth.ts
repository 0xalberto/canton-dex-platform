import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, UserRole } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isAuthenticated = ref(false)

  // Getters
  const currentUser = computed(() => user.value)
  const userRole = computed(() => user.value?.role)
  const hasRole = (role: UserRole) => computed(() => user.value?.role === role)

  // Actions
  const login = async (email: string, password: string) => {
    try {
      // TODO: Implement actual API call
      console.log('Logging in...', email, password)

      // Mock user data
      user.value = {
        id: '1',
        email,
        name: 'John Doe',
        role: 'admin' as UserRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      token.value = 'mock-token'
      isAuthenticated.value = true

      return { success: true }
    } catch (error) {
      console.error('Login failed:', error)
      return { success: false, error: 'Login failed' }
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    isAuthenticated.value = false
  }

  const checkAuth = async () => {
    try {
      // TODO: Implement token validation
      const storedToken = localStorage.getItem('auth_token')
      if (storedToken) {
        token.value = storedToken
        // Fetch user data
        // user.value = await fetchCurrentUser()
        isAuthenticated.value = true
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      logout()
    }
  }

  return {
    // State
    user,
    token,
    isAuthenticated,

    // Getters
    currentUser,
    userRole,
    hasRole,

    // Actions
    login,
    logout,
    checkAuth
  }
})
