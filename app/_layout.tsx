import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'

import { useAppColorScheme } from '@/hooks/use-app-color-scheme'
import { useBackgroundSync } from '@/hooks/use-background-sync'
import { AuthProvider } from '../lib/auth-context'
import { BookmarksProvider } from '../lib/context'

export const unstable_settings = {
  anchor: '(tabs)',
}

function AppShell() {
  const colorScheme = useAppColorScheme()
  // Automatically uploads a backup once every 24 h when the user is signed in
  useBackgroundSync()
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
        <Stack.Screen name='bookmark/add' options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name='bookmark/[id]' options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name='collection/add' options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name='collection/[id]' options={{ headerShown: false }} />
        <Stack.Screen name='auth' options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <BookmarksProvider>
        <AppShell />
      </BookmarksProvider>
    </AuthProvider>
  )
}
