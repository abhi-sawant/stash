import { useAppColorScheme } from '@/hooks/use-app-color-scheme'
import { UpdateInfo } from '@/hooks/use-update-checker'
import { getColors, radius, spacing, typography } from '@/lib/theme'
import { Ionicons } from '@expo/vector-icons'
import { cacheDirectory, createDownloadResumable, getContentUriAsync } from 'expo-file-system/legacy'
import * as IntentLauncher from 'expo-intent-launcher'
import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

interface Props {
  updateInfo: UpdateInfo
  onDismiss: () => void
  onSkipVersion: () => void
}

export default function UpdatePrompt({ updateInfo, onDismiss, onSkipVersion }: Props) {
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleDownload = useCallback(async () => {
    if (Platform.OS !== 'android') return
    setDownloading(true)
    setProgress(0)

    const destPath = `${cacheDirectory}stash-${updateInfo.latestVersion}.apk`

    try {
      const downloadResumable = createDownloadResumable(updateInfo.downloadUrl, destPath, {}, (downloadProgress) => {
        const pct =
          downloadProgress.totalBytesExpectedToWrite > 0
            ? downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite
            : 0
        setProgress(pct)
      })

      const result = await downloadResumable.downloadAsync()
      if (!result) throw new Error('Download failed')

      // Convert file:// URI to a content:// URI for Android 7+ compatibility
      const contentUri = await getContentUriAsync(result.uri)

      // Trigger Android package installer
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        type: 'application/vnd.android.package-archive',
      })
      onDismiss()
    } catch {
      Alert.alert('Download Failed', 'Could not download the update. Please try again later.')
    } finally {
      setDownloading(false)
      setProgress(0)
    }
  }, [updateInfo, onDismiss])

  const progressPct = Math.round(progress * 100)

  return (
    <Modal visible transparent animationType='fade' onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primaryContainer }]}>
              <Ionicons name='arrow-up-circle' size={28} color={colors.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={[typography.headlineSmall, { color: colors.text }]}>Update Available</Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
                Version {updateInfo.latestVersion}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onDismiss}
              activeOpacity={0.75}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name='close' size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Release notes */}
          {updateInfo.releaseNotes ? (
            <ScrollView
              style={[styles.notesScroll, { borderColor: colors.border }]}
              showsVerticalScrollIndicator={false}>
              <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>{updateInfo.releaseNotes}</Text>
            </ScrollView>
          ) : null}

          {/* Progress bar */}
          {downloading && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progressPct}%` }]} />
              </View>
              <Text style={[typography.labelSmall, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                {progressPct > 0 ? `Downloading… ${progressPct}%` : 'Starting download…'}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btnSecondary, { borderColor: colors.border }]}
              onPress={onSkipVersion}
              activeOpacity={0.75}
              disabled={downloading}>
              <Text style={[typography.labelMedium, { color: colors.textSecondary }]}>Skip this version</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnPrimary, { backgroundColor: colors.primary, opacity: downloading ? 0.7 : 1 }]}
              onPress={handleDownload}
              activeOpacity={0.75}
              disabled={downloading}>
              {downloading ? (
                <ActivityIndicator size='small' color={colors.textOnPrimary} />
              ) : (
                <Ionicons name='download-outline' size={18} color={colors.textOnPrimary} />
              )}
              <Text style={[typography.labelMedium, { color: colors.textOnPrimary, marginLeft: spacing.xs }]}>
                {downloading ? 'Downloading…' : 'Download & Install'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  notesScroll: {
    maxHeight: 160,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  progressContainer: {
    gap: 2,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  btnSecondary: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    flex: 2,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
