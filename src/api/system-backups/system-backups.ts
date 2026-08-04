import { apiClient } from '@/lib/apiClient'
import { backupIdSchema, backupListSchema, backupStartSchema, backupStatusSchema, type BackupList, type BackupStatus } from '@/schemas/system-backups'

const backupPath = '/api/v1/system/backups'

export async function getSystemBackupStatus(): Promise<BackupStatus> {
  const response = await apiClient.get(backupPath + '/status')
  return backupStatusSchema.parse(response.data)
}

export async function startSystemBackup() {
  const response = await apiClient.post(backupPath)
  return backupStartSchema.parse(response.data)
}

export async function getSystemBackups(params: { page: number; pageSize: number }): Promise<BackupList> {
  const response = await apiClient.get(backupPath, { params })
  return backupListSchema.parse(response.data)
}

function safeDownloadFilename(header: string | undefined, backupId: string) {
  const fallback = `${backupId}.tar.gz.gpg`
  const match = header?.match(/filename="?([^";]+)"?/i)
  const candidate = match?.[1]?.trim()
  if (!candidate || /[\\/\x00-\x1f\x7f]/.test(candidate) || !candidate.endsWith('.tar.gz.gpg')) return fallback
  return candidate
}

export async function downloadSystemBackup(backupId: string): Promise<{ blob: Blob; filename: string }> {
  backupIdSchema.parse(backupId)
  const response = await apiClient.get<Blob>(`${backupPath}/${backupId}/download`, { responseType: 'blob' })
  return {
    blob: response.data,
    filename: safeDownloadFilename(response.headers['content-disposition'], backupId),
  }
}
