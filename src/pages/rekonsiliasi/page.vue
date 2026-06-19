<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue'
import { useRouter, useSearch } from '@tanstack/vue-router'
import type { ColumnDef } from '@tanstack/vue-table'
import { EyeIcon, LoaderCircleIcon, PlusIcon } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

import DataTable from '@/components/DataTable.vue'
import { Button } from '@/components/ui/button'
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
import { getWorkOrders, type WorkOrderListItem } from '@/api/work-orders/work-orders'
import { createRekonsiliasi, getRekonsiliasis, type RekonsiliasiListItem } from '@/api/rekonsiliasi/rekonsiliasi'
import { rekonsiliasiSchema } from '@/pages/rekonsiliasi/schema'
import { useTable } from '@/composables/useTable'
import { formatDate } from '@/lib/formatter'
import { usePermission } from '@/composables/usePermission'

const search = useSearch({ strict: false }) as any
const router = useRouter()
const { hasPermission } = usePermission()

const rows = ref<RekonsiliasiListItem[]>([])
const totalCount = ref(0)
const isLoading = ref(false)

const isCreateDialogOpen = ref(false)
const isCreating = ref(false)
const workOrderOptions = ref<WorkOrderListItem[]>([])
const isLoadingWorkOrders = ref(false)
const selectedWorkOrderId = ref('')

const canCreate = computed(() => hasPermission('REKONSILIASI_CREATE'))

const fetchData = async () => {
  isLoading.value = true
  try {
    const page = search.value?.page ?? 1
    const pageSize = search.value?.pageSize ?? 20
    const filter = search.value?.filter ?? ''
    const sortBy = search.value?.sortBy
    const sortDesc = search.value?.sortDesc ?? false

    const response = await getRekonsiliasis({
      page,
      pageSize,
      search: filter,
      sortBy,
      sortDesc,
    })

    rows.value = response.results
    totalCount.value = response.count
  } catch (error) {
    console.error('Gagal memuat rekonsiliasi:', error)
    toast.error('Daftar rekonsiliasi gagal dimuat')
  } finally {
    isLoading.value = false
  }
}

const fetchWorkOrders = async () => {
  isLoadingWorkOrders.value = true
  try {
    const response = await getWorkOrders({
      page: 1,
      pageSize: 50,
      sortBy: 'created_at',
      sortDesc: true,
    })
    workOrderOptions.value = response.results
  } catch (error) {
    console.error('Gagal memuat work order:', error)
    toast.error('Daftar work order gagal dimuat')
  } finally {
    isLoadingWorkOrders.value = false
  }
}

const openCreateDialog = async () => {
  isCreateDialogOpen.value = true
  selectedWorkOrderId.value = ''
  if (!workOrderOptions.value.length) {
    await fetchWorkOrders()
  }
}

const createDocument = async () => {
  const idWo = Number(selectedWorkOrderId.value)
  if (!idWo) {
    toast.error('Pilih work order terlebih dahulu')
    return
  }

  isCreating.value = true
  try {
    const response = await createRekonsiliasi(idWo)
    toast.success('Rekonsiliasi berhasil dibuat')
    isCreateDialogOpen.value = false
    await router.navigate({
      to: '/rekonsiliasi/$id',
      params: { id: String(response.header.id_rekonsiliasi) },
    })
  } catch (error: any) {
    console.error('Gagal membuat rekonsiliasi:', error)
    const message = error?.response?.data?.message || 'Rekonsiliasi gagal dibuat'
    toast.error(message)
  } finally {
    isCreating.value = false
  }
}

const columns: ColumnDef<RekonsiliasiListItem>[] = [
  {
    header: 'Updated At',
    accessorKey: 'updated_at',
    cell: ({ row }) => formatDate(row.getValue('updated_at')),
  },
  {
    header: 'ID Rekon',
    accessorKey: 'id_rekonsiliasi',
  },
  {
    header: 'ID WO',
    accessorKey: 'id_wo',
  },
  {
    header: 'Work Order',
    accessorKey: 'nama_wo',
    cell: ({ row }) => h('div', { class: 'text-left font-semibold text-slate-800' }, row.original.nama_wo || '-'),
  },
  {
    header: 'Buyer',
    accessorKey: 'buyer',
    cell: ({ row }) => h('div', { class: 'text-left text-slate-700' }, row.original.buyer || '-'),
  },
  {
    header: 'Style',
    accessorKey: 'style',
    cell: ({ row }) => h('div', { class: 'text-left text-slate-700' }, row.original.style || '-'),
  },
  {
    header: 'Qty PO',
    accessorKey: 'qty_po',
  },
  {
    header: 'Plan Cut',
    accessorKey: 'plan_cut_total',
  },
  {
    header: 'Actions',
    id: 'actions',
    enableSorting: false,
    cell: ({ row }) =>
      h(
        Button,
        {
          variant: 'outline',
          size: 'sm',
          onClick: () => router.navigate({ to: '/rekonsiliasi/$id', params: { id: String(row.original.id_rekonsiliasi) } }),
        },
        () => [h(EyeIcon, { class: 'mr-1 h-4 w-4' }), 'Buka'],
      ),
  },
]

const { table, searchTerm, onSearch, clearFilter } = useTable({
  data: rows,
  rowCount: totalCount,
  columns,
  search,
  schema: rekonsiliasiSchema,
})

watch(() => search, fetchData, { deep: true })
onMounted(fetchData)
</script>

<template>
  <DataTable
    :table="table"
    :is-loading="isLoading"
    v-model:search="searchTerm"
    @search="onSearch"
    @clear-filter="clearFilter"
  >
    <template #actions v-if="canCreate">
      <Button @click="openCreateDialog" variant="outline" class="shadow-sm border-neutral-300">
        <PlusIcon class="mr-2 h-4 w-4" />
        Buat Rekonsiliasi
      </Button>
    </template>
  </DataTable>

  <Dialog v-model:open="isCreateDialogOpen">
    <DialogContent class="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>Buat Rekonsiliasi Material</DialogTitle>
        <DialogDescription>
          Pilih work order yang akan dijadikan dasar snapshot rekonsiliasi.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-700">Work Order</label>
          <Select v-model="selectedWorkOrderId">
            <SelectTrigger class="w-full">
              <SelectValue :placeholder="isLoadingWorkOrders ? 'Memuat work order...' : 'Pilih work order'" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem
                  v-for="item in workOrderOptions"
                  :key="item.id_wo"
                  :value="String(item.id_wo)"
                >
                  {{ item.id_wo }} - {{ item.model }} - {{ item.buyer }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div class="flex justify-end gap-3">
          <Button type="button" variant="outline" @click="isCreateDialogOpen = false">Batal</Button>
          <Button type="button" :disabled="isCreating || isLoadingWorkOrders" @click="createDocument">
            <LoaderCircleIcon v-if="isCreating" class="mr-2 h-4 w-4 animate-spin" />
            Buat Dokumen
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
