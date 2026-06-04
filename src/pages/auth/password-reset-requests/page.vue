<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import {
  approveForgotPasswordRequestApi,
  listForgotPasswordRequestsApi,
  rejectForgotPasswordRequestApi,
  type PasswordResetRequestItem,
} from '@/api/auth/auth'

const items = ref<PasswordResetRequestItem[]>([])
const isLoading = ref(false)

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
    toast.success('Permintaan reset password disetujui', {
      description: `Password sementara untuk ${item.username}: ${result.temporary_password}`,
      duration: 15000,
    })
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

onMounted(fetchItems)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-slate-900">Permintaan Reset Password</h1>
      <p class="mt-1 text-sm text-slate-500">Operator meninjau dan memproses permintaan reset password di halaman ini.</p>
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
  </div>
</template>
