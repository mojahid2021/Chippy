import { create } from "zustand"

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  emailVerified?: boolean
}

interface AuthState {
  user: User | null
  // Not the real JWT - the session itself lives in an httpOnly cookie the
  // client can never read (see app/api/user/login and /register). This is
  // just a truthy marker so pages can gate rendering on "do we have a
  // session" without ever holding the actual secret in JS-accessible state.
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
  }) => Promise<boolean>
  logout: () => void
  initializeAuth: () => void
  getSavedEmail: () => string | null
  validateProfile: () => Promise<boolean>
}

const SESSION_MARKER = 'session'

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
      const response = await fetch('/api/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe }),
      })

      const data = await response.json()

      if (data.success) {
        // The backend sets the real session as an httpOnly cookie - nothing
        // sensitive comes back in the response body.
        set({
          user: data.data.user,
          token: SESSION_MARKER,
          isLoading: false,
          error: null
        })

        if (typeof window !== 'undefined') {
          // Saved email is just a convenience, not a secret - fine in a
          // regular (non-httpOnly) cookie.
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
        // The register route also logs the new user in and sets the session
        // cookie, so we have a real session here too (not just a created
        // account the user then appears logged out of).
        set({
          user: data.data.user,
          token: SESSION_MARKER,
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
      // Clear the httpOnly session cookie server-side (client JS can't read
      // or clear it directly). Fire-and-forget - client state above is
      // already cleared regardless of the outcome.
      fetch('/api/user/logout', { method: 'POST' }).catch(() => {})
      document.cookie = 'saved_email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    }
  },

  initializeAuth: async () => {
    set({ isLoading: true })

    try {
      // The session cookie (if any) rides along automatically; there's
      // nothing to read from document.cookie since it's httpOnly.
      const response = await fetch('/api/user/profile', { method: 'GET' })
      const data = await response.json()

      if (data.success) {
        set({
          user: data.data,
          token: SESSION_MARKER,
          isLoading: false,
          error: null
        })
      } else {
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
      const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        set({
          user: data.data,
          token: SESSION_MARKER,
          isLoading: false,
          error: null
        })
        return true
      } else {
        set({
          user: null,
          token: null,
          isLoading: false
        })
        return false
      }
    } catch {
      set({
        user: null,
        token: null,
        isLoading: false
      })
      return false
    }
  },
}))
