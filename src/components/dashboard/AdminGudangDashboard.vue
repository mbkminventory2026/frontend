<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { 
  Package, 
  AlertTriangle, 
  Truck, 
  ArrowRight,
  ClipboardCheck,
  RefreshCw,
  Box,
  FileText
} from 'lucide-vue-next';
import { getWarehouseMetrics, type WarehouseDashboardMetrics } from '@/api/dashboard/warehouse';
import { getPendingApprovals, type PendingApproval } from '@/api/dashboard/finance';

const metrics = ref<WarehouseDashboardMetrics | null>(null);
const pendingApprovals = ref<PendingApproval[]>([]);
const isLoading = ref(true);

const fetchDashboardData = async () => {
  isLoading.value = true;
  try {
    const [warehouseData, approvalsData] = await Promise.all([
      getWarehouseMetrics(),
      getPendingApprovals()
    ]);
    
    metrics.value = warehouseData;
    pendingApprovals.value = approvalsData || [];
  } catch (error) {
    console.error('Error fetching admin gudang dashboard data:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchDashboardData();
});

const stats = computed(() => {
  if (!metrics.value) {
    return [
      { title: 'Total Item Barang', value: '0', icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-100' },
      { title: 'Stok Tipis (Low)', value: '0', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-100' },
      { title: 'Surat Jalan Klien (Bulan Ini)', value: '0', icon: Truck, color: 'text-blue-600', bg: 'bg-blue-100' },
      { title: 'Surat Jalan Internal (Bulan Ini)', value: '0', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-100' }
    ];
  }
  
  return [
    { title: 'Total Item Barang', value: metrics.value.total_items.toLocaleString(), icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { title: 'Stok Tipis (Low)', value: metrics.value.low_stock_alerts_count.toLocaleString(), icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-100' },
    { title: 'Surat Jalan Klien (Bulan Ini)', value: metrics.value.total_surat_jalan_client_this_month.toLocaleString(), icon: Truck, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Surat Jalan Internal (Bulan Ini)', value: metrics.value.total_surat_jalan_internal_this_month.toLocaleString(), icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-100' }
  ];
});

const totalPendingApprovals = computed(() => pendingApprovals.value?.length || 0);

</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Admin Gudang</h2>
        <p class="text-slate-500 text-sm mt-1">Pantau pergerakan stok barang, material, dan pengiriman secara real-time.</p>
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

      <!-- Low Stock Alerts Widget -->
      <div class="bg-white p-6 rounded-xl border border-rose-100 shadow-sm flex flex-col relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
        <div class="flex items-center justify-between mb-6 relative z-10">
          <h3 class="text-lg font-bold text-slate-800 flex items-center">
            <AlertTriangle class="w-5 h-5 mr-2 text-rose-500" />
            Peringatan Stok Tipis
          </h3>
          <router-link to="/inventory" class="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center">
            Cek <ArrowRight class="w-4 h-4 ml-1" />
          </router-link>
        </div>
        
        <div v-if="!metrics || !metrics.low_stock_alerts || metrics.low_stock_alerts.length === 0" class="text-center py-8 text-slate-500 flex-1 flex items-center justify-center relative z-10">
          <div class="flex flex-col items-center">
            <Box class="w-10 h-10 text-emerald-300 mb-2" />
            <span>Semua stok material aman.</span>
          </div>
        </div>
        <div v-else class="space-y-3 flex-1 relative z-10">
          <div v-for="alert in metrics.low_stock_alerts.slice(0,5)" :key="alert.id_rekonsiliasi_material" class="flex justify-between items-start p-3 bg-rose-50/50 rounded-lg border border-rose-100">
            <div>
              <span class="font-bold text-rose-800 block text-sm">{{ alert.description }}</span>
              <span class="text-xs text-rose-600 font-medium mt-1 inline-block">Min: {{ alert.min_stock }} {{ alert.satuan }}</span>
            </div>
            <div class="text-right">
              <span class="text-lg font-black text-rose-600">{{ alert.balance }}</span>
              <span class="text-xs text-rose-500 ml-1">{{ alert.satuan }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Master Barang Widget -->
      <div class="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-bold text-slate-800 flex items-center">
            <Package class="w-5 h-5 mr-2 text-indigo-500" />
            Master Barang Baru
          </h3>
          <router-link to="/inventory" class="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Semua
          </router-link>
        </div>
        
        <div v-if="!metrics || !metrics.recent_barangs || metrics.recent_barangs.length === 0" class="text-sm text-slate-400 py-8 text-center flex-1">
          Belum ada barang baru ditambahkan.
        </div>
        <div v-else class="space-y-3 flex-1">
          <div v-for="brg in metrics.recent_barangs" :key="brg.id_barang" class="flex justify-between items-center text-sm border-b border-slate-50 pb-3 last:border-0">
            <div>
              <span class="font-bold text-slate-700 block">{{ brg.nama_barang }}</span>
              <span class="text-xs text-slate-500 font-mono">{{ brg.kode }}</span>
            </div>
            <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium">{{ brg.created_at }}</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
