<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import {
  approveForgotPasswordRequestApi,
  listForgotPasswordRequestsApi,
  rejectForgotPasswordRequestApi,
  type PasswordResetRequestItem,
} from '@/api/auth/auth'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CopyIcon, CheckIcon, KeyRoundIcon, AlertTriangleIcon } from 'lucide-vue-next'

const items = ref<PasswordResetRequestItem[]>([])
const isLoading = ref(false)

// Temporary password display modal state
const generatedTempPassword = ref('')
const generatedTempUsername = ref('')
const isTempPasswordModalOpen = ref(false)
const isCopied = ref(false)

const fetchItems = async () => {
  isLoading.value = true
  try {
    items.value = await listForgotPasswordRequestsApi()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Gagal memuat permintaan reset password')
  } finally {
    isLoading.value = false
  }
}

const approve = async (item: PasswordResetRequestItem) => {
  try {
    const result = await approveForgotPasswordRequestApi(item.id_password_reset_request)
    generatedTempPassword.value = result.temporary_password
    generatedTempUsername.value = item.username
    isTempPasswordModalOpen.value = true
    isCopied.value = false
    
    toast.success('Permintaan reset password disetujui')
    await fetchItems()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Gagal menyetujui permintaan reset password')
  }
}

const reject = async (item: PasswordResetRequestItem) => {
  const rejectedReason = window.prompt(`Alasan penolakan untuk ${item.username}:`, item.rejected_reason || '')
  if (rejectedReason === null) return

  try {
    await rejectForgotPasswordRequestApi(item.id_password_reset_request, rejectedReason)
    toast.success('Permintaan reset password ditolak')
    await fetchItems()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Gagal menolak permintaan reset password')
  }
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(generatedTempPassword.value)
    isCopied.value = true
    toast.success('Password berhasil disalin!')
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    toast.error('Gagal menyalin password ke clipboard')
  }
}

onMounted(fetchItems)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-slate-900">Permintaan Reset Password</h1>
      <p class="mt-1 text-sm text-slate-500">Admin sistem meninjau dan memproses permintaan reset password di halaman ini.</p>
    </div>

    <div class="overflow-hidden rounded-xl border bg-white shadow-sm">
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50">
          <tr>
            <th class="px-4 py-3 text-left font-medium text-slate-600">User</th>
            <th class="px-4 py-3 text-left font-medium text-slate-600">Role</th>
            <th class="px-4 py-3 text-left font-medium text-slate-600">Status</th>
            <th class="px-4 py-3 text-left font-medium text-slate-600">Requested At</th>
            <th class="px-4 py-3 text-left font-medium text-slate-600">Reason</th>
            <th class="px-4 py-3 text-left font-medium text-slate-600">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="isLoading">
            <td colspan="6" class="px-4 py-6 text-center text-slate-500">Memuat data...</td>
          </tr>
          <tr v-else-if="items.length === 0">
            <td colspan="6" class="px-4 py-6 text-center text-slate-500">Belum ada permintaan reset password.</td>
          </tr>
          <tr v-for="item in items" :key="item.id_password_reset_request">
            <td class="px-4 py-3">
              <div class="font-medium text-slate-800">{{ item.username }}</div>
              <div class="text-xs text-slate-500">ID User: {{ item.id_user }}</div>
            </td>
            <td class="px-4 py-3">{{ item.nama_role }}</td>
            <td class="px-4 py-3">
              <span class="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium uppercase text-slate-700">
                {{ item.status }}
              </span>
            </td>
            <td class="px-4 py-3">{{ item.requested_at || '-' }}</td>
            <td class="px-4 py-3 max-w-sm whitespace-pre-wrap">{{ item.reason || '-' }}</td>
            <td class="px-4 py-3">
              <div v-if="item.status === 'pending'" class="flex gap-2">
                <button class="rounded-md border border-green-600 px-3 py-1.5 text-green-700 hover:bg-green-50" @click="approve(item)">
                  Setujui
                </button>
                <button class="rounded-md border border-red-600 px-3 py-1.5 text-red-700 hover:bg-red-50" @click="reject(item)">
                  Tolak
                </button>
              </div>
              <span v-else class="text-xs text-slate-500">Selesai diproses</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Generated Temporary Password Modal -->
    <Dialog :open="isTempPasswordModalOpen" @update:open="isTempPasswordModalOpen = $event">
      <DialogContent class="sm:max-w-md bg-white border border-slate-200 shadow-xl rounded-xl p-6">
        <DialogHeader class="flex flex-col items-center text-center space-y-2">
          <div class="bg-amber-50 p-3 rounded-full border border-amber-200">
            <KeyRoundIcon class="w-8 h-8 text-amber-600 animate-pulse" />
          </div>
          <DialogTitle class="text-xl font-bold text-slate-900">Password Sementara Dibuat</DialogTitle>
          <DialogDescription class="text-xs text-slate-500">
            Kredensial baru untuk pengguna <strong>{{ generatedTempUsername }}</strong> berhasil dibuat.
          </DialogDescription>
        </DialogHeader>

        <div class="mt-4 space-y-4">
          <!-- Password display box -->
          <div class="flex items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-base font-bold text-slate-800">
            <span class="select-all tracking-wide break-all">{{ generatedTempPassword }}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              class="flex-shrink-0 border-slate-300 hover:bg-slate-100"
              @click="copyToClipboard"
            >
              <component :is="isCopied ? CheckIcon : CopyIcon" class="w-4 h-4 mr-1.5" :class="isCopied ? 'text-green-600' : 'text-slate-600'" />
              {{ isCopied ? 'Disalin' : 'Salin' }}
            </Button>
          </div>

          <!-- Alert box -->
          <div class="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-100 rounded-lg text-amber-800">
            <AlertTriangleIcon class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div class="text-xs space-y-1">
              <p class="font-bold">Perhatian Penting:</p>
              <p class="leading-relaxed">Salin dan bagikan password ini secara aman kepada pengguna. Password ini <strong>hanya muncul satu kali ini saja</strong> dan tidak dapat dilihat kembali setelah menutup dialog.</p>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end">
          <Button
            type="button"
            class="bg-slate-900 text-white hover:bg-slate-800 font-semibold px-6"
            @click="isTempPasswordModalOpen = false"
          >
            Selesai & Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
