import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAppColorScheme } from '@/hooks/use-app-color-scheme'
import { useBookmarks } from '../../lib/context'
import { COLLECTION_COLORS, COLLECTION_ICONS, getColors, radius, spacing, typography } from '../../lib/theme'

export default function AddCollectionScreen() {
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)
  const { addCollection, updateCollection, collections } = useBookmarks()
  const { edit: editId } = useLocalSearchParams<{ edit?: string }>()

  const existingCollection = editId ? collections.find((c) => c.id === editId) : undefined
  const isEditing = !!existingCollection

  const [name, setName] = useState(existingCollection?.name ?? '')
  const [selectedColor, setSelectedColor] = useState(existingCollection?.color ?? COLLECTION_COLORS[0])
  const [selectedIcon, setSelectedIcon] = useState(existingCollection?.icon ?? COLLECTION_ICONS[0])
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    if (!name.trim()) return
    setSaving(true)
    if (isEditing && existingCollection) {
      updateCollection({
        id: existingCollection.id,
        name: name.trim(),
        color: selectedColor,
        icon: selectedIcon,
      })
    } else {
      addCollection({
        name: name.trim(),
        color: selectedColor,
        icon: selectedIcon,
      })
    }
    router.back()
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.divider }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name='close' size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {isEditing ? 'Edit Collection' : 'New Collection'}
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving || !name.trim()}
            style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: name.trim() ? 1 : 0.5 }]}>
            {saving ? (
              <ActivityIndicator size='small' color={colors.textOnPrimary} />
            ) : (
              <Text style={[styles.saveBtnText, { color: colors.textOnPrimary }]}>
                {isEditing ? 'Update' : 'Create'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Preview */}
          <View style={styles.previewRow}>
            <View style={[styles.previewIcon, { backgroundColor: `${selectedColor}20` }]}>
              <Ionicons name={selectedIcon as any} size={36} color={selectedColor} />
            </View>
            <View style={[styles.colorBar, { backgroundColor: selectedColor }]} />
          </View>

          {/* Name */}
          <Label text='Collection Name' colors={colors} />
          <TextInput
            style={[
              styles.fieldInput,
              { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text },
            ]}
            value={name}
            onChangeText={setName}
            placeholder='e.g. Work, Reading, Recipes...'
            placeholderTextColor={colors.textTertiary}
            autoFocus
            returnKeyType='done'
          />

          {/* Color picker */}
          <Label text='Color' colors={colors} />
          <View style={styles.colorGrid}>
            {COLLECTION_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorSwatchSelected,
                ]}
                onPress={() => setSelectedColor(color)}>
                {selectedColor === color && <Ionicons name='checkmark' size={16} color='#fff' />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Icon picker */}
          <Label text='Icon' colors={colors} />
          <View style={styles.iconGrid}>
            {COLLECTION_ICONS.map((icon) => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconSwatch,
                  {
                    backgroundColor: selectedIcon === icon ? `${selectedColor}20` : colors.surfaceVariant,
                    borderColor: selectedIcon === icon ? selectedColor : colors.inputBorder,
                  },
                ]}
                onPress={() => setSelectedIcon(icon)}>
                <Ionicons
                  name={icon as any}
                  size={22}
                  color={selectedIcon === icon ? selectedColor : colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function Label({ text, colors }: { text: string; colors: ReturnType<typeof getColors> }) {
  return <Text style={[labelStyles.label, { color: colors.textSecondary }]}>{text}</Text>
}
const labelStyles = StyleSheet.create({
  label: { ...typography.labelMedium, marginBottom: spacing.sm, marginTop: spacing.xl },
})

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  headerBtn: { padding: spacing.xs },
  headerTitle: { ...typography.headlineSmall, flex: 1 },
  saveBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    minWidth: 72,
    alignItems: 'center',
  },
  saveBtnText: { ...typography.labelLarge },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  previewRow: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  previewIcon: {
    width: 88,
    height: 88,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: spacing.md,
  },
  fieldInput: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.bodyMedium,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    transform: [{ scale: 1.15 }],
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  iconSwatch: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  colDot: { width: 12, height: 12, borderRadius: 6 },
})
