import { Ionicons } from '@expo/vector-icons'
import React, { useEffect } from 'react'
import { StyleSheet, TouchableOpacity } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { useAppColorScheme } from '../hooks/use-app-color-scheme'
import { getColors, radius } from '../lib/theme'

interface Props {
  onPress: () => void
  visible?: boolean
  icon?: keyof typeof Ionicons.glyphMap
}

export default function FAB({ onPress, visible = true, icon = 'add' }: Props) {
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)
  const scale = useSharedValue(visible ? 1 : 0)
  const opacity = useSharedValue(visible ? 1 : 0)

  useEffect(() => {
    scale.value = withSpring(visible ? 1 : 0, { damping: 15, stiffness: 150 })
    opacity.value = withTiming(visible ? 1 : 0, { duration: 150 })
  }, [visible, scale, opacity])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <Animated.View style={[styles.fabWrapper, animStyle]}>
      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.fab }]} onPress={onPress} activeOpacity={0.85}>
        <Ionicons name={icon} size={26} color={colors.fabText} />
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  fabWrapper: {
    position: 'absolute',
    bottom: 28,
    right: 20,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
})
