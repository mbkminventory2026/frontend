<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from '@tanstack/vue-router'
import { toast } from 'vue-sonner'
import { createForgotPasswordRequestApi } from '@/api/auth/auth'

const router = useRouter()
const username = ref('')
const reason = ref('')
const isSubmitting = ref(false)

const submit = async () => {
  if (!username.value.trim()) {
    toast.error('Username wajib diisi')
    return
  }

  isSubmitting.value = true
  try {
    await createForgotPasswordRequestApi({
      username: username.value.trim(),
      reason: reason.value.trim(),
    })
    toast.success('Permintaan reset password berhasil dikirim')
    router.navigate({ to: '/login' as any })
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Gagal mengirim permintaan reset password')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="grid min-h-svh lg:grid-cols-2">
    <div class="flex items-center justify-center">
      <div class="w-full max-w-md rounded-lg border bg-white p-8 shadow-sm">
        <div class="mb-8 text-center">
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">Lupa Password</h1>
          <p class="mt-2 text-sm text-slate-500">Kirim permintaan reset password ke operator.</p>
        </div>

        <form class="space-y-4" @submit.prevent="submit">
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Username</label>
            <input
              v-model="username"
              type="text"
              class="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Masukkan username Anda"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Alasan</label>
            <textarea
              v-model="reason"
              class="min-h-28 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Contoh: lupa password saat login"
            />
          </div>

          <button
            type="submit"
            class="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? 'Mengirim...' : 'Kirim Permintaan' }}
          </button>
        </form>

        <div class="mt-4 text-center text-sm">
          <a href="/login" class="text-indigo-600 hover:text-indigo-700">Kembali ke login</a>
        </div>
      </div>
    </div>
    <div class="hidden bg-slate-100 lg:block" />
  </div>
</template>
