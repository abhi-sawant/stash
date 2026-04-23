import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAppColorScheme } from '@/hooks/use-app-color-scheme'
import { useAuth } from '../../lib/auth-context'
import { createLocalBackup, restoreFromBackup, saveBackupToDownloads } from '../../lib/backup'
import { useBookmarks } from '../../lib/context'
import { fetchAndMerge, getLastSyncTime, uploadBackup, uploadData } from '../../lib/sync'
import { getColors, radius, spacing, typography } from '../../lib/theme'
import { AppSettings } from '../../lib/types'

const THEME_OPTIONS: { label: string; value: AppSettings['themePreference']; icon: string }[] = [
  { label: 'Light', value: 'light', icon: 'sunny-outline' },
  { label: 'Dark', value: 'dark', icon: 'moon-outline' },
  { label: 'System', value: 'system', icon: 'phone-portrait-outline' },
]

export default function SettingsScreen() {
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)
  const { settings, updateSettings, bookmarks, collections, restore } = useBookmarks()
  const { user, logout } = useAuth()
  const router = useRouter()
  const [backupLoading, setBackupLoading] = useState(false)
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [lastSyncLabel, setLastSyncLabel] = useState<string | null>(null)

  // Load the last sync time on mount
  React.useEffect(() => {
    getLastSyncTime().then((ts) => {
      if (ts) setLastSyncLabel(new Date(ts).toLocaleString())
    })
  }, [])

  const handleSyncNow = async () => {
    setSyncLoading(true)
    try {
      const local = { bookmarks, collections, settings }
      const result = await fetchAndMerge(local)
      if (result) {
        restore(result.merged)
        await uploadData(result.merged)
      } else {
        // Already up to date with server — just upload local data
        await uploadBackup()
      }
      const ts = await getLastSyncTime()
      if (ts) setLastSyncLabel(new Date(ts).toLocaleString())
      Alert.alert('Synced', 'Your bookmarks have been synced with the cloud.')
    } catch (e: any) {
      Alert.alert('Sync Failed', e.message ?? 'Could not connect to the server.')
    } finally {
      setSyncLoading(false)
    }
  }

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ])
  }

  const handleBackup = () => {
    Alert.alert('Export Backup', 'Choose how to export your backup file.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Save to Downloads',
        onPress: async () => {
          setBackupLoading(true)
          try {
            await saveBackupToDownloads()
            const location =
              Platform.OS === 'android'
                ? 'your Downloads folder'
                : 'the app folder in the Files app (On My iPhone → Stash)'
            Alert.alert('Saved', `Backup saved to ${location}.`)
          } catch (e: any) {
            Alert.alert('Export Failed', e.message ?? 'Something went wrong')
          } finally {
            setBackupLoading(false)
          }
        },
      },
      {
        text: 'Share',
        onPress: async () => {
          setBackupLoading(true)
          try {
            await createLocalBackup()
          } catch (e: any) {
            Alert.alert('Export Failed', e.message ?? 'Something went wrong')
          } finally {
            setBackupLoading(false)
          }
        },
      },
    ])
  }

  const handleRestore = () => {
    Alert.alert(
      'Restore Backup',
      'This will replace all your current bookmarks and collections with the backup data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setRestoreLoading(true)
            try {
              await restoreFromBackup()
              Alert.alert('Restored', 'Your backup has been restored successfully.')
            } catch (e: any) {
              Alert.alert('Restore Failed', e.message ?? 'Invalid or corrupted backup file')
            } finally {
              setRestoreLoading(false)
            }
          },
        },
      ],
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.pageHeader}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Settings</Text>
        </View>

        {/* Account */}
        <SectionHeader title='Account' colors={colors} />
        {user ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            {/* Logged-in user info */}
            <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.divider }]}>
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: colors.primaryContainer }]}>
                  <Ionicons name='person-outline' size={18} color={colors.primary} />
                </View>
                <View style={styles.labelGroup}>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>{user.email}</Text>
                  <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                    {lastSyncLabel ? `Last synced: ${lastSyncLabel}` : 'Not synced yet'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Sync Now */}
            <TouchableOpacity
              style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.divider }]}
              onPress={handleSyncNow}
              disabled={syncLoading}>
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: '#DBEAFE' }]}>
                  {syncLoading ? (
                    <ActivityIndicator size='small' color='#2563EB' />
                  ) : (
                    <Ionicons name='cloud-upload-outline' size={18} color='#2563EB' />
                  )}
                </View>
                <View style={styles.labelGroup}>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>Sync Now</Text>
                  <Text style={[styles.rowSub, { color: colors.textSecondary }]}>Upload a backup to the cloud</Text>
                </View>
              </View>
              <Ionicons name='chevron-forward' size={18} color={colors.textTertiary} />
            </TouchableOpacity>

            {/* Sign Out */}
            <TouchableOpacity style={styles.row} onPress={handleLogout}>
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: colors.errorContainer }]}>
                  <Ionicons name='log-out-outline' size={18} color={colors.error} />
                </View>
                <Text style={[styles.rowLabel, { color: colors.error }]}>Sign Out</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.divider }]}>
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: colors.primaryContainer }]}>
                  <Ionicons name='cloud-outline' size={18} color={colors.primary} />
                </View>
                <View style={styles.labelGroup}>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>Cloud Backup</Text>
                  <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                    Sign in to back up automatically every day
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.divider }]}
              onPress={() => router.push('/auth/login')}
              activeOpacity={0.75}>
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: colors.primaryContainer }]}>
                  <Ionicons name='log-in-outline' size={18} color={colors.primary} />
                </View>
                <Text style={[styles.rowLabel, { color: colors.primary }]}>Sign In</Text>
              </View>
              <Ionicons name='chevron-forward' size={18} color={colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.row} onPress={() => router.push('/auth/register')} activeOpacity={0.75}>
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: colors.primaryContainer }]}>
                  <Ionicons name='person-add-outline' size={18} color={colors.primary} />
                </View>
                <Text style={[styles.rowLabel, { color: colors.primary }]}>Create Account</Text>
              </View>
              <Ionicons name='chevron-forward' size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Appearance */}
        <SectionHeader title='Appearance' colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {THEME_OPTIONS.map((opt, i) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.row,
                i < THEME_OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider },
              ]}
              onPress={() => updateSettings({ themePreference: opt.value })}>
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: colors.primaryContainer }]}>
                  <Ionicons name={opt.icon as any} size={18} color={colors.primary} />
                </View>
                <Text style={[styles.rowLabel, { color: colors.text }]}>{opt.label}</Text>
              </View>
              {settings.themePreference === opt.value && (
                <Ionicons name='checkmark-circle' size={22} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Backup & Restore */}
        <SectionHeader title='Backup & Restore' colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {/* Stats */}
          <View style={[styles.statsRow, { borderBottomColor: colors.divider, borderBottomWidth: 1 }]}>
            <StatItem label='Bookmarks' value={bookmarks.length} colors={colors} />
            <StatItem label='Collections' value={collections.length} colors={colors} />
          </View>

          <TouchableOpacity
            style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.divider }]}
            onPress={handleBackup}
            disabled={backupLoading}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: '#DCFCE7' }]}>
                {backupLoading ? (
                  <ActivityIndicator size='small' color='#16A34A' />
                ) : (
                  <Ionicons name='cloud-download-outline' size={18} color='#16A34A' />
                )}
              </View>
              <View style={styles.labelGroup}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>Export Backup</Text>
                <Text style={[styles.rowSub, { color: colors.textSecondary }]}>Save all bookmarks as a JSON file</Text>
              </View>
            </View>
            <Ionicons name='chevron-forward' size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={handleRestore} disabled={restoreLoading}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: '#FEF3C7' }]}>
                {restoreLoading ? (
                  <ActivityIndicator size='small' color='#D97706' />
                ) : (
                  <Ionicons name='cloud-upload-outline' size={18} color='#D97706' />
                )}
              </View>
              <View style={styles.labelGroup}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>Restore Backup</Text>
                <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                  Import bookmarks from a backup file
                </Text>
              </View>
            </View>
            <Ionicons name='chevron-forward' size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* About */}
        <SectionHeader title='About' colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.aboutRow}>
            <View style={[styles.appIconBox, { backgroundColor: colors.primaryContainer }]}>
              <Ionicons name='bookmark' size={32} color={colors.primary} />
            </View>
            <View style={styles.aboutText}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Stash</Text>
              <Text style={[styles.rowSub, { color: colors.textSecondary }]}>Version 1.0.0</Text>
              <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                A modern, easy-to-use bookmark manager
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function SectionHeader({ title, colors }: { title: string; colors: ReturnType<typeof getColors> }) {
  return <Text style={[sectionStyles.header, { color: colors.primary }]}>{title.toUpperCase()}</Text>
}

function StatItem({ label, value, colors }: { label: string; value: number; colors: ReturnType<typeof getColors> }) {
  return (
    <View style={sectionStyles.statItem}>
      <Text style={[sectionStyles.statValue, { color: colors.primary }]}>{value}</Text>
      <Text style={[sectionStyles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  )
}

const sectionStyles = StyleSheet.create({
  header: {
    ...typography.labelSmall,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    letterSpacing: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statValue: {
    ...typography.headlineLarge,
  },
  statLabel: {
    ...typography.bodySmall,
  },
})

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 40 },
  pageHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  pageTitle: {
    ...typography.headlineLarge,
  },
  card: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  labelGroup: {
    flex: 1,
  },
  rowLabel: {
    ...typography.titleSmall,
  },
  rowSub: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
  },
  aboutRow: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  appIconBox: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutText: {
    flex: 1,
    gap: 4,
  },
})
