import { HapticTab } from '@/components/haptic-tab'
import { useAppColorScheme } from '@/hooks/use-app-color-scheme'
import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React from 'react'
import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getColors } from '../../lib/theme'

export default function TabLayout() {
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 56 + insets.bottom,
          paddingBottom: Platform.OS === 'ios' ? 28 : insets.bottom + 4,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}>
      <Tabs.Screen
        name='index'
        options={{
          title: 'Bookmarks',
          tabBarIcon: ({ color, size }) => <Ionicons name='bookmark' size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name='collections'
        options={{
          title: 'Collections',
          tabBarIcon: ({ color, size }) => <Ionicons name='folder' size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name='search'
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Ionicons name='search' size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name='settings'
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name='settings' size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}
