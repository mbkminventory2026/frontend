<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from '@tanstack/vue-router'
import { toast } from 'vue-sonner'
import { changePasswordApi } from '@/api/auth/auth'
import { useAuthStore } from '@/store/authStore'

const router = useRouter()
const authStore = useAuthStore()

const currentPassword = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')
const isSubmitting = ref(false)

const submit = async () => {
  if (!currentPassword.value || !newPassword.value || !confirmNewPassword.value) {
    toast.error('Semua field password wajib diisi')
    return
  }

  isSubmitting.value = true
  try {
    const response = await changePasswordApi({
      current_password: currentPassword.value,
      new_password: newPassword.value,
      confirm_new_password: confirmNewPassword.value,
    })

    authStore.login(response.access_token, {
      username: authStore.user?.username || 'User',
      role: response.role_name,
      mustChangePassword: response.must_change_password,
    })

    toast.success('Password berhasil diperbarui')
    router.navigate({ to: '/dashboard' as any })
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Gagal mengganti password')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-lg py-10">
    <div class="rounded-xl border bg-white p-8 shadow-sm">
      <div class="mb-6">
        <h1 class="text-2xl font-semibold text-slate-900">Ganti Password</h1>
        <p class="mt-2 text-sm text-slate-500">
          Anda wajib mengganti password sebelum melanjutkan penggunaan aplikasi.
        </p>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-700">Password Saat Ini</label>
          <input v-model="currentPassword" type="password" class="w-full rounded-md border px-3 py-2 text-sm" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-700">Password Baru</label>
          <input v-model="newPassword" type="password" class="w-full rounded-md border px-3 py-2 text-sm" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-700">Konfirmasi Password Baru</label>
          <input v-model="confirmNewPassword" type="password" class="w-full rounded-md border px-3 py-2 text-sm" />
        </div>

        <button
          type="submit"
          class="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Menyimpan...' : 'Simpan Password Baru' }}
        </button>
      </form>
    </div>
  </div>
</template>
