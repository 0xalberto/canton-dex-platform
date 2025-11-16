import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'
import { authService } from '@services/authService'

export default function RegistrationPage() {
  const navigate = useNavigate()
  const setAuthData = useAuthStore((state) => state.setAuthData)
  const setLoading = useAuthStore((state) => state.setLoading)
  const setError = useAuthStore((state) => state.setError)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    username: '',
    acceptTerms: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    setError(null)

    try {
      const authResponse = await authService.register(formData)
      setAuthData(authResponse)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card">
          <h1 className="text-3xl font-bold mb-2 text-center">CantonDEX</h1>
          <h2 className="text-xl font-semibold mb-6 text-center">Create Account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input-base"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="input-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-base"
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
                required
              />
              {errors.password && <p className="text-danger-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-base"
                required
              />
              {errors.confirmPassword && (
                <p className="text-danger-500 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="terms"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <label htmlFor="terms" className="ml-2 text-sm">
                I accept the Terms of Service
              </label>
            </div>

            <button type="submit" className="btn-primary w-full">
              Create Account
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p>
              Already have an account?{' '}
              <a href="/login" className="text-primary-500 hover:text-primary-400">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
