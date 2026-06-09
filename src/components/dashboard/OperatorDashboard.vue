<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import {
  BadgeCheck,
  KeyRound,
  ShieldCheck,
  UserCog,
  UserRoundCheck,
  RefreshCw,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { getUsers, type UserResponseItem } from '@/api/users/users'
import { getRoles, type RoleListItem } from '@/api/roles/roles'
import { getPermissions } from '@/api/permissions/permissions'
import {
  listForgotPasswordRequestsApi,
  type PasswordResetRequestItem,
} from '@/api/auth/auth'
import type { PermissionsResponseItem } from '@/schemas/permissions/response'

const isLoading = ref(false)
const users = ref<UserResponseItem[]>([])
const usersCount = ref(0)
const roles = ref<RoleListItem[]>([])
const rolesCount = ref(0)
const permissions = ref<PermissionsResponseItem[]>([])
const permissionsCount = ref(0)
const passwordResetRequests = ref<PasswordResetRequestItem[]>([])

const fetchDashboardData = async () => {
  isLoading.value = true
  try {
    const [userResult, roleResult, permissionResult, resetResult] = await Promise.all([
      getUsers({
        page: 1,
        pageSize: 200,
        search: '',
        sortBy: 'created_at',
        sortDesc: true,
      }),
      getRoles({
        page: 1,
        pageSize: 200,
        search: '',
        sortBy: 'created_at',
        sortDesc: true,
      }),
      getPermissions({
        page: 1,
        pageSize: 200,
        search: '',
        sortBy: 'created_at',
        sortDesc: true,
      }),
      listForgotPasswordRequestsApi(),
    ])

    users.value = userResult.results
    usersCount.value = userResult.count
    roles.value = roleResult.results
    rolesCount.value = roleResult.count
    permissions.value = permissionResult.results
    permissionsCount.value = permissionResult.count
    passwordResetRequests.value = resetResult
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Gagal memuat overview operator')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})

const pendingUsers = computed(() =>
  users.value.filter((item) => item.status?.toLowerCase() === 'pending')
)

const pendingPasswordResets = computed(() =>
  passwordResetRequests.value.filter((item) => item.status?.toLowerCase() === 'pending')
)

const latestPendingUsers = computed(() => pendingUsers.value.slice(0, 5))
const latestPendingPasswordResets = computed(() => pendingPasswordResets.value.slice(0, 5))

const stats = computed(() => [
  {
    title: 'Total Pengguna',
    value: usersCount.value.toLocaleString(),
    description: 'Akun yang saat ini terdaftar di sistem.',
    icon: UserCog,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
  },
  {
    title: 'User Menunggu Approval',
    value: pendingUsers.value.length.toLocaleString(),
    description: 'Akun baru yang masih perlu ditinjau operator.',
    icon: UserRoundCheck,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
  },
  {
    title: 'Reset Password Pending',
    value: pendingPasswordResets.value.length.toLocaleString(),
    description: 'Permintaan reset password yang belum diproses.',
    icon: KeyRound,
    color: 'text-rose-700',
    bg: 'bg-rose-50',
  },
  {
    title: 'Role Aktif',
    value: rolesCount.value.toLocaleString(),
    description: 'Struktur role yang sedang dipakai sistem.',
    icon: ShieldCheck,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
  },
  {
    title: 'Hak Akses Terdaftar',
    value: permissionsCount.value.toLocaleString(),
    description: 'Total permission yang dikelola operator.',
    icon: BadgeCheck,
    color: 'text-violet-700',
    bg: 'bg-violet-50',
  },
])
</script>

<template>
  <div class="mt-8 space-y-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div class="flex flex-col gap-2">
      <h2 class="flex items-center gap-2 text-xl font-bold text-slate-800">
        <ShieldCheck class="h-6 w-6 text-sky-700" />
        Overview Operasional Operator
      </h2>
      <p class="max-w-3xl text-sm text-slate-500">
        Fokus dashboard operator adalah provisioning akun, approval user, pengelolaan role, dan pemrosesan reset password.
      </p>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      <div
        v-for="stat in stats"
        :key="stat.title"
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-medium text-slate-500">{{ stat.title }}</p>
            <h3 class="mt-2 text-3xl font-bold text-slate-900">{{ stat.value }}</h3>
          </div>
          <div :class="['rounded-xl p-3', stat.bg, stat.color]">
            <component :is="stat.icon" class="h-6 w-6" />
          </div>
        </div>
        <p class="mt-3 text-xs leading-5 text-slate-500">{{ stat.description }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-semibold text-slate-900">Tindak Lanjut Prioritas</h3>
            <p class="mt-1 text-sm text-slate-500">Daftar item yang paling sering menjadi pekerjaan operator harian.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            class="border-slate-200"
            :disabled="isLoading"
            @click="fetchDashboardData"
          >
            <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': isLoading }" />
            Refresh
          </Button>
        </div>

        <div class="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div class="rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-semibold text-amber-900">User Menunggu Approval</h4>
              <span class="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-amber-700">
                {{ pendingUsers.length }} pending
              </span>
            </div>

            <div v-if="latestPendingUsers.length > 0" class="mt-4 space-y-3">
              <div
                v-for="item in latestPendingUsers"
                :key="item.id_user"
                class="rounded-xl border border-amber-100 bg-white/80 p-3"
              >
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="font-medium text-slate-900">{{ item.username }}</p>
                    <p class="text-xs text-slate-500">{{ item.nama_role || 'Role belum ditentukan' }}</p>
                  </div>
                  <span class="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                    {{ item.status }}
                  </span>
                </div>
              </div>
            </div>

            <p v-else class="mt-4 rounded-xl border border-dashed border-amber-200 bg-white/80 px-4 py-6 text-sm text-slate-500">
              Tidak ada user yang menunggu approval saat ini.
            </p>
          </div>

          <div class="rounded-2xl border border-rose-100 bg-rose-50/70 p-5">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-semibold text-rose-900">Reset Password Pending</h4>
              <span class="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-rose-700">
                {{ pendingPasswordResets.length }} pending
              </span>
            </div>

            <div v-if="latestPendingPasswordResets.length > 0" class="mt-4 space-y-3">
              <div
                v-for="item in latestPendingPasswordResets"
                :key="item.id_password_reset_request"
                class="rounded-xl border border-rose-100 bg-white/80 p-3"
              >
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="font-medium text-slate-900">{{ item.username }}</p>
                    <p class="text-xs text-slate-500">{{ item.nama_role }}</p>
                  </div>
                  <span class="rounded-full bg-rose-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-800">
                    {{ item.status }}
                  </span>
                </div>
                <p class="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{{ item.reason || 'Tanpa catatan alasan.' }}</p>
              </div>
            </div>

            <p v-else class="mt-4 rounded-xl border border-dashed border-rose-200 bg-white/80 px-4 py-6 text-sm text-slate-500">
              Belum ada permintaan reset password yang menunggu diproses.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
