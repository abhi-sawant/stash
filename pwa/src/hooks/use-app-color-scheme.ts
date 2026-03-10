import { useEffect, useState } from 'react'
import { useBookmarks } from '../lib/context'

type ColorScheme = 'light' | 'dark'

export function useAppColorScheme(): ColorScheme {
  const { settings } = useBookmarks()

  const getSystemScheme = (): ColorScheme =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

  const [scheme, setScheme] = useState<ColorScheme>(() => {
    if (settings.themePreference === 'system') return getSystemScheme()
    return settings.themePreference
  })

  useEffect(() => {
    if (settings.themePreference !== 'system') {
      setScheme(settings.themePreference)
      return
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setScheme(e.matches ? 'dark' : 'light')
    setScheme(getSystemScheme())
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [settings.themePreference])

  return scheme
}
