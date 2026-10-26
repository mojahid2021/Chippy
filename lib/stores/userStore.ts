import { create } from "zustand"

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  emailVerified?: boolean
}

export interface Tenant {
  id: string
  name: string
  slug: string
  role: string
  status?: string
  subscriptionStatus?: string
  subscriptionEndsAt?: string | null
}

export interface TenantContext {
  tenantId: string
  slug: string
  role: string
  permissions: string[]
}

interface AuthState {
  user: User | null
  // Not the real JWT - the session itself lives in an httpOnly cookie the
  // client can never read (see app/api/user/login and /register). This is
  // just a truthy marker so pages can gate rendering on "do we have a
  // session" without ever holding the actual secret in JS-accessible state.
  token: string | null
  activeTenantId: string | null
  tenants: Tenant[]
  currentRole: string | null
  permissions: string[]
  isLoading: boolean
  error: string | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setActiveTenantId: (tenantId: string | null) => void
  setTenants: (tenants: Tenant[]) => void
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
  switchTenant: (tenantId: string) => Promise<boolean>
  loadTenantContext: () => Promise<void>
}

const SESSION_MARKER = 'session'

export const useUserStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  activeTenantId: null,
  tenants: [],
  currentRole: null,
  permissions: [],
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setActiveTenantId: (activeTenantId) => set({ activeTenantId }),
  setTenants: (tenants) => set({ tenants }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  loadTenantContext: async () => {
    try {
      const [tenantsRes, meRes] = await Promise.all([
        fetch('/api/tenant', { method: 'GET' }).catch(() => null),
        fetch('/api/tenant/me', { method: 'GET' }).catch(() => null),
      ])

      const updates: Partial<AuthState> = {}

      if (tenantsRes && tenantsRes.ok) {
        const tenantsData = await tenantsRes.json()
        if (tenantsData.success && Array.isArray(tenantsData.data)) {
          updates.tenants = tenantsData.data
        }
      }

      if (meRes && meRes.ok) {
        const meData = await meRes.json()
        if (meData.success && meData.data) {
          updates.activeTenantId = meData.data.tenantId
          updates.currentRole = meData.data.role
          updates.permissions = meData.data.permissions || []
        }
      }

      if (Object.keys(updates).length > 0) {
        set(updates)
      }
    } catch (err) {
      console.error('Failed to load tenant context:', err)
    }
  },

  switchTenant: async (tenantId: string) => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch(`/api/tenant/${tenantId}/switch`, {
        method: 'POST',
      })
      const data = await res.json()
      if (data.success) {
        set({
          activeTenantId: data.data.tenantId || tenantId,
          currentRole: data.data.role,
          isLoading: false,
        })
        await get().loadTenantContext()
        return true
      } else {
        set({ isLoading: false, error: data.message || 'Failed to switch workspace' })
        return false
      }
    } catch {
      set({ isLoading: false, error: 'Network error while switching workspace' })
      return false
    }
  },

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
          activeTenantId: data.data.activeTenantId ?? null,
          tenants: data.data.tenants ?? [],
          isLoading: false,
          error: null
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

        // Asynchronously populate tenant permissions
        void get().loadTenantContext()
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
          user: data.data.user,
          token: SESSION_MARKER,
          activeTenantId: data.data.activeTenantId ?? null,
          tenants: data.data.tenants ?? [],
          isLoading: false,
          error: null
        })
        void get().loadTenantContext()
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
      activeTenantId: null,
      tenants: [],
      currentRole: null,
      permissions: [],
      error: null
    })
    if (typeof window !== 'undefined') {
      fetch('/api/user/logout', { method: 'POST' }).catch(() => {})
      document.cookie = 'saved_email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    }
  },

  initializeAuth: async () => {
    set({ isLoading: true })

    try {
      const response = await fetch('/api/user/profile', { method: 'GET' })
      const data = await response.json()

      if (data.success) {
        set({
          user: data.data,
          token: SESSION_MARKER,
          isLoading: false,
          error: null
        })
        await get().loadTenantContext()
      } else {
        set({ user: null, token: null, activeTenantId: null, tenants: [], currentRole: null, permissions: [], isLoading: false })
      }
    } catch {
      set({ user: null, token: null, activeTenantId: null, tenants: [], currentRole: null, permissions: [], isLoading: false })
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
        await get().loadTenantContext()
        return true
      } else {
        set({
          user: null,
          token: null,
          activeTenantId: null,
          tenants: [],
          currentRole: null,
          permissions: [],
          isLoading: false
        })
        return false
      }
    } catch {
      set({
        user: null,
        token: null,
        activeTenantId: null,
        tenants: [],
        currentRole: null,
        permissions: [],
        isLoading: false
      })
      return false
    }
  },
}))
