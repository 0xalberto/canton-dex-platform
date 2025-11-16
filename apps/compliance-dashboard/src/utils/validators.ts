/**
 * Validation utility functions
 */

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/
  return phoneRegex.test(phone)
}

export const isValidDate = (date: string): boolean => {
  const d = new Date(date)
  return d instanceof Date && !isNaN(d.getTime())
}

export const isPositiveNumber = (value: number): boolean => {
  return typeof value === 'number' && value > 0
}

export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max
}

export const required = (value: any): boolean | string => {
  if (value === null || value === undefined || value === '') {
    return 'This field is required'
  }
  return true
}

export const minLength = (min: number) => (value: string): boolean | string => {
  if (value.length < min) {
    return `Minimum length is ${min} characters`
  }
  return true
}

export const maxLength = (max: number) => (value: string): boolean | string => {
  if (value.length > max) {
    return `Maximum length is ${max} characters`
  }
  return true
}

export const email = (value: string): boolean | string => {
  if (!isValidEmail(value)) {
    return 'Invalid email address'
  }
  return true
}

export const password = (value: string): boolean | string => {
  if (!isValidPassword(value)) {
    return 'Password must be at least 8 characters with uppercase, lowercase, and number'
  }
  return true
}
