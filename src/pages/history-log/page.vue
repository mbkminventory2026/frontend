<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue'
import { useNavigate, useSearch } from '@tanstack/vue-router'
import type { ColumnDef } from '@tanstack/vue-table'
import { EyeIcon, RefreshCcwIcon, SearchIcon } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

import DataTable from '@/components/DataTable.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getActivityLogById, getActivityLogs, type ActivityLogDetail, type ActivityLogListItem } from '@/api/activity-logs/activity-logs'
import { historyLogSchema, stripHistoryLogDefaults } from '@/pages/history-log/schema'
import { useTable } from '@/composables/useTable'

const search = useSearch({ strict: false }) as any
const navigate = useNavigate()

const rows = ref<ActivityLogListItem[]>([])
const totalCount = ref(0)
const isLoading = ref(false)

const selectedAction = ref('all')
const selectedModule = ref('all')
const selectedEntityType = ref('all')
const dateFrom = ref('')
const dateTo = ref('')

const isDetailOpen = ref(false)
const isDetailLoading = ref(false)
const selectedDetail = ref<ActivityLogDetail | null>(null)

const actionOptions = [
  { label: 'Semua Aksi', value: 'all' },
  { label: 'Create', value: 'CREATE' },
  { label: 'Update', value: 'UPDATE' },
  { label: 'Delete', value: 'DELETE' },
]

const moduleOptions = [
  { label: 'Semua Modul', value: 'all' },
  { label: 'User Management', value: 'user-management' },
  { label: 'Role Management', value: 'role-management' },
  { label: 'Master Data', value: 'master-data' },
]

const entityTypeOptions = [
  { label: 'Semua Entity', value: 'all' },
  { label: 'Users', value: 'users' },
  { label: 'Roles', value: 'roles' },
  { label: 'Permissions', value: 'hak_akses' },
  { label: 'Departemen', value: 'departemen' },
  { label: 'Jenis Barang', value: 'jenis_barang' },
  { label: 'Mitra', value: 'mitra' },
  { label: 'Barang', value: 'barang' },
  { label: 'Warna', value: 'warna' },
]

const actionTone = (action: string) => {
  if (action === 'CREATE') return 'bg-emerald-100 text-emerald-700'
  if (action === 'UPDATE') return 'bg-amber-100 text-amber-700'
  if (action === 'DELETE') return 'bg-rose-100 text-rose-700'
  return 'bg-slate-100 text-slate-700'
}

const formatDateTime = (value?: string) => {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const formatFieldLabel = (value: string) => value.split('_').join(' ')

const formatValue = (value: unknown) => {
  if (value == null || value === '') return '-'
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

const fetchData = async () => {
  isLoading.value = true
  try {
    const page = search.value?.page ?? 1
    const pageSize = search.value?.pageSize ?? 20
    const filter = search.value?.filter ?? ''
    const sortBy = search.value?.sortBy
    const sortDesc = search.value?.sortDesc ?? false
    const action = search.value?.action ?? 'all'
    const module = search.value?.module ?? 'all'
    const entityType = search.value?.entityType ?? 'all'
    const appliedDateFrom = search.value?.dateFrom ?? ''
    const appliedDateTo = search.value?.dateTo ?? ''

    const response = await getActivityLogs({
      page,
      pageSize,
      search: filter,
      sortBy,
      sortDesc,
      action: action === 'all' ? undefined : action,
      module: module === 'all' ? undefined : module,
      entityType: entityType === 'all' ? undefined : entityType,
      dateFrom: appliedDateFrom || undefined,
      dateTo: appliedDateTo || undefined,
    })

    rows.value = response.results
    totalCount.value = response.count
  } catch (error) {
    console.error('Gagal memuat history log:', error)
    toast.error('Gagal memuat history log operator')
  } finally {
    isLoading.value = false
  }
}

const openDetail = async (id: number) => {
  isDetailOpen.value = true
  isDetailLoading.value = true
  selectedDetail.value = null

  try {
    selectedDetail.value = await getActivityLogById(id)
  } catch (error) {
    console.error('Gagal memuat detail history log:', error)
    toast.error('Gagal memuat detail history log')
    isDetailOpen.value = false
  } finally {
    isDetailLoading.value = false
  }
}

const columns: ColumnDef<ActivityLogListItem>[] = [
  {
    accessorKey: 'created_at',
    header: 'Waktu',
    cell: ({ row }) => h('div', { class: 'text-left text-sm font-medium text-slate-700' }, formatDateTime(row.original.created_at)),
  },
  {
    accessorKey: 'actor_username',
    header: 'Aktor',
    cell: ({ row }) =>
      h('div', { class: 'text-left' }, [
        h('p', { class: 'font-semibold text-slate-800' }, row.original.actor_username || '-'),
        h('p', { class: 'text-xs uppercase tracking-wide text-slate-500' }, row.original.actor_role || '-'),
      ]),
  },
  {
    accessorKey: 'action',
    header: 'Aksi',
    cell: ({ row }) =>
      h(
        'span',
        {
          class: `inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${actionTone(row.original.action)}`,
        },
        row.original.action,
      ),
  },
  {
    accessorKey: 'module',
    header: 'Modul',
    cell: ({ row }) => h('div', { class: 'text-left text-sm text-slate-700' }, row.original.module),
  },
  {
    accessorKey: 'entity_type',
    header: 'Entity',
    cell: ({ row }) =>
      h('div', { class: 'text-left' }, [
        h('p', { class: 'font-medium text-slate-800' }, row.original.entity_type),
        h('p', { class: 'text-xs text-slate-500' }, row.original.entity_label || row.original.entity_id || '-'),
      ]),
  },
  {
    id: 'detail',
    header: 'Detail',
    enableSorting: false,
    cell: ({ row }) =>
      h(
        Button,
        {
          variant: 'outline',
          size: 'sm',
          onClick: () => openDetail(row.original.id),
        },
        {
          default: () => [h(EyeIcon, { class: 'mr-1 h-4 w-4' }), 'Lihat'],
        },
      ),
  },
]

const { table, searchTerm, onSearch } = useTable({
  data: rows,
  columns,
  rowCount: totalCount,
  search,
  schema: historyLogSchema,
})

const summaryCards = computed(() => {
  const createCount = rows.value.filter((item) => item.action === 'CREATE').length
  const updateCount = rows.value.filter((item) => item.action === 'UPDATE').length
  const deleteCount = rows.value.filter((item) => item.action === 'DELETE').length

  return [
    { label: 'Total Log', value: totalCount.value.toLocaleString(), tone: 'bg-slate-100 text-slate-800' },
    { label: 'Create', value: createCount.toLocaleString(), tone: 'bg-emerald-100 text-emerald-700' },
    { label: 'Update', value: updateCount.toLocaleString(), tone: 'bg-amber-100 text-amber-700' },
    { label: 'Delete', value: deleteCount.toLocaleString(), tone: 'bg-rose-100 text-rose-700' },
  ]
})

const applyFilters = async () => {
  await navigate({
    to: '.',
    search: (prev: Record<string, unknown>) =>
      stripHistoryLogDefaults({
        ...prev,
        page: 1,
        action: selectedAction.value,
        module: selectedModule.value,
        entityType: selectedEntityType.value,
        dateFrom: dateFrom.value,
        dateTo: dateTo.value,
      }),
  })
}

const resetFilters = async () => {
  selectedAction.value = 'all'
  selectedModule.value = 'all'
  selectedEntityType.value = 'all'
  dateFrom.value = ''
  dateTo.value = ''
  searchTerm.value = ''

  await navigate({
    to: '.',
    search: () => ({}),
  })
}

watch(
  () => search.value,
  () => {
    selectedAction.value = search.value?.action ?? 'all'
    selectedModule.value = search.value?.module ?? 'all'
    selectedEntityType.value = search.value?.entityType ?? 'all'
    dateFrom.value = search.value?.dateFrom ?? ''
    dateTo.value = search.value?.dateTo ?? ''
    fetchData()
  },
  { deep: true },
)

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="space-y-6 p-4 md:p-6">
    <div class="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div class="h-1.5 rounded-t-3xl bg-gradient-to-r from-sidebar via-sidebar-accent to-sidebar-primary"></div>
      <div class="flex flex-col gap-3 p-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">History Log Operator</h1>
          <p class="mt-1 text-sm text-slate-500">
            Pantau jejak perubahan data `create`, `update`, dan `delete` dari modul prioritas sistem.
          </p>
        </div>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card v-for="card in summaryCards" :key="card.label" class="border-slate-200 shadow-sm">
        <CardHeader class="pb-2">
          <CardDescription>{{ card.label }}</CardDescription>
          <CardTitle class="text-3xl font-bold text-slate-900">{{ card.value }}</CardTitle>
        </CardHeader>
        <CardContent>
          <span :class="['inline-flex rounded-full px-3 py-1 text-xs font-semibold', card.tone]">
            Snapshot halaman saat ini
          </span>
        </CardContent>
      </Card>
    </div>

    <Card class="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>Filter Audit Log</CardTitle>
        <CardDescription>Gunakan filter ini untuk mempersempit log berdasarkan aksi, modul, entity, dan rentang tanggal.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Aksi</label>
            <Select v-model="selectedAction">
              <SelectTrigger>
                <SelectValue placeholder="Pilih aksi" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="item in actionOptions" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Modul</label>
            <Select v-model="selectedModule">
              <SelectTrigger>
                <SelectValue placeholder="Pilih modul" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="item in moduleOptions" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Entity</label>
            <Select v-model="selectedEntityType">
              <SelectTrigger>
                <SelectValue placeholder="Pilih entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="item in entityTypeOptions" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Tanggal Dari</label>
            <Input v-model="dateFrom" type="date" />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Tanggal Sampai</label>
            <Input v-model="dateTo" type="date" />
          </div>
        </div>

        <div class="flex flex-wrap gap-3">
          <Button type="button" @click="applyFilters">
            <SearchIcon class="mr-2 h-4 w-4" />
            Terapkan Filter
          </Button>
          <Button type="button" variant="outline" @click="resetFilters">
            <RefreshCcwIcon class="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>

    <Card class="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>Daftar History Log</CardTitle>
        <CardDescription>Klik detail untuk melihat perubahan field sebelum dan sesudah proses berlangsung.</CardDescription>
      </CardHeader>
      <CardContent class="p-0">
        <DataTable
          :table="table"
          :is-loading="isLoading"
          v-model:search="searchTerm"
          @search="onSearch"
        />
      </CardContent>
    </Card>

    <Dialog v-model:open="isDetailOpen">
      <DialogContent class="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Detail History Log</DialogTitle>
          <DialogDescription v-if="selectedDetail">
            {{ selectedDetail.action }} · {{ selectedDetail.entity_type }} · {{ selectedDetail.entity_label || selectedDetail.entity_id }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="isDetailLoading" class="py-10 text-center text-sm text-slate-500">
          Memuat detail history log...
        </div>

        <div v-else-if="selectedDetail" class="space-y-6">
          <div class="grid gap-4 md:grid-cols-2">
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Aktor</p>
              <p class="mt-1 text-base font-semibold text-slate-900">{{ selectedDetail.actor_username }}</p>
              <p class="text-sm text-slate-500">{{ selectedDetail.actor_role }}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Waktu & Route</p>
              <p class="mt-1 text-base font-semibold text-slate-900">{{ formatDateTime(selectedDetail.created_at) }}</p>
              <p class="text-sm text-slate-500">{{ selectedDetail.method }} {{ selectedDetail.route }}</p>
            </div>
          </div>

          <div class="space-y-3">
            <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-600">Changed Fields</h3>
            <div v-if="selectedDetail.changed_fields?.length" class="space-y-3">
              <div
                v-for="field in selectedDetail.changed_fields"
                :key="`${field.field}-${String(field.before)}-${String(field.after)}`"
                class="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <p class="text-sm font-semibold text-slate-900">{{ formatFieldLabel(field.field) }}</p>
                <div class="mt-3 grid gap-3 md:grid-cols-2">
                  <div class="rounded-xl border border-rose-100 bg-rose-50 p-3">
                    <p class="text-xs font-semibold uppercase tracking-wide text-rose-600">Before</p>
                    <pre class="mt-2 whitespace-pre-wrap break-words text-xs text-slate-700">{{ formatValue(field.before) }}</pre>
                  </div>
                  <div class="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                    <p class="text-xs font-semibold uppercase tracking-wide text-emerald-700">After</p>
                    <pre class="mt-2 whitespace-pre-wrap break-words text-xs text-slate-700">{{ formatValue(field.after) }}</pre>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              Tidak ada diff field yang tercatat untuk log ini.
            </div>
          </div>

          <div class="grid gap-4 lg:grid-cols-2">
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-sm font-semibold text-slate-900">Before Data</p>
              <pre class="mt-3 whitespace-pre-wrap break-words text-xs text-slate-700">{{ JSON.stringify(selectedDetail.before_data ?? {}, null, 2) }}</pre>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-sm font-semibold text-slate-900">After Data</p>
              <pre class="mt-3 whitespace-pre-wrap break-words text-xs text-slate-700">{{ JSON.stringify(selectedDetail.after_data ?? {}, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
