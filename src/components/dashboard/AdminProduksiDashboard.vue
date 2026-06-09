<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { 
  Target, 
  CalendarClock, 
  Layers, 
  Scissors, 
  ArrowRight,
  ClipboardCheck,
  RefreshCw,
  FileText
} from 'lucide-vue-next';
import { getProductionMetrics, type ProductionDashboardMetrics } from '@/api/dashboard/production';
import { getPendingApprovals, type PendingApproval } from '@/api/dashboard/finance'; // Reusing approval fetching logic

const metrics = ref<ProductionDashboardMetrics | null>(null);
const pendingApprovals = ref<PendingApproval[]>([]);
const isLoading = ref(true);

const fetchDashboardData = async () => {
  isLoading.value = true;
  try {
    const [productionData, approvalsData] = await Promise.all([
      getProductionMetrics(),
      getPendingApprovals()
    ]);
    
    metrics.value = productionData;
    pendingApprovals.value = approvalsData || [];
  } catch (error) {
    console.error('Error fetching admin produksi dashboard data:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchDashboardData();
});

// Computed stats array for easy rendering
const stats = computed(() => {
  if (!metrics.value) {
    return [
      { title: 'Target Produksi (Pcs)', value: '0', icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-100' },
      { title: 'Timeline Dibuat (Bulan Ini)', value: '0', icon: CalendarClock, color: 'text-blue-600', bg: 'bg-blue-100' },
      { title: 'Marker Plan (Bulan Ini)', value: '0', icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-100' },
      { title: 'Spreading & Cutting (Bulan Ini)', value: '0', icon: Scissors, color: 'text-purple-600', bg: 'bg-purple-100' }
    ];
  }
  
  return [
    { title: 'Target Produksi (Pcs)', value: metrics.value.target_produksi_pcs.toLocaleString(), icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { title: 'Timeline Dibuat (Bulan Ini)', value: metrics.value.total_timeline_this_month.toLocaleString(), icon: CalendarClock, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Marker Plan (Bulan Ini)', value: metrics.value.total_marker_plan_this_month.toLocaleString(), icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Spreading & Cutting (Bulan Ini)', value: metrics.value.total_spreading_cutting_plan_this_month.toLocaleString(), icon: Scissors, color: 'text-purple-600', bg: 'bg-purple-100' }
  ];
});

// Calculate total approvals for the specific role if needed, currently reusing global approval logic
const totalPendingApprovals = computed(() => pendingApprovals.value?.length || 0);

</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Admin Produksi</h2>
        <p class="text-slate-500 text-sm mt-1">Pantau seluruh perencanaan dan aktivitas produksi secara real-time.</p>
      </div>
      <button 
        @click="fetchDashboardData" 
        class="inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin text-indigo-600': isLoading }" />
        Segarkan Data
      </button>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="stat in stats" :key="stat.title" class="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <component :is="stat.icon" class="w-16 h-16" :class="stat.color" />
        </div>
        <div class="flex items-center justify-between mb-4 relative z-10">
          <div :class="[stat.bg, stat.color]" class="p-3 rounded-lg">
            <component :is="stat.icon" class="w-6 h-6" />
          </div>
        </div>
        <div class="relative z-10">
          <h3 class="text-sm font-medium text-slate-500">{{ stat.title }}</h3>
          <p class="text-2xl font-bold text-slate-800 mt-1">{{ stat.value }}</p>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
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
        
        <div v-if="!pendingApprovals || pendingApprovals.length === 0" class="text-center py-8 text-slate-500 flex-1 flex items-center justify-center">
          Tidak ada dokumen yang menunggu persetujuan Anda saat ini.
        </div>
        <div v-else class="space-y-4 flex-1">
          <div v-for="approval in pendingApprovals.slice(0, 5)" :key="approval.document_id" class="p-4 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between group">
            <div>
              <div class="font-bold text-slate-700">{{ approval.table_name }} #{{ approval.document_id }}</div>
              <div class="text-xs text-slate-500 mt-1">Status saat ini: <span class="font-medium text-amber-600">{{ approval.current_status }}</span></div>
            </div>
            <router-link :to="`/approvals/${approval.table_name.toLowerCase()}/${approval.document_id}`" class="px-3 py-1.5 bg-white border border-slate-200 rounded text-sm font-medium text-indigo-600 shadow-sm group-hover:bg-indigo-50 transition-colors">
              Review
            </router-link>
          </div>
        </div>
      </div>

      <!-- Recent Timelines Widget -->
      <div class="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-bold text-slate-800 flex items-center">
            <CalendarClock class="w-5 h-5 mr-2 text-blue-500" />
            Timeline Terbaru
          </h3>
          <router-link to="/timeline-produksi" class="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center">
            Lihat Semua <ArrowRight class="w-4 h-4 ml-1" />
          </router-link>
        </div>
        
        <div v-if="!metrics || !metrics.recent_timelines || metrics.recent_timelines.length === 0" class="text-center py-8 text-slate-500 flex-1 flex items-center justify-center">
          Belum ada timeline produksi terbaru.
        </div>
        <div v-else class="space-y-3 flex-1">
          <div v-for="tl in metrics.recent_timelines" :key="tl.id_timeline" class="flex justify-between items-start text-sm border-b border-slate-50 pb-3 last:border-0">
            <div>
              <span class="font-medium text-slate-700 block">PO: {{ tl.po_number }}</span>
              <span class="text-xs text-slate-500 block truncate max-w-[200px]" :title="tl.notes">{{ tl.notes || 'Tidak ada catatan' }}</span>
            </div>
            <span class="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">{{ tl.tanggal_disusun }}</span>
          </div>
        </div>
      </div>

      <!-- Recent Plans Widget (Marker & SC) -->
      <div class="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col">
        <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center">
          <FileText class="w-5 h-5 mr-2 text-emerald-500" />
          Dokumen Rencana Terbaru
        </h3>
        
        <div class="space-y-6 flex-1">
          <!-- Marker Plans -->
          <div>
            <div class="flex justify-between items-center mb-3">
              <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Marker Plan</h4>
              <router-link to="/marker-plan" class="text-xs font-medium text-indigo-600 hover:text-indigo-700">Semua</router-link>
            </div>
            <div v-if="!metrics || !metrics.recent_marker_plans || metrics.recent_marker_plans.length === 0" class="text-sm text-slate-400">Belum ada Marker Plan terbaru.</div>
            <div v-else class="space-y-2">
              <div v-for="mp in metrics.recent_marker_plans.slice(0,3)" :key="mp.id_marker_plan" class="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                <span class="font-medium text-slate-700">{{ mp.no_dokumen }} <span class="text-xs font-normal text-slate-400 block">{{ mp.model }} ({{ mp.color }})</span></span>
                <span class="text-xs text-slate-500">{{ mp.tanggal_efektif }}</span>
              </div>
            </div>
          </div>

          <!-- Spreading Cutting Plans -->
          <div>
            <div class="flex justify-between items-center mb-3">
              <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Spreading & Cutting Plan</h4>
              <router-link to="/spreading-cutting-plan" class="text-xs font-medium text-indigo-600 hover:text-indigo-700">Semua</router-link>
            </div>
            <div v-if="!metrics || !metrics.recent_spreading_cutting_plans || metrics.recent_spreading_cutting_plans.length === 0" class="text-sm text-slate-400">Belum ada SC Plan terbaru.</div>
            <div v-else class="space-y-2">
              <div v-for="scp in metrics.recent_spreading_cutting_plans.slice(0,3)" :key="scp.id_spreading_cutting_plan" class="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                <span class="font-medium text-slate-700">{{ scp.no_dokumen }} <span class="text-xs font-normal text-slate-400 block">{{ scp.model }}</span></span>
                <span class="text-xs text-slate-500">{{ scp.tanggal_efektif }}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
