/**
 * Single source of truth for the backend base URL used by every Next.js API
 * route in this app. Throws instead of silently falling back to a
 * potentially wrong host (e.g. a different port, or a placeholder domain)
 * when the operator forgets to configure it.
 */
export function getBackendUrl(): string {
  const url = process.env.BACKEND_URL
  if (!url) {
    throw new Error('BACKEND_URL environment variable is not configured')
  }
  return url
}
