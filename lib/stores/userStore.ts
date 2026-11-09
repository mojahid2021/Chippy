import { create } from "zustand"
import { AUTH_COOKIE_NAME, getClientCookie, setClientCookie, deleteClientCookie } from "@/lib/cookie-utils"

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  name?: string
  role?: string
  phone?: string
  isActive?: boolean
  isEmailVerified?: boolean
  emailVerified?: boolean
  createdAt?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>
  register: (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
    role?: string
  }) => Promise<boolean>
  logout: () => void
  initializeAuth: () => void
  getSavedEmail: () => string | null
  validateProfile: () => Promise<boolean>
}

function normalizeUser(userData: Record<string, unknown>): User {
  const firstName = (userData.firstName as string) || ''
  const lastName = (userData.lastName as string) || ''
  const name = (userData.name as string) || `${firstName} ${lastName}`.trim()
  const isEmailVerified = typeof userData.isEmailVerified === 'boolean' 
    ? userData.isEmailVerified 
    : typeof userData.emailVerified === 'boolean'
    ? userData.emailVerified
    : false

  return {
    id: (userData.id as string) || '',
    email: (userData.email as string) || '',
    firstName,
    lastName,
    name,
    role: (userData.role as string) || 'USER',
    phone: (userData.phone as string) || undefined,
    isActive: typeof userData.isActive === 'boolean' ? userData.isActive : true,
    isEmailVerified,
    emailVerified: isEmailVerified,
    createdAt: (userData.createdAt as string) || undefined,
  }
}

export const useUserStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  login: async (email: string, password: string, rememberMe = false) => {
    set({ isLoading: true, error: null })

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe }),
      })

      const data = await response.json()

      if (response.ok && data.data) {
        const user = normalizeUser(data.data.user)
        const token = data.data.token || getClientCookie(AUTH_COOKIE_NAME) || 'authenticated'

        if (token && typeof window !== 'undefined') {
          setClientCookie(AUTH_COOKIE_NAME, token, rememberMe ? 365 : 7)
        }

        set({
          user,
          token,
          isLoading: false,
          error: null,
        })

        if (typeof window !== 'undefined') {
          if (rememberMe) {
            const emailExpires = new Date()
            emailExpires.setTime(emailExpires.getTime() + (365 * 24 * 60 * 60 * 1000))
            document.cookie = `saved_email=${encodeURIComponent(email)}; expires=${emailExpires.toUTCString()}; path=/; SameSite=Strict${window.location.protocol === 'https:' ? '; Secure' : ''}`
          } else {
            document.cookie = 'saved_email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          }
        }

        return true
      } else {
        set({
          isLoading: false,
          error: data.message || 'Login failed',
        })
        return false
      }
    } catch {
      set({
        isLoading: false,
        error: 'Network error. Please try again.',
      })
      return false
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null })

    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (response.ok && data.data) {
        const rawUser = data.data.user || data.data
        const user = normalizeUser(rawUser)
        const token = data.data.token || getClientCookie(AUTH_COOKIE_NAME) || 'authenticated'

        if (token && typeof window !== 'undefined') {
          setClientCookie(AUTH_COOKIE_NAME, token, 7)
        }

        set({
          user,
          token,
          isLoading: false,
          error: null,
        })

        return true
      } else {
        set({
          isLoading: false,
          error: data.message || 'Registration failed',
        })
        return false
      }
    } catch {
      set({
        isLoading: false,
        error: 'Network error. Please try again.',
      })
      return false
    }
  },

  logout: () => {
    set({
      user: null,
      token: null,
      error: null,
    })
    if (typeof window !== 'undefined') {
      deleteClientCookie(AUTH_COOKIE_NAME)
      document.cookie = 'saved_email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      fetch('/api/v1/auth/logout', { method: 'POST' }).catch(() => {})
    }
  },

  initializeAuth: async () => {
    set({ isLoading: true })

    try {
      const cookieToken = getClientCookie(AUTH_COOKIE_NAME)
      const response = await fetch('/api/v1/auth/me', {
        method: 'GET',
        headers: cookieToken ? { 'Authorization': `Bearer ${cookieToken}` } : {},
      })
      const data = await response.json()

      if (response.ok && data.data) {
        const user = normalizeUser(data.data)
        set({
          user,
          token: cookieToken || 'authenticated',
          isLoading: false,
          error: null,
        })
      } else {
        deleteClientCookie(AUTH_COOKIE_NAME)
        set({ user: null, token: null, isLoading: false })
      }
    } catch {
      set({ user: null, token: null, isLoading: false })
    }
  },

  getSavedEmail: () => {
    if (typeof window !== 'undefined') {
      const cookies = document.cookie.split(';')
      const emailCookie = cookies.find(cookie => cookie.trim().startsWith('saved_email='))
      if (emailCookie) {
        return decodeURIComponent(emailCookie.split('=')[1])
      }
    }
    return null
  },

  validateProfile: async () => {
    try {
      const cookieToken = getClientCookie(AUTH_COOKIE_NAME)
      const response = await fetch('/api/v1/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(cookieToken ? { 'Authorization': `Bearer ${cookieToken}` } : {}),
        },
      })

      const data = await response.json()

      if (response.ok && data.data) {
        const user = normalizeUser(data.data)
        set({
          user,
          token: cookieToken || 'authenticated',
          isLoading: false,
          error: null,
        })
        return true
      } else {
        set({
          user: null,
          token: null,
          isLoading: false,
        })
        return false
      }
    } catch {
      set({
        user: null,
        token: null,
        isLoading: false,
      })
      return false
    }
  },
}))
