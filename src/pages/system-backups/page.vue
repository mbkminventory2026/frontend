<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useNavigate, useSearch } from '@tanstack/vue-router'
import { DownloadIcon, LoaderCircleIcon, PlusIcon, RefreshCcwIcon } from 'lucide-vue-next'
import { isAxiosError } from 'axios'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usePermission } from '@/composables/usePermission'
import { downloadSystemBackup, getSystemBackups, getSystemBackupStatus, startSystemBackup } from '@/api/system-backups/system-backups'
import type { BackupList, BackupStatus, BackupSummary } from '@/schemas/system-backups'
import { stripSystemBackupsDefaults } from './schema'

const search = useSearch({ strict: false }) as { value: { page?: number; pageSize?: number } }
const navigate = useNavigate()
const { hasPermission } = usePermission()
const status = ref<BackupStatus>()
const history = ref<BackupList>()
const statusLoading = ref(true)
const historyLoading = ref(true)
const statusError = ref(false)
const historyError = ref(false)
const starting = ref(false)
const confirmOpen = ref(false)
const downloadingId = ref<string>()
let pollTimer: ReturnType<typeof setInterval> | undefined
let statusRequestActive = false

const canStart = computed(() => hasPermission('SYSTEM_BACKUP_CREATE'))
const canDownload = computed(() => hasPermission('SYSTEM_BACKUP_DOWNLOAD'))
const currentPage = computed(() => search.value.page ?? 1)
const pageSize = computed(() => search.value.pageSize ?? 20)
const isRunning = computed(() => status.value?.state === 'running')

const formatDateTime = (value?: string) => value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '-'
const formatSize = (bytes?: number) => bytes === undefined ? '-' : new Intl.NumberFormat('id-ID', { style: 'unit', unit: 'byte', unitDisplay: 'short', notation: bytes >= 1_000_000 ? 'compact' : 'standard' }).format(bytes)
const shortChecksum = (value: string) => `${value.slice(0, 12)}…${value.slice(-8)}`

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = undefined
}

function startPolling() {
  if (pollTimer || status.value?.state !== 'running') return
  pollTimer = setInterval(() => { void refreshStatus(true) }, 5_000)
}

async function refreshStatus(fromPoll = false) {
  if (statusRequestActive) return
  statusRequestActive = true
  if (!fromPoll) statusLoading.value = true
  const wasRunning = isRunning.value
  try {
    status.value = await getSystemBackupStatus()
    statusError.value = false
    if (status.value?.state === 'running') startPolling()
    else {
      stopPolling()
      if (wasRunning) await refreshHistory()
    }
  } catch {
    statusError.value = true
    if (!fromPoll) toast.error('Status backup gagal dimuat')
  } finally {
    statusLoading.value = false
    statusRequestActive = false
  }
}

async function refreshHistory() {
  historyLoading.value = true
  try {
    history.value = await getSystemBackups({ page: currentPage.value, pageSize: pageSize.value })
    historyError.value = false
  } catch {
    historyError.value = true
    toast.error('Riwayat backup gagal dimuat')
  } finally { historyLoading.value = false }
}

async function refreshAll() { await Promise.all([refreshStatus(), refreshHistory()]) }

async function confirmStart() {
  if (starting.value) return
  starting.value = true
  try {
    await startSystemBackup()
    confirmOpen.value = false
    toast.success('Backup terenkripsi sedang dimulai')
    await refreshStatus()
  } catch (error) {
    const code = isAxiosError(error) ? error.response?.status : undefined
    if (code === 409) { toast.error('Backup lain sedang berjalan'); await refreshStatus() }
    else if (code === 503) toast.error('Backup saat ini tidak tersedia atau belum dikonfigurasi')
    else if (code !== 403) toast.error('Backup gagal dimulai')
  } finally { starting.value = false }
}

async function downloadBackup(item: BackupSummary) {
  if (downloadingId.value || !item.download_available) return
  downloadingId.value = item.backup_id
  try {
    const { blob, filename } = await downloadSystemBackup(item.backup_id)
    const url = URL.createObjectURL(blob)
    try {
      const anchor = document.createElement('a')
      anchor.href = url; anchor.download = filename; anchor.style.display = 'none'
      document.body.appendChild(anchor)
      try { anchor.click() } finally { anchor.remove() }
    } finally { URL.revokeObjectURL(url) }
    toast.success('Backup terenkripsi berhasil diunduh')
  } catch (error) {
    const code = isAxiosError(error) ? error.response?.status : undefined
    if (code === 404) toast.error('Backup tidak lagi tersedia untuk diunduh')
    else if (code !== 403) toast.error('Backup gagal diunduh')
  } finally { downloadingId.value = undefined }
}

async function changePage(page: number) {
  await navigate({ to: '.', search: () => stripSystemBackupsDefaults({ page, pageSize: pageSize.value }) })
}

watch(() => [currentPage.value, pageSize.value], () => { void refreshHistory() })
onMounted(() => { void refreshAll() })
onBeforeUnmount(stopPolling)
</script>

<template>
  <div class="space-y-6 p-4 md:p-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div><h1 class="text-2xl font-bold text-slate-900">Manajemen Backup</h1><p class="mt-1 text-sm text-slate-500">Pantau dan kelola backup terenkripsi.</p></div>
      <div class="flex gap-2"><Button variant="outline" :disabled="statusLoading || historyLoading" @click="refreshAll"><RefreshCcwIcon class="mr-2 h-4 w-4" />Refresh</Button><Button v-if="canStart" :disabled="starting" @click="confirmOpen = true"><PlusIcon class="mr-2 h-4 w-4" />Mulai Backup</Button></div>
    </div>
    <Card><CardHeader><CardTitle>Status Backup</CardTitle><CardDescription>Status proses saat ini dan backup selesai terakhir.</CardDescription></CardHeader><CardContent>
      <div v-if="statusLoading" class="grid gap-4 md:grid-cols-3"><Skeleton class="h-16" /><Skeleton class="h-16" /><Skeleton class="h-16" /></div>
      <p v-else-if="statusError" class="text-sm text-destructive">Status backup tidak dapat dimuat.</p>
      <div v-else class="grid gap-4 text-sm md:grid-cols-3"><div><p class="text-muted-foreground">Status</p><p class="font-semibold capitalize">{{ status?.state === 'running' ? 'Sedang berjalan' : 'Siap' }}</p></div><div><p class="text-muted-foreground">Backup aktif</p><p class="font-medium">{{ status?.backup_id ?? '-' }}</p><p class="text-muted-foreground">{{ formatDateTime(status?.started_at) }}</p></div><div><p class="text-muted-foreground">Backup selesai terakhir</p><p class="font-medium">{{ status?.latest_completed_backup?.backup_id ?? '-' }}</p><p class="text-muted-foreground">{{ formatDateTime(status?.latest_completed_backup?.completed_at) }}</p></div><div v-if="status?.last_result"><p class="text-muted-foreground">Hasil proses terakhir</p><p class="font-medium capitalize">{{ status.last_result.state }}</p><p class="text-muted-foreground">{{ formatDateTime(status.last_result.finished_at) }}</p></div></div>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Riwayat Backup Selesai</CardTitle><CardDescription>Backup checksum-valid, diurutkan terbaru oleh server.</CardDescription></CardHeader><CardContent class="p-0">
      <div v-if="historyLoading" class="space-y-3 p-6"><Skeleton v-for="index in 4" :key="index" class="h-10 w-full" /></div>
      <p v-else-if="historyError" class="p-6 text-sm text-destructive">Riwayat backup tidak dapat dimuat. Status backup tetap tersedia.</p>
      <p v-else-if="!history?.items.length" class="p-6 text-sm text-muted-foreground">Belum ada backup selesai.</p>
      <template v-else><Table><TableHeader><TableRow><TableHead>Selesai</TableHead><TableHead>Ukuran paket terenkripsi</TableHead><TableHead>Checksum</TableHead><TableHead>Status unduhan</TableHead><TableHead v-if="canDownload" class="text-right">Aksi</TableHead></TableRow></TableHeader><TableBody><TableRow v-for="item in history.items" :key="item.backup_id"><TableCell>{{ formatDateTime(item.completed_at) }}</TableCell><TableCell>{{ formatSize(item.encrypted_size_bytes) }}</TableCell><TableCell><span :title="item.sha256">{{ shortChecksum(item.sha256) }}</span></TableCell><TableCell>{{ item.download_available ? 'Tersedia' : 'Tidak tersedia' }}</TableCell><TableCell v-if="canDownload" class="text-right"><Button v-if="item.download_available" size="sm" variant="outline" :disabled="downloadingId === item.backup_id" @click="downloadBackup(item)"><LoaderCircleIcon v-if="downloadingId === item.backup_id" class="mr-2 h-4 w-4 animate-spin" /><DownloadIcon v-else class="mr-2 h-4 w-4" />Unduh</Button></TableCell></TableRow></TableBody></Table></template>
      <div v-if="history && history.pagination.total_pages > 1" class="flex items-center justify-end gap-3 border-t p-4 text-sm"><span>Halaman {{ history.pagination.page }} dari {{ history.pagination.total_pages }}</span><Button size="sm" variant="outline" :disabled="history.pagination.page <= 1" @click="changePage(history.pagination.page - 1)">Sebelumnya</Button><Button size="sm" variant="outline" :disabled="history.pagination.page >= history.pagination.total_pages" @click="changePage(history.pagination.page + 1)">Berikutnya</Button></div>
    </CardContent></Card>
    <Dialog v-model:open="confirmOpen"><DialogContent><DialogHeader><DialogTitle>Mulai backup?</DialogTitle><DialogDescription>Backup manual terenkripsi akan segera dimulai.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" :disabled="starting" @click="confirmOpen = false">Batal</Button><Button :disabled="starting" @click="confirmStart">{{ starting ? 'Memulai…' : 'Mulai Backup' }}</Button></DialogFooter></DialogContent></Dialog>
  </div>
</template>
