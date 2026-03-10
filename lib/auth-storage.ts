import AsyncStorage from '@react-native-async-storage/async-storage'

const TOKEN_KEY = 'stash_auth_token'
const USER_KEY = 'stash_auth_user'

export interface StoredUser {
  id: number
  email: string
}

export async function saveAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token)
}

export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY)
}

export async function clearAuthToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY)
}

export async function saveAuthUser(user: StoredUser): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
}

export async function getAuthUser(): Promise<StoredUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY)
  return raw ? (JSON.parse(raw) as StoredUser) : null
}

export async function clearAuthUser(): Promise<void> {
  await AsyncStorage.removeItem(USER_KEY)
}
