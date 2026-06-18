<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  ClipboardCheck, 
  ShoppingCart, 
  TrendingUp, 
  DollarSign,
  Clock,
  ArrowRight
} from 'lucide-vue-next';
import { getFinanceMetrics, getPendingApprovals, type FinanceDashboardMetrics, type PendingApproval } from '@/api/dashboard/finance';

const metrics = ref<FinanceDashboardMetrics | null>(null);
const pendingApprovals = ref<PendingApproval[]>([]);

const fetchMetrics = async () => {
  try {
    const data = await getFinanceMetrics();
    metrics.value = data;
  } catch (error) {
    console.error('Failed to fetch finance metrics', error);
  }
};

const fetchApprovals = async () => {
  try {
    const data = await getPendingApprovals();
    pendingApprovals.value = data || [];
  } catch (error) {
    console.error('Failed to fetch pending approvals', error);
  }
};

onMounted(() => {
  fetchMetrics();
  fetchApprovals();
});

const stats = computed(() => {
  if (!metrics.value) return [
    { title: 'Menunggu Approval (PR/PO)', value: '0', icon: ClipboardCheck, color: 'text-amber-600', bg: 'bg-amber-100' },
    { title: 'Total PO Client (Bulan Ini)', value: '0', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'PO Internal (Bulan Ini)', value: '0', icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'PR Internal (Bulan Ini)', value: '0', icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-100' }
  ];
  return [
    { title: 'Menunggu Approval (PR/PO)', value: (pendingApprovals.value?.length || 0).toLocaleString(), icon: ClipboardCheck, color: 'text-amber-600', bg: 'bg-amber-100' },
    { title: 'Total PO Client (Bulan Ini)', value: metrics.value.total_po_client_this_month.toLocaleString(), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'PO Internal (Bulan Ini)', value: metrics.value.total_po_internal_this_month.toLocaleString(), icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'PR Internal (Bulan Ini)', value: metrics.value.total_pr_internal_this_month.toLocaleString(), icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-100' }
  ];
});

</script>

<template>
  <div class="mt-8 text-left space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    
    <!-- Title Finance Dashboard -->
    <div class="mb-4">
      <h2 class="text-xl font-bold text-slate-800 flex items-center">
        <DollarSign class="w-6 h-6 mr-2 text-emerald-600" />
        Overview Keuangan & Pembelian
      </h2>
      <p class="text-sm text-slate-500">Pantau dokumen yang menunggu persetujuan dan ringkasan aktivitas bulan ini.</p>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="(stat, idx) in stats" :key="idx" class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center space-x-4">
        <div :class="['p-3 rounded-lg', stat.bg, stat.color]">
          <component :is="stat.icon" class="w-6 h-6" />
        </div>
        <div>
          <p class="text-sm text-slate-500 font-medium">{{ stat.title }}</p>
          <h3 class="text-2xl font-bold text-slate-800">{{ stat.value }}</h3>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <!-- Pending Approvals -->
      <div class="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-lg font-bold text-slate-800 flex items-center">
            <Clock class="w-5 h-5 mr-2 text-amber-500" />
            Menunggu Persetujuan Anda
          </h3>
          <router-link to="/approvals" class="text-sm text-indigo-600 font-medium flex items-center hover:text-indigo-700">
            Lihat Semua <ArrowRight class="w-4 h-4 ml-1" />
          </router-link>
        </div>
        <div v-if="!pendingApprovals || pendingApprovals.length === 0" class="text-center py-8 text-slate-500 flex-1 flex items-center justify-center">
          Tidak ada dokumen yang menunggu persetujuan.
        </div>
        <div v-else class="space-y-4 flex-1">
          <div v-for="approval in pendingApprovals.slice(0, 5)" :key="`${approval.table_name}-${approval.document_id}`" class="p-4 rounded-lg border border-slate-100 bg-slate-50 flex justify-between items-center group hover:border-indigo-200 transition-colors">
            <div>
              <div class="font-bold text-slate-700">{{ approval.table_name }} #{{ approval.document_id }}</div>
              <div class="text-xs text-slate-500 mt-1">Status saat ini: <span class="font-medium text-amber-600">{{ approval.current_status }}</span></div>
            </div>
            <router-link to="/approvals" class="px-3 py-1.5 bg-white border border-slate-200 rounded text-sm font-medium text-indigo-600 shadow-sm group-hover:bg-indigo-50 transition-colors">
              Review
            </router-link>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col">
        <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center">
          <ClipboardCheck class="w-5 h-5 mr-2 text-slate-500" />
          Aktivitas Terbaru
        </h3>
        
        <div class="space-y-6 flex-1" v-if="metrics">
          <div>
            <h4 class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">PO Client Masuk</h4>
            <div v-if="!metrics.recent_po_clients || metrics.recent_po_clients.length === 0" class="text-sm text-slate-400">Belum ada PO Client terbaru.</div>
            <div v-else class="space-y-2">
              <div v-for="po in metrics.recent_po_clients" :key="po.id_po_client" class="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                <span class="font-medium text-slate-700">{{ po.po_number }} <span class="text-slate-400 font-normal">({{ po.mitra_name }})</span></span>
                <span class="text-slate-500">{{ po.tanggal }}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">PO Internal Dibuat</h4>
            <div v-if="!metrics.recent_po_internals || metrics.recent_po_internals.length === 0" class="text-sm text-slate-400">Belum ada PO Internal terbaru.</div>
            <div v-else class="space-y-2">
              <div v-for="poi in metrics.recent_po_internals" :key="poi.id_po_internal" class="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                <span class="font-medium text-slate-700">{{ poi.nama_po }} <span class="text-slate-400 font-normal">({{ poi.supplier_name }})</span></span>
                <span class="text-slate-500">{{ poi.tanggal }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
