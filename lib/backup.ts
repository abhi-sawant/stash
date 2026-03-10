import * as DocumentPicker from 'expo-document-picker'
import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { exportAllData, importAllData } from './storage'

function getBackupFilename() {
  return `stash-backup-${new Date().toISOString().split('T')[0]}.json`
}

export async function createLocalBackup(): Promise<void> {
  const data = await exportAllData()
  const json = JSON.stringify(data, null, 2)
  const file = new File(Paths.cache, getBackupFilename())
  file.write(json)
  const isAvailable = await Sharing.isAvailableAsync()
  if (!isAvailable) throw new Error('Sharing is not available on this device')
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Save Backup',
    UTI: 'public.json',
  })
}

export async function saveBackupToDownloads(): Promise<string> {
  const data = await exportAllData()
  const json = JSON.stringify(data, null, 2)
  const filename = getBackupFilename()
  // Paths.downloads is only defined on Android; fall back to Paths.document
  // on iOS (visible in Files → On My iPhone → <app name>).
  const dir = Paths.downloads ?? Paths.document
  if (!dir) throw new Error('No writable downloads directory found on this device')
  const file = new File(dir, filename)
  file.write(json)
  return file.uri
}

export async function restoreFromBackup(): Promise<void> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  })
  if (result.canceled) return
  const fileAsset = result.assets[0]
  const file = new File(fileAsset.uri)
  const json = await file.text()
  const data = JSON.parse(json)
  await importAllData(data)
}
