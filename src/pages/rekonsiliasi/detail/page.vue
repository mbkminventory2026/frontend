<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useParams, useRouter } from '@tanstack/vue-router'
import {
  ArrowLeftIcon,
  LoaderCircleIcon,
  PlusIcon,
  RefreshCcwIcon,
  SaveIcon,
  Trash2Icon,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'

import {
  getRekonsiliasiById,
  refreshRekonsiliasi,
  updateRekonsiliasi,
  type RekonsiliasiColorSummary,
  type RekonsiliasiDetailResponse,
  type RekonsiliasiMaterialRow,
} from '@/api/rekonsiliasi/rekonsiliasi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { usePermission } from '@/composables/usePermission'
import { formatDate } from '@/lib/formatter'

type EditableTerimaEntry = {
  id_rekonsiliasi_terima_entry?: number
  entry_type: 'awal' | 'untuk' | 'ambil'
  entry_label: string
  qty: number
  note: string
}

type EditableMaterialRow = {
  id_rekonsiliasi_material_row: number
  row_no: number
  kategori: string
  description: string
  size_label: string
  ratio_source: number
  ratio_input: number
  qty_per_pcs_input: number
  qty_wo: number
  toleransi: number
  satuan: string
  qty_actual_kirim_source: number
  qty_actual_kirim_manual: number
  reject_qty: number
  retur_qty: number
  keterangan: string
  terima_entries: EditableTerimaEntry[]
}

const params = useParams({ from: '/_authenticated/rekonsiliasi/$id' })
const router = useRouter()
const { hasPermission } = usePermission()

const isLoading = ref(false)
const isSaving = ref(false)
const isRefreshing = ref(false)

const detail = ref<RekonsiliasiDetailResponse | null>(null)
const editableRows = ref<EditableMaterialRow[]>([])

const canEdit = computed(() => hasPermission('REKONSILIASI_UPDATE'))
const pageTitle = computed(() => {
  if (!detail.value) return 'Detail Rekonsiliasi'
  return `Rekonsiliasi WO-${detail.value.header.id_wo}`
})

const hydrateEditableRows = (rows: RekonsiliasiMaterialRow[]) => {
  editableRows.value = rows.map((row) => ({
    id_rekonsiliasi_material_row: row.id_rekonsiliasi_material_row,
    row_no: row.row_no,
    kategori: row.kategori,
    description: row.description,
    size_label: row.size_label,
    ratio_source: row.ratio_source,
    ratio_input: row.ratio_input,
    qty_per_pcs_input: row.qty_per_pcs_input,
    qty_wo: row.qty_wo,
    toleransi: row.toleransi,
    satuan: row.satuan,
    qty_actual_kirim_source: row.qty_actual_kirim_source,
    qty_actual_kirim_manual: row.qty_actual_kirim_manual,
    reject_qty: row.reject_qty,
    retur_qty: row.retur_qty,
    keterangan: row.keterangan,
    terima_entries: (row.terima_entries ?? []).map((entry) => ({
      id_rekonsiliasi_terima_entry: entry.id_rekonsiliasi_terima_entry,
      entry_type: entry.entry_type,
      entry_label: entry.entry_label,
      qty: entry.qty,
      note: entry.note,
    })),
  }))
}

const loadDetail = async () => {
  isLoading.value = true
  try {
    const response = await getRekonsiliasiById(params.value.id)
    detail.value = response
    hydrateEditableRows(response.material_rows)
  } catch (error) {
    console.error('Gagal memuat detail rekonsiliasi:', error)
    toast.error('Detail rekonsiliasi gagal dimuat')
  } finally {
    isLoading.value = false
  }
}

const computeTotalTerima = (row: EditableMaterialRow) =>
  row.terima_entries.reduce((total, entry) => {
    if (entry.entry_type === 'untuk') return total - entry.qty
    return total + entry.qty
  }, 0)

const computeQtyActualKirim = (row: EditableMaterialRow) => row.qty_actual_kirim_source + row.qty_actual_kirim_manual

const computeConsActual = (row: EditableMaterialRow) => computeTotalTerima(row) - (computeQtyActualKirim(row) * row.qty_per_pcs_input)

const computeBalance = (row: EditableMaterialRow) => computeTotalTerima(row) - computeConsActual(row)

const computeLastBalance = (row: EditableMaterialRow) => computeBalance(row) - row.reject_qty - row.retur_qty

const colorBalanceTone = (summary: RekonsiliasiColorSummary) => {
  if (summary.balance < 0) return 'bg-rose-100 text-rose-700 border-rose-200'
  if (summary.balance === 0) return 'bg-slate-100 text-slate-700 border-slate-200'
  return 'bg-emerald-100 text-emerald-700 border-emerald-200'
}

const rowKindTone = (kategori: string) => {
  if (kategori === 'shell') return 'bg-sky-100 text-sky-700 border-sky-200'
  if (kategori === 'trim') return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-slate-100 text-slate-700 border-slate-200'
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(value || 0)

const addTerimaEntry = (row: EditableMaterialRow) => {
  row.terima_entries.push({
    entry_type: 'awal',
    entry_label: '',
    qty: 0,
    note: '',
  })
}

const removeTerimaEntry = (row: EditableMaterialRow, index: number) => {
  row.terima_entries.splice(index, 1)
}

const saveDocument = async () => {
  if (!canEdit.value) return

  isSaving.value = true
  try {
    const response = await updateRekonsiliasi(params.value.id, {
      material_rows: editableRows.value.map((row) => ({
        id_rekonsiliasi_material_row: row.id_rekonsiliasi_material_row,
        ratio_input: Number(row.ratio_input) || 0,
        qty_per_pcs_input: Number(row.qty_per_pcs_input) || 0,
        qty_actual_kirim_manual: Number(row.qty_actual_kirim_manual) || 0,
        reject_qty: Number(row.reject_qty) || 0,
        retur_qty: Number(row.retur_qty) || 0,
        keterangan: row.keterangan,
        terima_entries: row.terima_entries.map((entry) => ({
          id_rekonsiliasi_terima_entry: entry.id_rekonsiliasi_terima_entry,
          entry_type: entry.entry_type,
          entry_label: entry.entry_label,
          qty: Number(entry.qty) || 0,
          note: entry.note,
        })),
      })),
    })

    detail.value = response
    hydrateEditableRows(response.material_rows)
    toast.success('Rekonsiliasi berhasil disimpan')
  } catch (error: any) {
    console.error('Gagal menyimpan rekonsiliasi:', error)
    const message = error?.response?.data?.message || 'Rekonsiliasi gagal disimpan'
    toast.error(message)
  } finally {
    isSaving.value = false
  }
}

const refreshSourceData = async () => {
  if (!canEdit.value) return

  isRefreshing.value = true
  try {
    const response = await refreshRekonsiliasi(params.value.id)
    detail.value = response
    hydrateEditableRows(response.material_rows)
    toast.success('Snapshot rekonsiliasi berhasil diperbarui')
  } catch (error: any) {
    console.error('Gagal refresh rekonsiliasi:', error)
    const message = error?.response?.data?.message || 'Snapshot rekonsiliasi gagal diperbarui'
    toast.error(message)
  } finally {
    isRefreshing.value = false
  }
}

onMounted(loadDetail)
</script>

<template>
  <div class="space-y-6 p-4 md:p-6">
    <div class="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div class="h-1.5 rounded-t-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
      <div class="flex flex-col gap-4 p-6 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <Button variant="outline" size="sm" @click="router.navigate({ to: '/rekonsiliasi' })">
              <ArrowLeftIcon class="mr-1 h-4 w-4" />
              Kembali
            </Button>
            <span
              class="inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-wide"
              :class="canEdit ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'"
            >
              {{ canEdit ? 'Editable oleh Admin Produksi' : 'Read Only' }}
            </span>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-slate-900">{{ pageTitle }}</h1>
            <p class="mt-1 text-sm text-slate-500">
              Rekonsiliasi material campuran berbasis work order, material list, dan report pengiriman.
            </p>
          </div>
        </div>

        <div v-if="canEdit" class="flex flex-wrap gap-3">
          <Button type="button" variant="outline" :disabled="isRefreshing" @click="refreshSourceData">
            <RefreshCcwIcon :class="['mr-2 h-4 w-4', isRefreshing ? 'animate-spin' : '']" />
            Refresh Sumber
          </Button>
          <Button type="button" :disabled="isSaving" @click="saveDocument">
            <SaveIcon class="mr-2 h-4 w-4" />
            {{ isSaving ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </Button>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="flex min-h-[320px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
      <LoaderCircleIcon class="h-8 w-8 animate-spin text-slate-400" />
    </div>

    <template v-else-if="detail">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card class="border-slate-200 shadow-sm">
          <CardHeader class="pb-2">
            <CardDescription>Buyer</CardDescription>
            <CardTitle class="text-xl text-slate-900">{{ detail.header.buyer || '-' }}</CardTitle>
          </CardHeader>
          <CardContent class="text-sm text-slate-500">{{ detail.header.style || '-' }}</CardContent>
        </Card>
        <Card class="border-slate-200 shadow-sm">
          <CardHeader class="pb-2">
            <CardDescription>No PO</CardDescription>
            <CardTitle class="text-xl text-slate-900">{{ detail.header.no_po || '-' }}</CardTitle>
          </CardHeader>
          <CardContent class="text-sm text-slate-500">Jasa {{ detail.header.jasa }}</CardContent>
        </Card>
        <Card class="border-slate-200 shadow-sm">
          <CardHeader class="pb-2">
            <CardDescription>Qty PO</CardDescription>
            <CardTitle class="text-xl text-slate-900">{{ formatNumber(detail.header.qty_po) }}</CardTitle>
          </CardHeader>
          <CardContent class="text-sm text-slate-500">Plan cut {{ formatNumber(detail.header.plan_cut_total) }}</CardContent>
        </Card>
        <Card class="border-slate-200 shadow-sm">
          <CardHeader class="pb-2">
            <CardDescription>Delivery</CardDescription>
            <CardTitle class="text-xl text-slate-900">{{ formatDate(detail.header.delivery) }}</CardTitle>
          </CardHeader>
          <CardContent class="text-sm text-slate-500">WO {{ detail.header.id_wo }}</CardContent>
        </Card>
      </div>

      <Card class="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Ringkasan Header</CardTitle>
          <CardDescription>Snapshot sumber utama saat rekonsiliasi dibentuk.</CardDescription>
        </CardHeader>
        <CardContent class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Nama Bahan</p>
            <p class="mt-2 text-sm font-medium text-slate-800">{{ detail.header.nama_bahan || '-' }}</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Cons / Baju</p>
            <p class="mt-2 text-sm font-medium text-slate-800">{{ detail.header.cons_baju_summary || '-' }}</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Warna Kain</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <span
                v-for="warna in detail.header.warna_kain_summary"
                :key="warna"
                class="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
              >
                {{ warna }}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Ringkasan Warna</CardTitle>
          <CardDescription>
            Diambil dari warna work order yang dipadukan dengan qty report pengiriman.
          </CardDescription>
        </CardHeader>
        <CardContent class="grid gap-4 xl:grid-cols-2">
          <div
            v-for="summary in detail.color_summaries"
            :key="summary.color"
            class="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 class="text-lg font-semibold text-slate-900">{{ summary.color }}</h3>
                <p class="text-sm text-slate-500">Qty Order {{ formatNumber(summary.qty_order) }} | Qty Kirim {{ formatNumber(summary.qty_kirim) }}</p>
              </div>
              <span
                class="inline-flex rounded-full border px-3 py-1 text-xs font-semibold"
                :class="colorBalanceTone(summary)"
              >
                Balance {{ formatNumber(summary.balance) }}
              </span>
            </div>

            <div class="mt-4 overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th class="pb-2 text-left font-semibold">Size</th>
                    <th class="pb-2 text-right font-semibold">Order</th>
                    <th class="pb-2 text-right font-semibold">Kirim</th>
                    <th class="pb-2 text-right font-semibold">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in summary.size_breakdown" :key="`${summary.color}-${item.size}`" class="border-b border-slate-100 last:border-b-0">
                    <td class="py-2 font-medium text-slate-800">{{ item.size }}</td>
                    <td class="py-2 text-right text-slate-600">{{ formatNumber(item.qty_order) }}</td>
                    <td class="py-2 text-right text-slate-600">{{ formatNumber(item.qty_kirim) }}</td>
                    <td class="py-2 text-right text-slate-700">{{ formatNumber(item.balance) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-semibold text-slate-900">Detail Material Rekonsiliasi</h2>
            <p class="text-sm text-slate-500">
              Isi manual ada di ratio input, qty/pcs, qty actual kirim manual, terima, reject, retur, dan keterangan.
            </p>
          </div>
        </div>

        <Card
          v-for="row in editableRows"
          :key="row.id_rekonsiliasi_material_row"
          class="border-slate-200 shadow-sm"
        >
          <CardHeader class="pb-4">
            <div class="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div class="space-y-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-slate-900 px-3 text-xs font-bold text-white">
                    {{ row.row_no }}
                  </span>
                  <span
                    class="inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                    :class="rowKindTone(row.kategori)"
                  >
                    {{ row.kategori }}
                  </span>
                </div>
                <div>
                  <CardTitle class="text-xl text-slate-900">{{ row.description || '-' }}</CardTitle>
                  <CardDescription class="mt-1">
                    Size/warna {{ row.size_label || '-' }} | Satuan {{ row.satuan || '-' }}
                  </CardDescription>
                </div>
              </div>

              <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Total Terima</p>
                  <p class="mt-1 text-base font-semibold text-slate-900">{{ formatNumber(computeTotalTerima(row)) }}</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Qty Actual Kirim</p>
                  <p class="mt-1 text-base font-semibold text-slate-900">{{ formatNumber(computeQtyActualKirim(row)) }}</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Cons Actual</p>
                  <p class="mt-1 text-base font-semibold text-slate-900">{{ formatNumber(computeConsActual(row)) }}</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Balance</p>
                  <p class="mt-1 text-base font-semibold text-slate-900">{{ formatNumber(computeBalance(row)) }}</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Last Balance</p>
                  <p class="mt-1 text-base font-semibold text-slate-900">{{ formatNumber(computeLastBalance(row)) }}</p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent class="space-y-6">
            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Ratio Source</p>
                <p class="mt-1 text-base font-semibold text-slate-900">{{ formatNumber(row.ratio_source) }}</p>
              </div>
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Qty WO</p>
                <p class="mt-1 text-base font-semibold text-slate-900">{{ formatNumber(row.qty_wo) }}</p>
              </div>
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Toleransi</p>
                <p class="mt-1 text-base font-semibold text-slate-900">{{ formatNumber(row.toleransi) }}</p>
              </div>
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Qty Kirim Source</p>
                <p class="mt-1 text-base font-semibold text-slate-900">{{ formatNumber(row.qty_actual_kirim_source) }}</p>
              </div>
            </div>

            <Separator />

            <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              <div class="space-y-2">
                <label class="text-sm font-medium text-slate-700">Ratio Input</label>
                <input
                  v-model.number="row.ratio_input"
                  :disabled="!canEdit"
                  type="number"
                  step="0.01"
                  class="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none ring-0 transition focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                >
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-slate-700">Qty / PCS</label>
                <input
                  v-model.number="row.qty_per_pcs_input"
                  :disabled="!canEdit"
                  type="number"
                  step="0.01"
                  class="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none ring-0 transition focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                >
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-slate-700">Qty Actual Kirim Manual</label>
                <input
                  v-model.number="row.qty_actual_kirim_manual"
                  :disabled="!canEdit"
                  type="number"
                  min="0"
                  class="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none ring-0 transition focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                >
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-slate-700">Reject</label>
                <input
                  v-model.number="row.reject_qty"
                  :disabled="!canEdit"
                  type="number"
                  min="0"
                  class="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none ring-0 transition focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                >
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-slate-700">Retur</label>
                <input
                  v-model.number="row.retur_qty"
                  :disabled="!canEdit"
                  type="number"
                  min="0"
                  class="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none ring-0 transition focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                >
              </div>
              <div class="space-y-2 lg:col-span-2 xl:col-span-1">
                <label class="text-sm font-medium text-slate-700">Keterangan</label>
                <Textarea
                  v-model="row.keterangan"
                  :disabled="!canEdit"
                  class="min-h-[96px] border-slate-200 resize-none disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
            </div>

            <Separator />

            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-base font-semibold text-slate-900">Input Terima</h3>
                  <p class="text-sm text-slate-500">
                    `awal` dan `ambil` menambah total terima, sedangkan `untuk` mengurangi total terima.
                  </p>
                </div>
                <Button v-if="canEdit" type="button" variant="outline" size="sm" @click="addTerimaEntry(row)">
                  <PlusIcon class="mr-1 h-4 w-4" />
                  Tambah Entry
                </Button>
              </div>

              <div v-if="row.terima_entries.length" class="space-y-3">
                <div
                  v-for="(entry, index) in row.terima_entries"
                  :key="`${row.id_rekonsiliasi_material_row}-${index}-${entry.id_rekonsiliasi_terima_entry ?? 'new'}`"
                  class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div class="grid gap-3 xl:grid-cols-[160px_minmax(0,1fr)_160px_minmax(0,1fr)_auto] xl:items-start">
                    <div class="space-y-2">
                      <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Jenis Entry</label>
                      <select
                        v-model="entry.entry_type"
                        :disabled="!canEdit"
                        class="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                      >
                        <option value="awal">Awal</option>
                        <option value="untuk">Untuk</option>
                        <option value="ambil">Ambil</option>
                      </select>
                    </div>

                    <div class="space-y-2">
                      <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Label</label>
                      <input
                        v-model="entry.entry_label"
                        :disabled="!canEdit"
                        type="text"
                        class="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                      >
                    </div>

                    <div class="space-y-2">
                      <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Qty</label>
                      <input
                        v-model.number="entry.qty"
                        :disabled="!canEdit"
                        type="number"
                        min="0"
                        class="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                      >
                    </div>

                    <div class="space-y-2">
                      <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Catatan</label>
                      <input
                        v-model="entry.note"
                        :disabled="!canEdit"
                        type="text"
                        class="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                      >
                    </div>

                    <div class="flex justify-end xl:pt-7">
                      <Button
                        v-if="canEdit"
                        type="button"
                        variant="ghost"
                        size="icon"
                        class="text-rose-600 hover:text-rose-700"
                        @click="removeTerimaEntry(row, index)"
                      >
                        <Trash2Icon class="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                Belum ada entry terima pada baris ini.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </template>
  </div>
</template>
