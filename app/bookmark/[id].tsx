import { Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import * as ImagePicker from 'expo-image-picker'
import { router, useLocalSearchParams } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import React, { useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Image,
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
import { getColors, getTagColor, radius, spacing, typography } from '../../lib/theme'
import { extractDomain, formatDate, normalizeUrl } from '../../lib/utils'

export default function EditBookmarkScreen() {
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)
  const { id } = useLocalSearchParams<{ id: string }>()
  const { bookmarks, collections, updateBookmark, deleteBookmark } = useBookmarks()

  const bookmark = bookmarks.find((b) => b.id === id)

  const [url, setUrl] = useState(bookmark?.url ?? '')
  const [title, setTitle] = useState(bookmark?.title ?? '')
  const [subtitle, setSubtitle] = useState(bookmark?.subtitle ?? '')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(bookmark?.tags ?? [])
  const [selectedCollection, setSelectedCollection] = useState<string | null>(bookmark?.collectionId ?? null)
  const [imageUri, setImageUri] = useState<string | undefined>(bookmark?.imageUri)
  const [showCollectionPicker, setShowCollectionPicker] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!bookmark) {
    router.back()
    return null
  }

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase().replace(/\s+/g, '-')
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag))

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow media library access to pick an image.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [16, 9],
    })
    if (!result.canceled) {
      setImageUri(result.assets[0].uri)
    }
  }

  const handleSave = () => {
    const normalized = normalizeUrl(url)
    if (!normalized) {
      Alert.alert('URL Required', 'Please enter a valid URL')
      return
    }
    setSaving(true)
    updateBookmark({
      id: bookmark.id,
      url: normalized,
      title: title.trim() || normalized,
      subtitle: subtitle.trim(),
      tags,
      collectionId: selectedCollection ?? undefined,
      imageUri,
    })
    router.back()
  }

  const handleDelete = () => {
    Alert.alert('Delete Bookmark', `Delete "${bookmark.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteBookmark(bookmark.id)
          router.back()
        },
      },
    ])
  }

  const openLink = () => {
    WebBrowser.openBrowserAsync(bookmark.url)
  }

  const selectedCol = collections.find((c) => c.id === selectedCollection)

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.divider }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name='close' size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Bookmark</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
            {saving ? (
              <ActivityIndicator size='small' color={colors.textOnPrimary} />
            ) : (
              <Text style={[styles.saveBtnText, { color: colors.textOnPrimary }]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}>
          {/* Quick actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primaryContainer }]}
              onPress={openLink}>
              <Ionicons name='open-outline' size={18} color={colors.primary} />
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>Open Link</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primaryContainer }]}
              onPress={() => Clipboard.setStringAsync(bookmark.url)}>
              <Ionicons name='copy-outline' size={18} color={colors.primary} />
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>Copy URL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.errorContainer }]}
              onPress={handleDelete}>
              <Ionicons name='trash-outline' size={18} color={colors.error} />
              <Text style={[styles.actionBtnText, { color: colors.error }]}>Delete</Text>
            </TouchableOpacity>
          </View>

          {/* Meta info */}
          <View style={[styles.metaCard, { backgroundColor: colors.surfaceVariant }]}>
            <View style={styles.metaRow}>
              {bookmark.faviconUri ? (
                <Image source={{ uri: bookmark.faviconUri }} style={styles.favicon} resizeMode='contain' />
              ) : (
                <View style={[styles.faviconPlaceholder, { backgroundColor: colors.border }]}>
                  <Ionicons name='link' size={16} color={colors.textSecondary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.domain, { color: colors.textSecondary }]} numberOfLines={1}>
                  {extractDomain(bookmark.url)}
                </Text>
                <Text style={[styles.savedAt, { color: colors.textTertiary }]}>
                  Saved {formatDate(bookmark.createdAt)}
                </Text>
              </View>
            </View>
          </View>

          {/* Image */}
          {imageUri ? (
            <TouchableOpacity onPress={pickImage} style={styles.imagePreview}>
              <Image source={{ uri: imageUri }} style={styles.previewImg} resizeMode='cover' />
              <View style={styles.imageOverlay}>
                <Ionicons name='camera' size={22} color='#fff' />
                <Text style={styles.imageOverlayText}>Change Image</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.imagePicker, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
              onPress={pickImage}>
              <Ionicons name='image-outline' size={28} color={colors.textSecondary} />
              <Text style={[styles.imagePickerText, { color: colors.textSecondary }]}>Add custom image</Text>
            </TouchableOpacity>
          )}

          {/* URL */}
          <Label text='URL' colors={colors} />
          <TextInput
            style={[
              styles.fieldInput,
              { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text },
            ]}
            value={url}
            onChangeText={setUrl}
            placeholder='https://example.com'
            placeholderTextColor={colors.textTertiary}
            autoCapitalize='none'
            autoCorrect={false}
            keyboardType='url'
          />

          {/* Title */}
          <Label text='Title' colors={colors} />
          <TextInput
            style={[
              styles.fieldInput,
              { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text },
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder='Bookmark title'
            placeholderTextColor={colors.textTertiary}
          />

          {/* Subtitle */}
          <Label text='Description' colors={colors} />
          <TextInput
            style={[
              styles.fieldInput,
              styles.multiline,
              { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text },
            ]}
            value={subtitle}
            onChangeText={setSubtitle}
            placeholder='Add description...'
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            textAlignVertical='top'
          />

          {/* Tags */}
          <Label text='Tags' colors={colors} />
          <View style={[styles.tagInputRow, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
            <TextInput
              style={[styles.input, { flex: 1, color: colors.text }]}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder='Add a tag...'
              placeholderTextColor={colors.textTertiary}
              autoCapitalize='none'
              autoCorrect={false}
              returnKeyType='done'
              onSubmitEditing={addTag}
            />
            <TouchableOpacity
              onPress={addTag}
              disabled={!tagInput.trim()}
              style={[styles.addTagBtn, { backgroundColor: colors.primary, opacity: tagInput.trim() ? 1 : 0.4 }]}>
              <Ionicons name='add' size={20} color='#fff' />
            </TouchableOpacity>
          </View>
          {tags.length > 0 && (
            <View style={styles.tagsRow}>
              {tags.map((tag) => {
                const tc = getTagColor(tag)
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tagChip, { backgroundColor: tc.bg }]}
                    onPress={() => removeTag(tag)}>
                    <Text style={[styles.tagChipText, { color: tc.text }]}>#{tag}</Text>
                    <Ionicons name='close' size={12} color={tc.text} />
                  </TouchableOpacity>
                )
              })}
            </View>
          )}

          {/* Collection */}
          <Label text='Collection' colors={colors} />
          <TouchableOpacity
            style={[
              styles.fieldInput,
              styles.pickerRow,
              { backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
            ]}
            onPress={() => setShowCollectionPicker(!showCollectionPicker)}>
            {selectedCol ? (
              <>
                <View style={[styles.colDot, { backgroundColor: selectedCol.color }]} />
                <Text style={[styles.pickerText, { color: colors.text }]}>{selectedCol.name}</Text>
              </>
            ) : (
              <Text style={[styles.pickerText, { color: colors.textTertiary }]}>No collection</Text>
            )}
            <Ionicons
              name={showCollectionPicker ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          {showCollectionPicker && (
            <View style={[styles.collectionList, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.collectionOption, { borderBottomColor: colors.divider, borderBottomWidth: 1 }]}
                onPress={() => {
                  setSelectedCollection(null)
                  setShowCollectionPicker(false)
                }}>
                <Text style={[styles.pickerText, { color: colors.textSecondary }]}>None</Text>
                {!selectedCollection && <Ionicons name='checkmark' size={18} color={colors.primary} />}
              </TouchableOpacity>
              {collections.map((col) => (
                <TouchableOpacity
                  key={col.id}
                  style={[styles.collectionOption, { borderBottomColor: colors.divider, borderBottomWidth: 1 }]}
                  onPress={() => {
                    setSelectedCollection(col.id)
                    setShowCollectionPicker(false)
                  }}>
                  <View style={[styles.colDot, { backgroundColor: col.color }]} />
                  <Text style={[styles.pickerText, { color: colors.text }]}>{col.name}</Text>
                  {selectedCollection === col.id && <Ionicons name='checkmark' size={18} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function Label({ text, colors }: { text: string; colors: ReturnType<typeof getColors> }) {
  return <Text style={[labelStyles.label, { color: colors.textSecondary }]}>{text}</Text>
}
const labelStyles = StyleSheet.create({
  label: { ...typography.labelMedium, marginBottom: spacing.xs, marginTop: spacing.lg },
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
    minWidth: 64,
    alignItems: 'center',
  },
  saveBtnText: { ...typography.labelLarge },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  actionBtnText: { ...typography.labelMedium },
  metaCard: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  favicon: { width: 24, height: 24, borderRadius: 4 },
  faviconPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  domain: { ...typography.bodySmall },
  savedAt: { ...typography.labelSmall, marginTop: 2 },
  imagePreview: {
    borderRadius: radius.md,
    overflow: 'hidden',
    height: 160,
    marginTop: spacing.lg,
  },
  previewImg: { width: '100%', height: '100%' },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  imageOverlayText: { color: '#fff', ...typography.labelMedium },
  imagePicker: {
    marginTop: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  imagePickerText: { ...typography.bodySmall },
  fieldInput: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.bodyMedium,
  },
  multiline: { minHeight: 88, paddingTop: spacing.md },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1.5,
    height: 52,
    overflow: 'hidden',
  },
  input: {
    ...typography.bodyMedium,
    paddingHorizontal: spacing.md,
    height: '100%',
  },
  addTagBtn: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  tagChipText: { ...typography.labelMedium },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pickerText: { ...typography.bodyMedium, flex: 1 },
  colDot: { width: 12, height: 12, borderRadius: 6 },
  collectionList: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  collectionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
})
