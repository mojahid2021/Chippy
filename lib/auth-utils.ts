import { cookies } from 'next/headers'
import { AUTH_COOKIE_NAME } from './cookie-utils'

export { AUTH_COOKIE_NAME }

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  return token || null
}

export async function getAuthHeaders() {
  const token = await getAuthToken()
  return token ? {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  } : {
    'Content-Type': 'application/json',
  }
}
