import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useAppColorScheme } from '../hooks/use-app-color-scheme'
import { getColors, radius, spacing, typography } from '../lib/theme'

// ── SearchBar ──────────────────────────────────────────────────────────────
interface SearchBarProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  autoFocus?: boolean
}

export function SearchBar({ value, onChangeText, placeholder = 'Search bookmarks...', autoFocus }: SearchBarProps) {
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)

  return (
    <View
      style={[
        styles.searchContainer,
        { backgroundColor: colors.inputBg, borderColor: value ? colors.inputFocusBorder : colors.inputBorder },
      ]}>
      <Ionicons name='search' size={18} color={colors.textTertiary} />
      <TextInput
        style={[styles.searchInput, { color: colors.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        autoFocus={autoFocus}
        autoCapitalize='none'
        autoCorrect={false}
        returnKeyType='search'
        clearButtonMode='while-editing'
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name='close-circle' size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      )}
    </View>
  )
}

// ── FilterChip ─────────────────────────────────────────────────────────────
interface FilterChipProps {
  label: string
  active: boolean
  onPress: () => void
  icon?: keyof typeof Ionicons.glyphMap
}

export function FilterChip({ label, active, onPress, icon }: FilterChipProps) {
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)

  return (
    <TouchableOpacity
      style={[styles.chip, { backgroundColor: active ? colors.chipActive : colors.chip }]}
      onPress={onPress}
      activeOpacity={0.7}>
      {icon && <Ionicons name={icon} size={13} color={active ? colors.chipActiveText : colors.chipText} />}
      <Text style={[styles.chipText, { color: active ? colors.chipActiveText : colors.chipText }]}>{label}</Text>
    </TouchableOpacity>
  )
}

// ── FilterRow ──────────────────────────────────────────────────────────────
interface FilterRowProps {
  children: React.ReactNode
}

export function FilterRow({ children }: FilterRowProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
      {children}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 46,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyMedium,
    padding: 0,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  chipText: {
    ...typography.labelMedium,
  },
  filterRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
})
