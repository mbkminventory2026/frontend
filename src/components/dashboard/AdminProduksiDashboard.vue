<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  ClipboardList,
  Factory,
  PackageCheck,
  Shirt,
  Gauge,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { getPOClients, type POClientListItem } from '@/api/po-clients/po-clients'
import { getWorkOrders, type WorkOrderListItem } from '@/api/work-orders/work-orders'
import { getProductionSummary } from '@/api/production/production'
import { getPackingLists } from '@/api/packing-list/packing-list'
import type { ProductionAggregateResponse } from '@/schemas/production/production'
import type { PackingListListItem } from '@/schemas/packing-list/response'

const poClients = ref<POClientListItem[]>([])
const poClientCount = ref(0)
const workOrders = ref<WorkOrderListItem[]>([])
const workOrderCount = ref(0)
const productionItems = ref<ProductionAggregateResponse[]>([])
const productionCount = ref(0)
const packingLists = ref<PackingListListItem[]>([])
const packingListCount = ref(0)

const fetchDashboardData = async () => {
  try {
    const [poResult, woResult, productionResult, packingResult] = await Promise.all([
      getPOClients({
        page: 1,
        pageSize: 6,
        sortBy: 'created_at',
        sortDesc: true,
      }),
      getWorkOrders({
        page: 1,
        pageSize: 6,
        sortBy: 'created_at',
        sortDesc: true,
      }),
      getProductionSummary({
        page: 1,
        limit: 6,
      }),
      getPackingLists({
        page: 1,
        pageSize: 6,
        sortBy: 'created_at',
        sortDesc: true,
      }),
    ])

    poClients.value = poResult.results
    poClientCount.value = poResult.count
    workOrders.value = woResult.results
    workOrderCount.value = woResult.count
    productionItems.value = productionResult.items || []
    productionCount.value = productionResult.pagination?.total || productionResult.items?.length || 0
    packingLists.value = packingResult.results
    packingListCount.value = packingResult.count
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Gagal memuat dashboard admin produksi')
  }
}

onMounted(fetchDashboardData)

const stats = computed(() => [
  {
    title: 'PO Client Terpantau',
    value: poClientCount.value.toLocaleString(),
    icon: Shirt,
    color: 'text-sky-700',
    bg: 'bg-sky-50',
  },
  {
    title: 'Total Work Order',
    value: workOrderCount.value.toLocaleString(),
    icon: ClipboardList,
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
  },
  {
    title: 'Ringkasan Produksi',
    value: productionCount.value.toLocaleString(),
    icon: Factory,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
  },
  {
    title: 'Packing List',
    value: packingListCount.value.toLocaleString(),
    icon: PackageCheck,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
  },
])

const latestProductionRows = computed(() => productionItems.value.slice(0, 5))
const latestWorkOrders = computed(() => workOrders.value.slice(0, 5))

const getProgress = (item: ProductionAggregateResponse) => {
  if (!item.target_qty) return 0
  return Math.min((item.production.packing / item.target_qty) * 100, 100)
}
</script>

<template>
  <div class="mt-8 space-y-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div class="mb-4">
      <h2 class="flex items-center text-xl font-bold text-slate-800">
        <Factory class="mr-2 h-6 w-6 text-emerald-600" />
        Overview Produksi
      </h2>
      <p class="text-sm text-slate-500">Pantau order client, work order, ringkasan produksi, dan kesiapan packing dalam satu layar.</p>
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
          <ClipboardList class="mr-2 h-5 w-5 text-indigo-500" />
          Work Order Terbaru
        </h3>

        <div v-if="latestWorkOrders.length > 0" class="mt-5 space-y-3">
          <div
            v-for="item in latestWorkOrders"
            :key="item.id_wo"
            class="rounded-xl border border-slate-100 bg-slate-50 p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-semibold text-slate-900">WO-{{ item.id_wo }} · {{ item.model }}</p>
                <p class="mt-1 text-sm text-slate-500">{{ item.buyer }} · PO {{ item.po_number }}</p>
              </div>
              <span class="rounded-full bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                {{ item.status }}
              </span>
            </div>
            <div class="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Qty {{ item.qty.toLocaleString() }} pcs</span>
              <span>Delivery {{ item.delivery }}</span>
            </div>
          </div>
        </div>

        <p v-else class="mt-5 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
          Belum ada work order yang dapat ditampilkan.
        </p>
      </div>

      <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 class="flex items-center text-lg font-semibold text-slate-900">
          <Gauge class="mr-2 h-5 w-5 text-emerald-500" />
          Ringkasan Progres Produksi
        </h3>

        <div v-if="latestProductionRows.length > 0" class="mt-5 space-y-4">
          <div
            v-for="item in latestProductionRows"
            :key="item.id_wo_shell_size"
            class="rounded-xl border border-slate-100 bg-slate-50 p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-semibold text-slate-900">{{ item.model_name }} · {{ item.size }}</p>
                <p class="mt-1 text-xs uppercase tracking-wide text-slate-500">{{ item.status }}</p>
              </div>
              <span class="text-sm font-semibold text-slate-700">{{ item.production.packing.toLocaleString() }} / {{ item.target_qty.toLocaleString() }}</span>
            </div>
            <div class="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                class="h-full rounded-full bg-emerald-500 transition-all"
                :style="{ width: `${getProgress(item)}%` }"
              />
            </div>
            <div class="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 md:grid-cols-4">
              <span>Cutting: {{ item.production.cutting.toLocaleString() }}</span>
              <span>Sewing: {{ item.production.sewing.toLocaleString() }}</span>
              <span>Packing: {{ item.production.packing.toLocaleString() }}</span>
              <span>Shipped: {{ item.production.shipped.toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <p v-else class="mt-5 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
          Ringkasan produksi belum tersedia.
        </p>
      </div>
    </div>
  </div>
</template>
