<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  ClipboardCheck,
  ClipboardList,
  ShoppingCart,
  Truck,
  Layers3,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { getPOClients } from '@/api/po-clients/po-clients'
import { getPOInternals } from '@/api/po-internals/po-internals'
import { getPRInternals, type PRInternalListItem } from '@/api/pr-internals/pr-internals'
import { getWorkOrders, type WorkOrderListItem } from '@/api/work-orders/work-orders'
import { getPendingApprovals, type ApprovalPendingItem } from '@/api/approvals/approvals'

const poClientCount = ref(0)
const poInternalCount = ref(0)
const prInternalCount = ref(0)
const workOrderCount = ref(0)
const approvals = ref<ApprovalPendingItem[]>([])
const latestWorkOrders = ref<WorkOrderListItem[]>([])
const latestPRs = ref<PRInternalListItem[]>([])

const fetchDashboardData = async () => {
  try {
    const [poClientResult, poInternalResult, prInternalResult, workOrderResult, pendingApprovals] = await Promise.all([
      getPOClients({
        page: 1,
        pageSize: 5,
        sortBy: 'created_at',
        sortDesc: true,
      }),
      getPOInternals({
        limit: 5,
        offset: 0,
      }),
      getPRInternals({
        limit: 5,
        offset: 0,
      }),
      getWorkOrders({
        page: 1,
        pageSize: 5,
        sortBy: 'created_at',
        sortDesc: true,
      }),
      getPendingApprovals(),
    ])

    poClientCount.value = poClientResult.count
    poInternalCount.value = poInternalResult.count
    prInternalCount.value = prInternalResult.count
    workOrderCount.value = workOrderResult.count
    latestWorkOrders.value = workOrderResult.results
    latestPRs.value = prInternalResult.results
    approvals.value = pendingApprovals
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Gagal memuat dashboard manager')
  }
}

onMounted(fetchDashboardData)

const stats = computed(() => [
  {
    title: 'PO Client',
    value: poClientCount.value.toLocaleString(),
    icon: Truck,
    color: 'text-sky-700',
    bg: 'bg-sky-50',
  },
  {
    title: 'PO Internal',
    value: poInternalCount.value.toLocaleString(),
    icon: ShoppingCart,
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
  },
  {
    title: 'PR Internal',
    value: prInternalCount.value.toLocaleString(),
    icon: ClipboardCheck,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
  },
  {
    title: 'Work Order',
    value: workOrderCount.value.toLocaleString(),
    icon: Layers3,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
  },
])
</script>

<template>
  <div class="mt-8 space-y-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div class="mb-4">
      <h2 class="flex items-center text-xl font-bold text-slate-800">
        <Layers3 class="mr-2 h-6 w-6 text-slate-700" />
        Overview Manajerial
      </h2>
      <p class="text-sm text-slate-500">Ringkasan dokumen utama, approval pending, dan snapshot operasional lintas modul.</p>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="stat in stats"
        :key="stat.title"
        class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
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
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 class="flex items-center text-lg font-semibold text-slate-900">
          <ClipboardCheck class="mr-2 h-5 w-5 text-amber-500" />
          Menunggu Approval
        </h3>

        <div v-if="approvals.length > 0" class="mt-5 space-y-3">
          <div
            v-for="item in approvals.slice(0, 5)"
            :key="item.id_otoritas_detail"
            class="rounded-xl border border-amber-100 bg-amber-50/60 p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-semibold text-slate-900">{{ item.nama_tabel_dokumen }} #{{ item.id_dokumen }}</p>
                <p class="mt-1 text-sm text-slate-500">{{ item.doc_summary || 'Dokumen menunggu keputusan approval.' }}</p>
              </div>
              <span class="rounded-full bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                {{ item.tipe_peran }}
              </span>
            </div>
            <div class="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>{{ item.requested_by || 'System' }}</span>
              <span>{{ item.requested_at }}</span>
            </div>
          </div>
        </div>

        <p v-else class="mt-5 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
          Tidak ada approval yang menunggu tindak lanjut saat ini.
        </p>
      </div>

      <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 class="flex items-center text-lg font-semibold text-slate-900">
          <ClipboardList class="mr-2 h-5 w-5 text-emerald-500" />
          Snapshot Operasional
        </h3>

        <div class="mt-5 space-y-5">
          <div>
            <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Work Order Terbaru</p>
            <div v-if="latestWorkOrders.length > 0" class="space-y-3">
              <div
                v-for="item in latestWorkOrders.slice(0, 3)"
                :key="item.id_wo"
                class="rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="font-semibold text-slate-900">WO-{{ item.id_wo }} · {{ item.model }}</p>
                    <p class="mt-1 text-sm text-slate-500">{{ item.buyer }} · {{ item.po_number }}</p>
                  </div>
                  <span class="rounded-full bg-white px-2.5 py-1 text-xs font-semibold uppercase text-slate-700">
                    {{ item.status }}
                  </span>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-slate-500">Belum ada work order terbaru.</p>
          </div>

          <div>
            <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">PR Internal Terbaru</p>
            <div v-if="latestPRs.length > 0" class="space-y-3">
              <div
                v-for="item in latestPRs.slice(0, 3)"
                :key="item.id_pr_internal"
                class="rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="font-semibold text-slate-900">{{ item.nama }}</p>
                    <p class="mt-1 text-sm text-slate-500">{{ item.departemen }} · {{ item.vendor_name }}</p>
                  </div>
                  <span class="rounded-full bg-white px-2.5 py-1 text-xs font-semibold uppercase text-slate-700">
                    {{ item.status }}
                  </span>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-slate-500">Belum ada PR internal terbaru.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
