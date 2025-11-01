import { create } from "zustand"

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
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
  login: (email: string, password: string) => Promise<boolean>
  register: (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
  }) => Promise<boolean>
  logout: () => void
  initializeAuth: () => void
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

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })

    try {
      const response = await fetch('/api/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        set({
          user: data.data.user,
          token: data.data.token,
          isLoading: false,
          error: null
        })
        // Store token in cookies for persistence
        if (typeof window !== 'undefined') {
          const expires = new Date()
          expires.setTime(expires.getTime() + (7 * 24 * 60 * 60 * 1000)) // 7 days
          document.cookie = `auth_token=${data.data.token}; expires=${expires.toUTCString()}; path=/; SameSite=Strict${window.location.protocol === 'https:' ? '; Secure' : ''}`
        }
        return true
      } else {
        set({
          isLoading: false,
          error: data.message || 'Login failed'
        })
        return false
      }
    } catch {
      set({
        isLoading: false,
        error: 'Network error. Please try again.'
      })
      return false
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null })

    try {
      const response = await fetch('/api/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (data.success) {
        set({
          user: data.data,
          isLoading: false,
          error: null
        })
        return true
      } else {
        set({
          isLoading: false,
          error: data.message || 'Registration failed'
        })
        return false
      }
    } catch {
      set({
        isLoading: false,
        error: 'Network error. Please try again.'
      })
      return false
    }
  },

  logout: () => {
    set({
      user: null,
      token: null,
      error: null
    })
    if (typeof window !== 'undefined') {
      // Clear the auth token cookie
      document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    }
  },

  initializeAuth: () => {
    if (typeof window !== 'undefined') {
      // Get token from cookies
      const cookies = document.cookie.split(';')
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='))

      if (tokenCookie) {
        const token = tokenCookie.split('=')[1]
        if (token) {
          set({ token })
          // TODO: Optionally validate token with backend and fetch user data
        }
      }
    }
  },
}))