import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { useCallback, useEffect, useState } from 'react'
import { Platform } from 'react-native'

const GITHUB_OWNER = 'abhi-sawant'
const GITHUB_REPO = 'stash'
const DISMISSED_VERSION_KEY = 'update_dismissed_version'

export interface UpdateInfo {
  latestVersion: string
  downloadUrl: string
  releaseNotes: string
  releaseName: string
}

/** Compares two semver strings (major.minor.patch). Returns true if b > a. */
function isNewer(current: string, latest: string): boolean {
  const parse = (v: string) =>
    v
      .replace(/^v/, '')
      .split('.')
      .map((n) => parseInt(n, 10) || 0)
  const [cMaj, cMin, cPatch] = parse(current)
  const [lMaj, lMin, lPatch] = parse(latest)
  if (lMaj !== cMaj) return lMaj > cMaj
  if (lMin !== cMin) return lMin > cMin
  return lPatch > cPatch
}

export function useUpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)

  const checkForUpdate = useCallback(async () => {
    // Only check on Android — iOS distributes through the App Store
    if (Platform.OS !== 'android') return

    try {
      const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`, {
        headers: { Accept: 'application/vnd.github+json' },
      })
      if (!response.ok) return

      const release = await response.json()
      const tagName: string = release.tag_name ?? ''
      const latestVersion = tagName.replace(/^v/, '')
      const currentVersion = Constants.expoConfig?.version ?? '0.0.0'

      if (!isNewer(currentVersion, latestVersion)) return

      // Skip if the user already dismissed this specific version
      const dismissedVersion = await AsyncStorage.getItem(DISMISSED_VERSION_KEY)
      if (dismissedVersion === latestVersion) return

      // Find the APK asset
      const apkAsset = (release.assets as { name: string; browser_download_url: string }[]).find((a) =>
        a.name.endsWith('.apk'),
      )
      if (!apkAsset) return

      setUpdateInfo({
        latestVersion,
        downloadUrl: apkAsset.browser_download_url,
        releaseName: release.name || tagName,
        releaseNotes: release.body || '',
      })
    } catch {
      // Silently ignore network errors — update check is best-effort
    }
  }, [])

  useEffect(() => {
    checkForUpdate()
  }, [checkForUpdate])

  const dismissUpdate = useCallback(async (version: string) => {
    await AsyncStorage.setItem(DISMISSED_VERSION_KEY, version)
    setUpdateInfo(null)
  }, [])

  const clearUpdateInfo = useCallback(() => setUpdateInfo(null), [])

  return { updateInfo, dismissUpdate, clearUpdateInfo }
}
