import { useColorScheme } from 'react-native'
import { useBookmarks } from '../lib/context'

/**
 * Returns the effective color scheme based on the user's theme preference setting.
 * Falls back to the system scheme when preference is 'system'.
 */
export function useAppColorScheme() {
  const systemScheme = useColorScheme()
  const { settings } = useBookmarks()

  if (settings.themePreference === 'light') return 'light' as const
  if (settings.themePreference === 'dark') return 'dark' as const
  return systemScheme
}
