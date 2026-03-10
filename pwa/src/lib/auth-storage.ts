import type { StoredUser } from './types'

const TOKEN_KEY = 'stash_auth_token'
const USER_KEY = 'stash_auth_user'

export function saveAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function saveAuthUser(user: StoredUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getAuthUser(): StoredUser | null {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? (JSON.parse(raw) as StoredUser) : null
}

export function clearAuthUser(): void {
  localStorage.removeItem(USER_KEY)
}
