<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue'
import { useNavigate, useSearch } from '@tanstack/vue-router'
import type { ColumnDef } from '@tanstack/vue-table'
import { RefreshCcwIcon, SearchIcon } from 'lucide-vue-next'
import DateInput from '@/components/form/DateInput.vue'
import { toast } from 'vue-sonner'

import DataTable from '@/components/DataTable.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getActivityLogs, type ActivityLogListItem } from '@/api/activity-logs/activity-logs'
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

const actionOptions = [
  { label: 'Semua Aksi', value: 'all' },
  { label: 'Create', value: 'CREATE' },
  { label: 'Update', value: 'UPDATE' },
  { label: 'Delete', value: 'DELETE' },
]

const actionLabels: Record<string, string> = {
  CREATE: 'Create',
  UPDATE: 'Update',
  DELETE: 'Delete',
}

const moduleLabels: Record<string, string> = {
  'user-management': 'User Management',
  'role-management': 'Role Management',
  'master-data': 'Master Data',
  'transaction-documents': 'Transaction Documents',
  'work-order-production': 'Work Order Production',
  'warehouse-delivery': 'Logistik & Pengiriman',
}

const entityTypeLabels: Record<string, string> = {
  users: 'Users',
  roles: 'Roles',
  hak_akses: 'Permissions',
  departemen: 'Departemen',
  jenis_barang: 'Jenis Barang',
  mitra: 'Mitra',
  barang: 'Barang',
  warna: 'Warna',
  password_reset_requests: 'Password Reset Requests',
  po_clients: 'PO Clients',
  pr_internals: 'PR Internals',
  po_internals: 'PO Internals',
  work_orders: 'Work Orders',
  packing_lists: 'Packing Lists',
  surat_jalan_internals: 'Surat Jalan Internal',
  surat_jalan_clients: 'Surat Jalan Client',
  received: 'Received',
  inventory_receipts: 'Inventory Receipts',
  rekonsiliasi_materials: 'Rekonsiliasi Materials',
  master_plans: 'Master Plans',
  master_plan_items: 'Master Plan Items',
  marker_plans: 'Marker Plans',
  spreading_cutting_plans: 'Spreading & Cutting Plans',
  data_approve_cutting_plans: 'Data Approve Cutting Plans',
  timeline_plans: 'Timeline Plans',
  material_lists: 'Material Lists',
  material_list_items: 'Material List Items',
  rekonsiliasis: 'Rekonsiliasi Material',
  report_cutting: 'Report Cutting',
  report_sewing: 'Report Sewing',
  report_qc_finish: 'Report QC Finish',
  report_packing: 'Report Packing',
  report_pengiriman: 'Report Pengiriman',
  factory_reports: 'Factory Reports',
  retur_clients: 'Retur Client',
}

const moduleOptions = [
  { label: 'Semua Modul', value: 'all' },
  { label: 'User Management', value: 'user-management' },
  { label: 'Role Management', value: 'role-management' },
  { label: 'Master Data', value: 'master-data' },
  { label: 'Transaction Documents', value: 'transaction-documents' },
  { label: 'Work Order Production', value: 'work-order-production' },
  { label: 'Logistik & Pengiriman', value: 'warehouse-delivery' },
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
  { label: 'PO Clients', value: 'po_clients' },
  { label: 'PR Internals', value: 'pr_internals' },
  { label: 'PO Internals', value: 'po_internals' },
  { label: 'Work Orders', value: 'work_orders' },
  { label: 'Packing Lists', value: 'packing_lists' },
  { label: 'Surat Jalan Internal', value: 'surat_jalan_internals' },
  { label: 'Surat Jalan Client', value: 'surat_jalan_clients' },
  { label: 'Received', value: 'received' },
  { label: 'Inventory Receipts', value: 'inventory_receipts' },
  { label: 'Rekonsiliasi Materials', value: 'rekonsiliasi_materials' },
  { label: 'Master Plans', value: 'master_plans' },
  { label: 'Master Plan Items', value: 'master_plan_items' },
  { label: 'Marker Plans', value: 'marker_plans' },
  { label: 'Spreading & Cutting Plans', value: 'spreading_cutting_plans' },
  { label: 'Data Approve Cutting Plans', value: 'data_approve_cutting_plans' },
  { label: 'Timeline Plans', value: 'timeline_plans' },
  { label: 'Material Lists', value: 'material_lists' },
  { label: 'Material List Items', value: 'material_list_items' },
  { label: 'Rekonsiliasi Material', value: 'rekonsiliasis' },
  { label: 'Report Cutting', value: 'report_cutting' },
  { label: 'Report Sewing', value: 'report_sewing' },
  { label: 'Report QC Finish', value: 'report_qc_finish' },
  { label: 'Report Packing', value: 'report_packing' },
  { label: 'Report Pengiriman', value: 'report_pengiriman' },
  { label: 'Factory Reports', value: 'factory_reports' },
  { label: 'Retur Client', value: 'retur_clients' },
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

const formatActionLabel = (value?: string) => {
  if (!value) return '-'
  return actionLabels[value] ?? value
}

const formatModuleLabel = (value?: string) => {
  if (!value) return '-'
  return moduleLabels[value] ?? value
}

const formatEntityTypeLabel = (value?: string) => {
  if (!value) return '-'
  return entityTypeLabels[value] ?? value
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
    toast.error('Riwayat aktivitas gagal dimuat')
  } finally {
    isLoading.value = false
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
        formatActionLabel(row.original.action),
      ),
  },
  {
    accessorKey: 'module',
    header: 'Modul',
    cell: ({ row }) => h('div', { class: 'text-left text-sm text-slate-700' }, formatModuleLabel(row.original.module)),
  },
  {
    accessorKey: 'entity_type',
    header: 'Entity',
    cell: ({ row }) =>
      h('div', { class: 'text-left' }, [
        h('p', { class: 'font-medium text-slate-800' }, formatEntityTypeLabel(row.original.entity_type)),
        h('p', { class: 'text-xs text-slate-500' }, row.original.entity_label || row.original.entity_id || '-'),
      ]),
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

const appliedFilterChips = computed(() => {
  const chips: string[] = []

  if (selectedAction.value !== 'all') chips.push(`Aksi: ${formatActionLabel(selectedAction.value)}`)
  if (selectedModule.value !== 'all') chips.push(`Modul: ${formatModuleLabel(selectedModule.value)}`)
  if (selectedEntityType.value !== 'all') chips.push(`Entity: ${formatEntityTypeLabel(selectedEntityType.value)}`)
  if (dateFrom.value) chips.push(`Dari: ${dateFrom.value}`)
  if (dateTo.value) chips.push(`Sampai: ${dateTo.value}`)
  if (searchTerm.value) chips.push(`Cari: ${searchTerm.value}`)

  return chips
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
          <h1 class="text-2xl font-bold text-slate-900">History Log Aktivitas</h1>
          <p class="mt-1 text-sm text-slate-500">
            Daftar perubahan data yang tercatat dari aksi create, update, dan delete.
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
      </Card>
    </div>

    <Card class="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>Filter Riwayat Aktivitas</CardTitle>
        <CardDescription>Gunakan filter untuk mencari aktivitas berdasarkan aksi, modul, entity, dan tanggal.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-4 lg:grid-cols-3">
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Aksi</label>
            <Select v-model="selectedAction">
              <SelectTrigger class="w-full">
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
              <SelectTrigger class="w-full">
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
              <SelectTrigger class="w-full">
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
        </div>

        <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Dari</label>
            <DateInput v-model="dateFrom" class="w-full" />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Sampai</label>
            <DateInput v-model="dateTo" class="w-full" />
          </div>

          <div class="flex flex-wrap items-center gap-3 lg:justify-end">
            <Button type="button" @click="applyFilters">
              <SearchIcon class="mr-2 h-4 w-4" />
              Terapkan Filter
            </Button>
            <Button type="button" variant="outline" @click="resetFilters">
              <RefreshCcwIcon class="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>

        <div v-if="appliedFilterChips.length" class="flex flex-wrap gap-2">
          <span
            v-for="chip in appliedFilterChips"
            :key="chip"
            class="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
          >
            {{ chip }}
          </span>
        </div>
      </CardContent>
    </Card>

    <Card class="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>Daftar Aktivitas</CardTitle>
        <CardDescription>Daftar aktivitas yang tercatat berdasarkan filter yang sedang aktif.</CardDescription>
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
  </div>
</template>
