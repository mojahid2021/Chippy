export const AUTH_COOKIE_NAME = 'auth_token'

/**
 * Get cookie value by name on the client side
 */
export function getClientCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + encodeURIComponent(name) + '=([^;]*)'))
  return match ? decodeURIComponent(match[2]) : null
}

/**
 * Set cookie on the client side
 */
export function setClientCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${
    isSecure ? '; Secure' : ''
  }`
}

/**
 * Delete cookie on the client side
 */
export function deleteClientCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`
}

