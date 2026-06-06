<script setup lang="ts">
import { h, onMounted, watch, computed } from 'vue'
import { useSearch } from '@tanstack/vue-router'
import {
  PlusIcon,
  RefreshCwIcon,
  FactoryIcon,
  MoreHorizontalIcon,
} from 'lucide-vue-next'

import { productionSearchSchema } from '@/pages/productionSummary/schema'

import DataTable from '@/components/DataTable.vue'
import AppDialog from '@/components/AppDialog.vue'
import StatCard from './components/StatCard.vue'
import ProductionChart from './components/ProductionChart.vue'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { useTable } from '@/composables/useTable'
import { useDialog } from '@/composables/useDialog'
import { useProductionDashboard } from '@/composables/dashboard/useProductionDashboard'
import { type DialogSchemaType } from '@/schemas/dialog/dialog'
import { usePermission } from '@/composables/usePermission'

const { hasPermission } = usePermission()

// ─── Composable ──────────────────────────────────────────
const {
  data,
  totalCount,
  isLoading,
  workOrders,
  selectedWoId,
  selectedWoInfo,
  overallProgress,
  activeStageInfo,
  targetInfo,
  progressInfo,
  lastUpdateInfo,
  chartData,
  formatAngka,
  getRowCompletion,
  fetchWorkOrders,
  fetchData,
  onWoChange,
  createFactoryReport,
} = useProductionDashboard()

// ─── Router Search Params ────────────────────────────────
const search = useSearch({ strict: false }) as any

// ─── DataTable ───────────────────────────────────────────
const { table, searchTerm, onSearch, clearFilter } = useTable({
  data: data,
  rowCount: totalCount,
  columns: [
    {
      header: 'Order ID',
      accessorKey: 'id_wo_shell_size',
      cell: ({ row }) =>
        h('span', { class: 'font-semibold text-foreground text-sm pl-2' },
          `#ORD-${row.getValue('id_wo_shell_size')}`
        ),
    },
    {
      header: 'Model',
      accessorKey: 'model_name',
      cell: ({ row }) =>
        h('span', { class: 'font-medium text-foreground' }, row.getValue('model_name')),
    },
    {
      header: 'Size',
      accessorKey: 'size',
      cell: ({ row }) =>
        h('span', { class: 'text-muted-foreground font-medium' }, row.getValue('size')),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => {
        const status = (row.getValue('status') as string) || ''
        const upper = status.toUpperCase()
        let cls = 'text-xs font-semibold px-2.5 py-1 rounded border inline-block '
        if (upper.includes('BLOCK') || upper.includes('REJECT')) {
          cls += 'bg-destructive/10 text-destructive border-destructive/20'
        } else if (upper.includes('COMPLET') || upper.includes('DONE') || upper.includes('SHIP')) {
          cls += 'bg-primary/10 text-primary border-primary/20'
        } else {
          cls += 'bg-muted text-muted-foreground border-border'
        }
        return h('span', { class: cls }, upper)
      },
    },
    {
      header: 'Completion',
      accessorKey: 'target_qty',
      id: 'completion',
      cell: ({ row }) => {
        const pct = getRowCompletion(row.original)
        return h('div', { class: 'flex items-center gap-2 min-w-[120px]' }, [
          h('div', { class: 'flex-1 h-2 bg-muted rounded-full overflow-hidden' }, [
            h('div', {
              class: 'h-full bg-primary rounded-full transition-all duration-500',
              style: `width: ${pct}%`,
            }),
          ]),
          h('span', { class: 'text-xs font-semibold text-muted-foreground w-10 text-right' }, `${pct}%`),
        ])
      },
    },
    {
      header: 'Action',
      id: 'action',
      cell: () =>
        h(Button, { variant: 'ghost', size: 'icon', class: 'h-8 w-8' }, () =>
          h(MoreHorizontalIcon, { class: 'w-4 h-4' })
        ),
    },
  ],
  search: search,
  schema: productionSearchSchema,
})

// ─── Dialog ──────────────────────────────────────────────
const operatorReportDialog = useDialog({
  onSubmit: async (values) => {
    const { division, ...payload } = values
    if (payload.tanggal && !payload.tanggal.includes('T')) {
      const parts = payload.tanggal.split('-')
      if (parts.length === 3) {
        payload.tanggal = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).toISOString()
      }
    }
    return await createFactoryReport(division, payload)
  },
  onSuccess: () => {
    fetchData(getSearchParams())
  },
})

const productionDialogSchema = computed<DialogSchemaType>(() => [
  {
    key: 'id_wo_shell_size',
    label: 'Model & Ukuran Target',
    type: 'select',
    placeholder: 'Pilih Model - Ukuran',
    rules: 'required',
    position: 'full',
    options: data.value.map(item => ({
      label: `${item.model_name} (Size ${item.size}) [Target: ${formatAngka(item.target_qty)} pcs]`,
      value: item.id_wo_shell_size,
    })),
  },
  {
    key: 'tanggal',
    label: 'Tanggal Laporan',
    type: 'date',
    placeholder: 'Pilih tanggal pengerjaan',
    rules: 'required',
    position: 'left',
  },
  {
    key: 'division',
    label: 'Divisi Laporan',
    type: 'select',
    placeholder: 'Pilih divisi pengerjaan',
    rules: 'required',
    position: 'right',
    options: [
      { label: 'Cutting', value: 'cutting' },
      { label: 'Sewing', value: 'sewing' },
      { label: 'QC Finishing', value: 'qc-finish' },
      { label: 'Packing', value: 'packing' },
      { label: 'Shipping / Pengiriman', value: 'pengiriman' },
    ],
  },
  {
    key: 'qty',
    label: 'Jumlah Hasil Produksi (Pcs)',
    type: 'number',
    placeholder: 'Masukkan Qty',
    rules: 'required',
    position: 'full',
  },
])

// ─── Helpers ─────────────────────────────────────────────
const getSearchParams = () => ({
  page: search.value?.page ?? 1,
  pageSize: search.value?.pageSize ?? 20,
  filter: search.value?.filter ?? '',
})

const adjustQty = (values: Record<string, any>, setFieldValue: (key: string, val: any) => void, amount: number) => {
  const currentQty = Number(values.qty ?? 0)
  setFieldValue('qty', Math.max(0, currentQty + amount))
}

const openReportDialog = () => {
  operatorReportDialog.openDialog({
    tanggal: new Date().toISOString().split('T')[0],
    qty: 0,
    division: 'cutting',
  })
}

const handleWoChange = (val: string | number | bigint | Record<string, any> | null) => {
  onWoChange(val)
  fetchData(getSearchParams())
}

const handleExportCsv = () => {
  // Placeholder: future CSV export
  const headers = ['Order ID', 'Model', 'Size', 'Target Qty', 'Cutting', 'Sewing', 'QC Pass', 'Packing', 'Shipped']
  const rows = data.value.map(item => [
    `#ORD-${item.id_wo_shell_size}`,
    item.model_name,
    item.size,
    item.target_qty,
    item.production?.cutting ?? 0,
    item.production?.sewing ?? 0,
    item.production?.qc_pass ?? 0,
    item.production?.packing ?? 0,
    item.production?.shipped ?? 0,
  ])

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `production-summary-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
}

// ─── Lifecycle ───────────────────────────────────────────
onMounted(async () => {
  await fetchWorkOrders()
  await fetchData(getSearchParams())
})

watch(() => search, () => {
  fetchData(getSearchParams())
}, { deep: true })
</script>

<template>
  <div class="space-y-6 p-6 min-h-screen">
    <!-- ═══ HEADER ═══ -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5 mb-1">
          <FactoryIcon class="w-5 h-5 text-muted-foreground" />
          <h1 class="text-2xl font-bold tracking-tight text-foreground">Production Summary</h1>
        </div>
        <p class="text-sm text-muted-foreground">
          Monitoring progress produksi per divisi.
        </p>
      </div>

      <!-- WO Selector -->
      <div class="flex items-center gap-3">
        <Select :model-value="selectedWoId" @update:model-value="handleWoChange">
          <SelectTrigger class="w-full sm:w-[320px]">
            <SelectValue placeholder="Pilih Work Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="0">Semua Work Order (Global)</SelectItem>
              <SelectItem
                v-for="wo in workOrders"
                :key="wo.id_wo"
                :value="String(wo.id_wo)"
              >
                WO #{{ wo.id_wo }} — {{ wo.buyer }} — {{ wo.model }} ({{ formatAngka(wo.qty) }} pcs)
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- ═══ TOP: PROGRESS OVERVIEW + BAR CHART ═══ -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <!-- Left: Overview Progress Card -->
      <div class="lg:col-span-3 space-y-4">
        <Card>
          <CardContent class="p-6">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
              <div>
                <p class="text-sm font-semibold text-muted-foreground">Persentase Progres</p>
                <p class="text-[10px] text-muted-foreground/80 mt-0.5">Dihitung berdasarkan bobot kumulatif 5 divisi produksi</p>
              </div>
            </div>
            <div class="flex items-end justify-between gap-6">
              <p class="text-5xl font-bold text-foreground tracking-tight leading-none">
                {{ overallProgress.persen }}%
              </p>
              <div class="text-right space-y-1">
                <p class="text-xs text-muted-foreground">
                  Target Produksi: <span class="font-semibold text-foreground">{{ overallProgress.targetProduksi }}</span>
                </p>
                <p class="text-xs text-muted-foreground">
                  Jumlah Dikirim: <span class="font-semibold text-foreground">{{ overallProgress.jumlahDikirim }}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- 2x2 Stat Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            title="Tahap Aktif"
            :value="activeStageInfo.value"
            :subtitle="activeStageInfo.subtitle"
          />
          <StatCard
            title="Jumlah Target"
            :value="targetInfo.value"
            value-suffix="Unit"
            :subtitle="targetInfo.subtitle"
          />
          <StatCard
            :title="progressInfo.title"
            :value="progressInfo.value"
            :subtitle="progressInfo.subtitle"
            :show-progress="true"
            :progress-value="progressInfo.persen"
          />
          <StatCard
            title="Update Terakhir"
            :value="lastUpdateInfo.utama"
            :subtitle="lastUpdateInfo.bawah"
          />
        </div>
      </div>

      <!-- Right: Bar Chart -->
      <div class="lg:col-span-2">
        <ProductionChart :data="chartData" />
      </div>
    </div>

    <!-- ═══ ACTION BUTTONS ═══ -->
    <div class="flex items-center justify-end gap-3">
      <Button type="button" variant="outline" size="sm" @click="handleExportCsv">
        Export CSV
      </Button>
      <Button type="button" variant="outline" size="sm" @click="fetchData(getSearchParams())">
        <RefreshCwIcon class="w-4 h-4 mr-1.5" :class="{ 'animate-spin': isLoading }" />
        Refresh
      </Button>
      <Button v-if="hasPermission('PRODUCTION_REPORT_CREATE')" type="button" size="sm" @click="openReportDialog">
        <PlusIcon class="w-4 h-4 mr-1.5" />
        Lapor Output Divisi
      </Button>
    </div>

    <!-- ═══ WO Context Info ═══ -->
    <p v-if="selectedWoInfo" class="text-xs text-muted-foreground -mt-2">
      Konteks: <strong class="text-foreground">WO #{{ selectedWoInfo.id_wo }} — {{ selectedWoInfo.buyer }} — {{ selectedWoInfo.model }}</strong>
      · PO: {{ selectedWoInfo.po_number }} · Status: {{ selectedWoInfo.status }}
    </p>

    <!-- ═══ DATA TABLE ═══ -->
    <Card>
      <div class="p-0">
        <DataTable
          :table="table"
          :is-loading="isLoading"
          v-model:search="searchTerm"
          @search="onSearch"
          @clear-filter="clearFilter"
        />
      </div>
    </Card>

    <!-- ═══ REPORT DIALOG ═══ -->
    <AppDialog
      title="Laporan Output Produksi Harian"
      description="Masukkan data hasil produksi harian per divisi. Data dari penanggung jawab lapangan via WhatsApp."
      :schema="productionDialogSchema"
      :is-open="operatorReportDialog.isOpen.value"
      :initial-values="operatorReportDialog.initialValues.value"
      :submit-label="operatorReportDialog.isLoading.value ? 'Mengirim...' : 'Kirim Laporan'"
      @update:is-open="operatorReportDialog.isOpen.value = $event"
      @submit="operatorReportDialog.handleSubmit"
    >
      <template #extra="{ values, setFieldValue }">
        <div class="mt-5 border-t pt-4">
          <Label class="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2.5">
            Quick-Tap Panel
          </Label>
          <div class="grid grid-cols-5 gap-2">
            <Button type="button" variant="outline" class="h-11 text-xs font-bold" @click="adjustQty(values, setFieldValue, 1)">+1</Button>
            <Button type="button" variant="outline" class="h-11 text-xs font-bold col-span-2" @click="adjustQty(values, setFieldValue, 10)">+10</Button>
            <Button type="button" variant="outline" class="h-11 text-xs font-bold col-span-2" @click="adjustQty(values, setFieldValue, 50)">+50</Button>
            <Button type="button" variant="outline" class="h-11 text-xs font-bold col-span-2" @click="adjustQty(values, setFieldValue, -1)">-1</Button>
            <Button type="button" variant="outline" class="h-11 text-xs font-bold col-span-3" @click="adjustQty(values, setFieldValue, -10)">-10</Button>
          </div>
        </div>
      </template>
    </AppDialog>
  </div>
</template>
