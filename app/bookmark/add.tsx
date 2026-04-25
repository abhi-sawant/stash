import { Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import * as ImagePicker from 'expo-image-picker'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAppColorScheme } from '@/hooks/use-app-color-scheme'
import MetadataWebView from '../../components/MetadataWebView'
import { useBookmarks } from '../../lib/context'
import { COLLECTION_COLORS, COLLECTION_ICONS, getColors, radius, spacing, typography } from '../../lib/theme'
import { UrlMetadata } from '../../lib/types'
import { fetchUrlMetadata, getFaviconUrl, normalizeUrl } from '../../lib/utils'
function buildPreviewUriCandidates(uri: string): string[] {
  if (!uri.startsWith('http')) return [uri]

  const variants = [uri, uri.replace(/@/g, '%40'), encodeURI(uri), encodeURI(uri).replace(/@/g, '%40')]

  return Array.from(new Set(variants.filter(Boolean)))
}

export default function AddBookmarkScreen() {
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)
  const { addBookmark, addCollection, collections } = useBookmarks()
  const { url: initialUrl } = useLocalSearchParams<{ url?: string }>()

  const [url, setUrl] = useState(initialUrl ?? '')
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [imageUri, setImageUri] = useState<string | undefined>()
  const [imagePreviewFailed, setImagePreviewFailed] = useState(false)
  const [previewUriIndex, setPreviewUriIndex] = useState(0)
  const [faviconUri, setFaviconUri] = useState<string | undefined>()
  const [fetchingMeta, setFetchingMeta] = useState(false)
  const [webViewUrl, setWebViewUrl] = useState<string | null>(null)
  const [showCollectionPicker, setShowCollectionPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showNewColForm, setShowNewColForm] = useState(false)
  const [newColName, setNewColName] = useState('')
  const [newColColor, setNewColColor] = useState(COLLECTION_COLORS[0])
  const [newColIcon, setNewColIcon] = useState(COLLECTION_ICONS[0])

  // Auto-fetch metadata when URL is pre-filled (run once on mount)
  const initialUrlRef = React.useRef(initialUrl)
  useEffect(() => {
    if (initialUrlRef.current) handleFetchMeta(initialUrlRef.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const applyMetadata = (meta: UrlMetadata) => {
    if (meta.title) setTitle(meta.title)
    if (meta.description) setSubtitle(meta.description)
    if (meta.imageUrl) {
      setImageUri(meta.imageUrl)
      setImagePreviewFailed(false)
      setPreviewUriIndex(0)
    }
    if (meta.faviconUrl) setFaviconUri(meta.faviconUrl)
  }

  const handleFetchMeta = (urlToFetch?: string) => {
    const targetUrl = normalizeUrl(urlToFetch ?? url)
    if (!targetUrl) return
    setUrl(targetUrl)
    setFetchingMeta(true)
    // Try WebView first — real browser engine handles JS-rendered pages & bot detection
    setWebViewUrl(targetUrl)
  }

  const handleWebViewResult = (meta: UrlMetadata) => {
    setWebViewUrl(null)
    setFetchingMeta(false)
    applyMetadata(meta)
  }

  const handleWebViewError = async () => {
    // WebView failed or timed out — fall back to direct fetch
    setWebViewUrl(null)
    const targetUrl = normalizeUrl(url)
    if (!targetUrl) {
      setFetchingMeta(false)
      return
    }
    try {
      const meta = await fetchUrlMetadata(targetUrl)
      applyMetadata(meta)
    } catch {
      // Silently fail
    } finally {
      setFetchingMeta(false)
    }
  }

  const handlePasteUrl = async () => {
    const text = await Clipboard.getStringAsync()
    if (text) {
      setUrl(text)
      handleFetchMeta(text)
    }
  }

  const previewUriCandidates = imageUri ? buildPreviewUriCandidates(imageUri) : []
  const previewUri = previewUriCandidates[previewUriIndex] ?? imageUri

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
      setImagePreviewFailed(false)
      setPreviewUriIndex(0)
    }
  }

  const handleSave = async () => {
    const normalized = normalizeUrl(url)
    if (!normalized) {
      Alert.alert('URL Required', 'Please enter a valid URL')
      return
    }
    setSaving(true)
    addBookmark({
      url: normalized,
      title: title.trim() || normalized,
      subtitle: subtitle.trim(),
      collectionId: selectedCollection ?? undefined,
      imageUri,
      faviconUri: faviconUri || getFaviconUrl(normalized),
    })
    router.back()
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Add Bookmark</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving || !url.trim()}
            style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: !url.trim() ? 0.5 : 1 }]}>
            {saving ? (
              <ActivityIndicator size='small' color={colors.textOnPrimary} />
            ) : (
              <Text style={[styles.saveBtnText, { color: colors.textOnPrimary }]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}>
          {/* URL Input */}
          <Label text='URL' colors={colors} />
          <View style={[styles.urlRow, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
            <Ionicons name='link' size={18} color={colors.textTertiary} style={{ marginLeft: spacing.md }} />
            <TextInput
              style={[styles.input, { color: colors.text, flex: 1 }]}
              value={url}
              onChangeText={setUrl}
              placeholder='https://example.com'
              placeholderTextColor={colors.textTertiary}
              autoCapitalize='none'
              autoCorrect={false}
              keyboardType='url'
              returnKeyType='done'
              onSubmitEditing={() => handleFetchMeta()}
            />
            <TouchableOpacity onPress={handlePasteUrl} style={styles.pasteBtn}>
              <Ionicons name='clipboard-outline' size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleFetchMeta()}
              disabled={fetchingMeta || !url.trim()}
              style={[styles.fetchBtn, { backgroundColor: colors.primaryContainer }]}>
              {fetchingMeta ? (
                <ActivityIndicator size='small' color={colors.primary} />
              ) : (
                <Text style={[styles.fetchBtnText, { color: colors.primary }]}>Fetch</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Custom Image */}
          {imageUri ? (
            <View style={styles.imagePreview}>
              <TouchableOpacity onPress={pickImage} activeOpacity={0.85}>
                {!imagePreviewFailed ? (
                  <Image
                    key={`${imageUri}_${previewUriIndex}`}
                    source={{ uri: previewUri }}
                    style={styles.previewImg}
                    resizeMode='cover'
                    onError={() => {
                      if (previewUriIndex < previewUriCandidates.length - 1) {
                        setPreviewUriIndex((prev) => prev + 1)
                        return
                      }
                      setImagePreviewFailed(true)
                    }}
                    onLoad={() => setImagePreviewFailed(false)}
                  />
                ) : (
                  <View style={[styles.previewFallback, { backgroundColor: colors.surfaceVariant }]}>
                    <Ionicons name='image-outline' size={26} color={colors.textSecondary} />
                    <Text style={[styles.previewFallbackText, { color: colors.textSecondary }]}>
                      Preview unavailable
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setImageUri(undefined)
                  setImagePreviewFailed(false)
                  setPreviewUriIndex(0)
                }}
                style={styles.imageRemoveBtn}>
                <Ionicons name='close' size={14} color='#fff' />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.imagePicker, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
              onPress={pickImage}>
              <Ionicons name='image-outline' size={28} color={colors.textSecondary} />
              <Text style={[styles.imagePickerText, { color: colors.textSecondary }]}>Add custom image (optional)</Text>
            </TouchableOpacity>
          )}

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
            returnKeyType='next'
          />

          {/* Subtitle */}
          <Label text='Description (optional)' colors={colors} />
          <TextInput
            style={[
              styles.fieldInput,
              styles.multiline,
              { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text },
            ]}
            value={subtitle}
            onChangeText={setSubtitle}
            placeholder='Add a short description...'
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            textAlignVertical='top'
          />

          {/* Collection */}
          <Label text='Collection (optional)' colors={colors} />
          <TouchableOpacity
            style={[
              styles.fieldInput,
              styles.pickerRow,
              { backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
            ]}
            onPress={() => setShowCollectionPicker(true)}>
            {selectedCol ? (
              <>
                <View style={[styles.colDot, { backgroundColor: selectedCol.color }]} />
                <Text style={[styles.pickerText, { color: colors.text }]}>{selectedCol.name}</Text>
              </>
            ) : (
              <Text style={[styles.pickerText, { color: colors.textTertiary }]}>No collection</Text>
            )}
            <Ionicons name='chevron-down' size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          {/* Collection picker modal */}
          <Modal
            visible={showCollectionPicker}
            transparent
            animationType='fade'
            onRequestClose={() => {
              setShowCollectionPicker(false)
              setShowNewColForm(false)
            }}>
            <TouchableWithoutFeedback
              onPress={() => {
                setShowCollectionPicker(false)
                setShowNewColForm(false)
              }}>
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>
            <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
              <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Collection</Text>
              <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
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
                      setShowNewColForm(false)
                    }}>
                    <View style={[styles.colDot, { backgroundColor: col.color }]} />
                    <Text style={[styles.pickerText, { color: colors.text }]}>{col.name}</Text>
                    {selectedCollection === col.id && <Ionicons name='checkmark' size={18} color={colors.primary} />}
                  </TouchableOpacity>
                ))}

                {/* New collection form */}
                {showNewColForm ? (
                  <View style={[styles.newColForm, { borderTopColor: colors.divider }]}>
                    <View style={styles.newColColorPicker}>
                      {COLLECTION_COLORS.map((c) => (
                        <TouchableOpacity
                          key={c}
                          style={[
                            styles.newColSwatch,
                            { backgroundColor: c },
                            newColColor === c && { borderWidth: 2.5, borderColor: '#fff', opacity: 1 },
                            newColColor !== c && { opacity: 0.65 },
                          ]}
                          onPress={() => setNewColColor(c)}>
                          {newColColor === c && <Ionicons name='checkmark' size={12} color='#fff' />}
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.newColInputRow}>
                      <View
                        style={[
                          styles.colDot,
                          { backgroundColor: newColColor, width: 10, height: 10, borderRadius: 5 },
                        ]}
                      />
                      <TextInput
                        style={[styles.newColInput, { color: colors.text, flex: 1 }]}
                        value={newColName}
                        onChangeText={setNewColName}
                        placeholder='Collection name...'
                        placeholderTextColor={colors.textTertiary}
                        autoFocus
                        returnKeyType='done'
                        onSubmitEditing={() => {
                          if (!newColName.trim()) return
                          const id = addCollection({ name: newColName.trim(), color: newColColor, icon: newColIcon })
                          setSelectedCollection(id)
                          setShowCollectionPicker(false)
                          setShowNewColForm(false)
                          setNewColName('')
                          setNewColColor(COLLECTION_COLORS[0])
                          setNewColIcon(COLLECTION_ICONS[0])
                        }}
                      />
                      <TouchableOpacity
                        onPress={() => {
                          if (!newColName.trim()) return
                          const id = addCollection({ name: newColName.trim(), color: newColColor, icon: newColIcon })
                          setSelectedCollection(id)
                          setShowCollectionPicker(false)
                          setShowNewColForm(false)
                          setNewColName('')
                          setNewColColor(COLLECTION_COLORS[0])
                          setNewColIcon(COLLECTION_ICONS[0])
                        }}
                        disabled={!newColName.trim()}
                        style={[
                          styles.newColCreateBtn,
                          { backgroundColor: colors.primary, opacity: newColName.trim() ? 1 : 0.4 },
                        ]}>
                        <Text style={[typography.labelMedium, { color: colors.textOnPrimary }]}>Create</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.collectionOption, { gap: spacing.sm }]}
                    onPress={() => setShowNewColForm(true)}>
                    <Ionicons name='add-circle-outline' size={18} color={colors.primary} />
                    <Text style={[styles.pickerText, { color: colors.primary, flex: 0 }]}>New Collection</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Hidden WebView for metadata extraction */}
      {webViewUrl && <MetadataWebView url={webViewUrl} onResult={handleWebViewResult} onError={handleWebViewError} />}
    </SafeAreaView>
  )
}

function Label({ text, colors }: { text: string; colors: ReturnType<typeof getColors> }) {
  return <Text style={[labelStyles.label, { color: colors.textSecondary }]}>{text}</Text>
}

const labelStyles = StyleSheet.create({
  label: {
    ...typography.labelMedium,
    marginBottom: spacing.xs,
    marginTop: spacing.lg,
  },
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
  headerBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.headlineSmall,
    flex: 1,
  },
  saveBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    minWidth: 64,
    alignItems: 'center',
  },
  saveBtnText: {
    ...typography.labelLarge,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1.5,
    height: 52,
    gap: spacing.sm,
  },
  input: {
    ...typography.bodyMedium,
    paddingHorizontal: spacing.md,
    height: '100%',
  },
  pasteBtn: {
    padding: spacing.md,
  },
  fetchBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
    minWidth: 56,
    alignItems: 'center',
  },
  fetchBtnText: {
    ...typography.labelMedium,
  },
  imagePreview: {
    marginTop: spacing.lg,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  previewImg: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  previewFallback: {
    width: '100%',
    aspectRatio: 16 / 9,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  previewFallbackText: {
    ...typography.bodySmall,
  },
  imageRemoveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  imagePickerText: {
    ...typography.bodySmall,
  },
  fieldInput: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.bodyMedium,
  },
  multiline: {
    minHeight: 88,
    paddingTop: spacing.md,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pickerText: {
    ...typography.bodyMedium,
    flex: 1,
  },
  colDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    maxHeight: '75%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  modalTitle: {
    ...typography.titleMedium,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  collectionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  newColForm: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  newColColorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  newColSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newColInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  newColInput: {
    ...typography.bodyMedium,
    paddingVertical: spacing.sm,
    flex: 1,
  },
  newColCreateBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
})
