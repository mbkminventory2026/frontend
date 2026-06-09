<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { 
  Target, 
  CalendarClock, 
  Layers, 
  Scissors, 
  ClipboardCheck,
  RefreshCw,
  FileText,
  ClipboardList,
  Factory,
  PackageCheck,
  Shirt,
  Gauge
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { getProductionMetrics, type ProductionDashboardMetrics } from '@/api/dashboard/production';
import { getPendingApprovals, type PendingApproval } from '@/api/dashboard/finance';
import { getPOClients } from '@/api/po-clients/po-clients';
import { getWorkOrders, type WorkOrderListItem } from '@/api/work-orders/work-orders';
import { getProductionSummary } from '@/api/production/production';
import { getPackingLists } from '@/api/packing-list/packing-list';
import type { ProductionAggregateResponse } from '@/schemas/production/production';

const metrics = ref<ProductionDashboardMetrics | null>(null);
const pendingApprovals = ref<PendingApproval[]>([]);
const poClientCount = ref(0);
const workOrders = ref<WorkOrderListItem[]>([]);
const workOrderCount = ref(0);
const productionItems = ref<ProductionAggregateResponse[]>([]);
const productionCount = ref(0);
const packingListCount = ref(0);

const isLoading = ref(true);

const fetchDashboardData = async () => {
  isLoading.value = true;
  try {
    const [
      productionData, 
      approvalsData,
      poResult, 
      woResult, 
      productionResult, 
      packingResult
    ] = await Promise.all([
      getProductionMetrics(),
      getPendingApprovals(),
      getPOClients({ page: 1, pageSize: 6, sortBy: 'created_at', sortDesc: true }),
      getWorkOrders({ page: 1, pageSize: 6, sortBy: 'created_at', sortDesc: true }),
      getProductionSummary({ page: 1, limit: 6 }),
      getPackingLists({ page: 1, pageSize: 6, sortBy: 'created_at', sortDesc: true }),
    ]);
    
    metrics.value = productionData;
    pendingApprovals.value = approvalsData || [];
    poClientCount.value = poResult.count || 0;
    workOrders.value = woResult.results || [];
    workOrderCount.value = woResult.count || 0;
    productionItems.value = productionResult.items || [];
    productionCount.value = productionResult.pagination?.total || productionResult.items?.length || 0;
    packingListCount.value = packingResult.count || 0;

  } catch (error: any) {
    console.error('Error fetching admin produksi dashboard data:', error);
    toast.error(error.response?.data?.message || 'Gagal memuat dashboard admin produksi');
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchDashboardData();
});

const stats = computed(() => {
  // We use fallback zeros if metrics is null, but for others we use the ref value
  const targetPcs = metrics.value?.target_produksi_pcs || 0;
  const timelineCount = metrics.value?.total_timeline_this_month || 0;
  const markerCount = metrics.value?.total_marker_plan_this_month || 0;
  const scCount = metrics.value?.total_spreading_cutting_plan_this_month || 0;

  return [
    { title: 'Target Produksi (Pcs)', value: targetPcs.toLocaleString(), icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { title: 'Timeline Dibuat (Bln Ini)', value: timelineCount.toLocaleString(), icon: CalendarClock, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Marker Plan (Bln Ini)', value: markerCount.toLocaleString(), icon: Layers, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'SC Plan (Bln Ini)', value: scCount.toLocaleString(), icon: Scissors, color: 'text-rose-600', bg: 'bg-rose-100' },
    
    { title: 'PO Client Aktif', value: poClientCount.value.toLocaleString(), icon: Shirt, color: 'text-sky-700', bg: 'bg-sky-50' },
    { title: 'Total Work Order', value: workOrderCount.value.toLocaleString(), icon: ClipboardList, color: 'text-indigo-700', bg: 'bg-indigo-50' },
    { title: 'Proses Produksi', value: productionCount.value.toLocaleString(), icon: Factory, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { title: 'Packing List', value: packingListCount.value.toLocaleString(), icon: PackageCheck, color: 'text-amber-700', bg: 'bg-amber-50' }
  ];
});

const totalPendingApprovals = computed(() => pendingApprovals.value?.length || 0);
const latestProductionRows = computed(() => productionItems.value.slice(0, 5));
const latestWorkOrders = computed(() => workOrders.value.slice(0, 5));

const getProgress = (item: ProductionAggregateResponse) => {
  if (!item.target_qty) return 0;
  return Math.min((item.production.packing / item.target_qty) * 100, 100);
};

</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Admin Produksi</h2>
        <p class="text-slate-500 text-sm mt-1">Pantau seluruh perencanaan, otorisasi, dan progres produksi secara real-time.</p>
      </div>
      <button 
        @click="fetchDashboardData" 
        class="inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin text-indigo-600': isLoading }" />
        Segarkan Data
      </button>
    </div>

    <!-- Stats Grid (8 items total: 4 planning, 4 execution) -->
    <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
      <div v-for="stat in stats" :key="stat.title" class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div class="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <component :is="stat.icon" class="w-12 h-12" :class="stat.color" />
        </div>
        <div class="flex items-center justify-between mb-3 relative z-10">
          <div :class="[stat.bg, stat.color]" class="p-2 rounded-lg">
            <component :is="stat.icon" class="w-5 h-5" />
          </div>
        </div>
        <div class="relative z-10">
          <h3 class="text-xs font-medium text-slate-500 line-clamp-1" :title="stat.title">{{ stat.title }}</h3>
          <p class="text-xl font-bold text-slate-800 mt-1">{{ stat.value }}</p>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <!-- LEFT COLUMN: Planning & Approvals -->
      <div class="space-y-6">
        <!-- Pending Approvals Widget -->
        <div class="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-bold text-slate-800 flex items-center">
              <ClipboardCheck class="w-5 h-5 mr-2 text-amber-500" />
              Menunggu Persetujuan
            </h3>
            <span v-if="totalPendingApprovals > 0" class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
              {{ totalPendingApprovals }}
            </span>
          </div>
          
          <div v-if="!pendingApprovals || pendingApprovals.length === 0" class="text-center py-6 text-slate-500">
            Tidak ada dokumen yang menunggu persetujuan Anda saat ini.
          </div>
          <div v-else class="space-y-3">
            <div v-for="approval in pendingApprovals.slice(0, 4)" :key="approval.document_id" class="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between group">
              <div>
                <div class="font-bold text-slate-700 text-sm">{{ approval.table_name }} #{{ approval.document_id }}</div>
                <div class="text-xs text-slate-500 mt-1">Status: <span class="font-medium text-amber-600">{{ approval.current_status }}</span></div>
              </div>
              <router-link :to="`/approvals/${approval.table_name.toLowerCase()}/${approval.document_id}`" class="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-indigo-600 shadow-sm hover:bg-indigo-50 transition-colors">
                Review
              </router-link>
            </div>
          </div>
        </div>

        <!-- Recent Plans Widget (Marker & SC) -->
        <div class="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col">
          <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <FileText class="w-5 h-5 mr-2 text-emerald-500" />
            Dokumen Rencana Terbaru
          </h3>
          
          <div class="space-y-5">
            <!-- Marker Plans -->
            <div>
              <div class="flex justify-between items-center mb-2">
                <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Marker Plan</h4>
                <router-link to="/marker-plan" class="text-xs font-medium text-indigo-600 hover:text-indigo-700">Semua</router-link>
              </div>
              <div v-if="!metrics || !metrics.recent_marker_plans || metrics.recent_marker_plans.length === 0" class="text-xs text-slate-400">Belum ada Marker Plan terbaru.</div>
              <div v-else class="space-y-2">
                <div v-for="mp in metrics.recent_marker_plans.slice(0,3)" :key="mp.id_marker_plan" class="flex justify-between items-center text-xs border-b border-slate-50 pb-2">
                  <span class="font-medium text-slate-700">{{ mp.no_dokumen }} <span class="text-slate-400">({{ mp.model }})</span></span>
                  <span class="text-slate-500">{{ mp.tanggal_efektif }}</span>
                </div>
              </div>
            </div>

            <!-- Spreading Cutting Plans -->
            <div>
              <div class="flex justify-between items-center mb-2">
                <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Spreading & Cutting Plan</h4>
                <router-link to="/spreading-cutting-plan" class="text-xs font-medium text-indigo-600 hover:text-indigo-700">Semua</router-link>
              </div>
              <div v-if="!metrics || !metrics.recent_spreading_cutting_plans || metrics.recent_spreading_cutting_plans.length === 0" class="text-xs text-slate-400">Belum ada SC Plan terbaru.</div>
              <div v-else class="space-y-2">
                <div v-for="scp in metrics.recent_spreading_cutting_plans.slice(0,3)" :key="scp.id_spreading_cutting_plan" class="flex justify-between items-center text-xs border-b border-slate-50 pb-2">
                  <span class="font-medium text-slate-700">{{ scp.no_dokumen }} <span class="text-slate-400">({{ scp.model }})</span></span>
                  <span class="text-slate-500">{{ scp.tanggal_efektif }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN: Execution & Progress -->
      <div class="space-y-6">
        <!-- Progress Produksi Widget -->
        <div class="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col">
          <h3 class="flex items-center text-lg font-semibold text-slate-900 mb-6">
            <Gauge class="mr-2 h-5 w-5 text-emerald-500" />
            Ringkasan Progres Produksi
          </h3>

          <div v-if="latestProductionRows.length > 0" class="space-y-4">
            <div
              v-for="item in latestProductionRows"
              :key="item.id_wo_shell_size"
              class="rounded-xl border border-slate-100 bg-slate-50 p-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="font-semibold text-slate-900 text-sm">{{ item.model_name }} · {{ item.size }}</p>
                  <p class="mt-0.5 text-[10px] uppercase tracking-wide text-slate-500">{{ item.status }}</p>
                </div>
                <span class="text-xs font-bold text-slate-700">{{ item.production.packing.toLocaleString() }} / {{ item.target_qty.toLocaleString() }}</span>
              </div>
              <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  class="h-full rounded-full bg-emerald-500 transition-all"
                  :style="{ width: `${getProgress(item)}%` }"
                />
              </div>
              <div class="mt-2 grid grid-cols-4 gap-1 text-[10px] font-medium text-slate-500">
                <span>Cut: {{ item.production.cutting.toLocaleString() }}</span>
                <span>Sew: {{ item.production.sewing.toLocaleString() }}</span>
                <span>Pack: {{ item.production.packing.toLocaleString() }}</span>
                <span>Ship: {{ item.production.shipped.toLocaleString() }}</span>
              </div>
            </div>
          </div>

          <p v-else class="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-center text-slate-500">
            Ringkasan produksi belum tersedia.
          </p>
        </div>

        <!-- Work Order Terbaru Widget -->
        <div class="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col">
          <div class="flex items-center justify-between mb-6">
            <h3 class="flex items-center text-lg font-semibold text-slate-900">
              <ClipboardList class="mr-2 h-5 w-5 text-indigo-500" />
              Work Order Terbaru
            </h3>
            <router-link to="/work-orders" class="text-xs font-medium text-indigo-600 hover:text-indigo-700">Semua</router-link>
          </div>

          <div v-if="latestWorkOrders.length > 0" class="space-y-3">
            <div
              v-for="item in latestWorkOrders"
              :key="item.id_wo"
              class="rounded-xl border border-slate-100 bg-slate-50 p-3"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="font-semibold text-slate-900 text-sm">WO-{{ item.id_wo }} <span class="font-normal text-slate-500">· {{ item.model }}</span></p>
                  <p class="mt-1 text-xs text-slate-500">{{ item.buyer }} · PO {{ item.po_number }}</p>
                </div>
                <span class="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-700 border border-slate-200 shadow-sm">
                  {{ item.status }}
                </span>
              </div>
              <div class="mt-2 flex items-center justify-between text-[11px] font-medium text-indigo-600/80">
                <span>Qty: {{ item.qty.toLocaleString() }} pcs</span>
                <span>Tgt Dlv: {{ item.delivery }}</span>
              </div>
            </div>
          </div>

          <p v-else class="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-center text-slate-500">
            Belum ada work order yang dapat ditampilkan.
          </p>
        </div>

      </div>
    </div>
  </div>
</template>
