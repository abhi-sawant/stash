import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/space-grotesk'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import 'react-native-reanimated'

import UpdatePrompt from '@/components/UpdatePrompt'
import { useAppColorScheme } from '@/hooks/use-app-color-scheme'
import { useBackgroundSync } from '@/hooks/use-background-sync'
import { useUpdateChecker } from '@/hooks/use-update-checker'
import { AuthProvider } from '../lib/auth-context'
import { BookmarksProvider } from '../lib/context'

export const unstable_settings = {
  anchor: '(tabs)',
}

void SplashScreen.preventAutoHideAsync()

function AppShell() {
  const colorScheme = useAppColorScheme()
  // Automatically uploads a backup once every 24 h when the user is signed in
  useBackgroundSync()
  const { updateInfo, dismissUpdate, clearUpdateInfo } = useUpdateChecker()

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
      {updateInfo && (
        <UpdatePrompt
          updateInfo={updateInfo}
          onDismiss={clearUpdateInfo}
          onSkipVersion={() => dismissUpdate(updateInfo.latestVersion)}
        />
      )}
    </ThemeProvider>
  )
}

export default function RootLayout() {
  const [fontsLoaded, fontsError] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  })

  useEffect(() => {
    if (fontsLoaded || fontsError) {
      void SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontsError])

  if (!fontsLoaded && !fontsError) {
    return null
  }

  return (
    <AuthProvider>
      <BookmarksProvider>
        <AppShell />
      </BookmarksProvider>
    </AuthProvider>
  )
}
