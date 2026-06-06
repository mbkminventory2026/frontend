<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  ClipboardList, 
  Target, 
  TrendingUp, 
  Activity
} from 'lucide-vue-next';
import { getOperatorMetrics, type OperatorDashboardMetrics, type OngoingWorkOrder } from '@/api/dashboard/operator';

const metrics = ref<OperatorDashboardMetrics | null>(null);
const activeWO = ref<OngoingWorkOrder[]>([]);

const fetchMetrics = async () => {
  try {
    const data = await getOperatorMetrics();
    metrics.value = data;
    activeWO.value = data.ongoing_work_orders || [];
  } catch (error) {
    console.error('Failed to fetch operator metrics', error);
  }
};

onMounted(() => {
  fetchMetrics();
});

const stats = computed(() => {
  if (!metrics.value) return [
    { title: 'Work Order Aktif', value: '0', icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Target Produksi (Pcs)', value: '0', icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { title: 'Output Hari Ini', value: '0', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Rasio Reject (QC)', value: '0%', icon: Activity, color: 'text-rose-600', bg: 'bg-rose-100' }
  ];
  return [
    { title: 'Work Order Aktif', value: metrics.value.active_work_orders.toLocaleString(), icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Target Produksi (Pcs)', value: metrics.value.target_produksi_pcs.toLocaleString(), icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { title: 'Output Hari Ini', value: metrics.value.output_hari_ini.toLocaleString(), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Rasio Reject (QC)', value: `${(metrics.value.rasio_reject * 100).toFixed(1)}%`, icon: Activity, color: 'text-rose-600', bg: 'bg-rose-100' }
  ];
});

</script>

<template>
  <div class="mt-8 text-left space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    
    <!-- Title Operator Dashboard -->
    <div class="mb-4">
      <h2 class="text-xl font-bold text-slate-800 flex items-center">
        <Activity class="w-6 h-6 mr-2 text-indigo-600" />
        Overview Produksi Harian
      </h2>
      <p class="text-sm text-slate-500">Pantau produktivitas jalur garmen dan target Work Order secara real-time.</p>
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

    <div class="grid grid-cols-1 gap-6">
      
      <!-- Progress Bar WO -->
      <div class="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center">
          <Target class="w-5 h-5 mr-2 text-slate-500" />
          Progress Work Order Berjalan
        </h3>
        <div class="space-y-6">
          <div v-for="wo in activeWO" :key="wo.id_wo" class="space-y-2 group">
            <div class="flex justify-between items-center text-sm">
              <span class="font-bold text-slate-700">
                WO-{{ wo.id_wo }} 
                <span class="font-normal text-slate-500 ml-1">· {{ wo.buyer }} ({{ wo.model }})</span>
              </span>
              <span class="font-semibold text-slate-700">{{ wo.total_output.toLocaleString() }} <span class="text-slate-400 font-normal">/ {{ (wo.qty || 0).toLocaleString() }} Pcs</span></span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div 
                class="bg-indigo-600 h-3 rounded-full transition-all duration-1000 ease-out group-hover:bg-indigo-500" 
                :style="{ width: Math.min((wo.total_output / (wo.qty || 1)) * 100, 100) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>



    </div>
  </div>
</template>
