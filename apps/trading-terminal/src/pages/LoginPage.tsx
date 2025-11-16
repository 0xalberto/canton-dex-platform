import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'
import { authService } from '@services/authService'
import { LoginFormData } from '@types/index'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuthData = useAuthStore((state) => state.setAuthData)
  const setLoading = useAuthStore((state) => state.setLoading)
  const setError = useAuthStore((state) => state.setError)

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const authResponse = await authService.login(formData)
      setAuthData(authResponse)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card">
          <h1 className="text-3xl font-bold mb-6 text-center">CantonDEX</h1>
          <h2 className="text-xl font-semibold mb-6 text-center">Trading Terminal</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-base"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-base"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <label htmlFor="remember" className="ml-2 text-sm">
                Remember me
              </label>
            </div>

            <button type="submit" className="btn-primary w-full">
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p>
              Don't have an account?{' '}
              <a href="/register" className="text-primary-500 hover:text-primary-400">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
