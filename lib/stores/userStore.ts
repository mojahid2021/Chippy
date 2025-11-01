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
          // Set expiration based on remember me preference
          const daysToExpire = rememberMe ? 365 : 7 // 365 days if remember me (max lifetime), 7 days otherwise
          expires.setTime(expires.getTime() + (daysToExpire * 24 * 60 * 60 * 1000))
          document.cookie = `auth_token=${data.data.token}; expires=${expires.toUTCString()}; path=/; SameSite=Strict${window.location.protocol === 'https:' ? '; Secure' : ''}`
          
          // Save email for convenience if remember me is checked
          if (rememberMe) {
            const emailExpires = new Date()
            emailExpires.setTime(emailExpires.getTime() + (365 * 24 * 60 * 60 * 1000)) // 365 days for email when remember me
            document.cookie = `saved_email=${encodeURIComponent(email)}; expires=${emailExpires.toUTCString()}; path=/; SameSite=Strict${window.location.protocol === 'https:' ? '; Secure' : ''}`
          } else {
            // Clear saved email if remember me is not checked
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
      // Clear the saved email cookie
      document.cookie = 'saved_email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    }
  },

  initializeAuth: async () => {
    if (typeof window !== 'undefined') {
      set({ isLoading: true }) // Set loading state at the start

      // Get token from cookies
      const cookies = document.cookie.split(';')
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='))

      if (tokenCookie) {
        const token = tokenCookie.split('=')[1]
        if (token) {
          set({ token })
          // Validate the token and fetch user data
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
                isLoading: false,
                error: null
              })
            } else {
              // Clear invalid token
              document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
              set({
                user: null,
                token: null,
                isLoading: false
              })
            }
          } catch {
            // Clear invalid token on network error
            document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
            set({
              user: null,
              token: null,
              isLoading: false
            })
          }
        } else {
          // No valid token found
          set({ isLoading: false })
        }
      } else {
        // No token cookie found
        set({ isLoading: false })
      }
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
          isLoading: false,
          error: null
        })
        return true
      } else {
        // Clear invalid token
        if (typeof window !== 'undefined') {
          document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        }
        set({
          user: null,
          token: null,
          isLoading: false
        })
        return false
      }
    } catch {
      // Clear invalid token on network error
      if (typeof window !== 'undefined') {
        document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      }
      set({
        user: null,
        token: null,
        isLoading: false
      })
      return false
    }
  },
}))