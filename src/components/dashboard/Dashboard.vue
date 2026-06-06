<script setup lang="ts">
import { Button } from '@/components/ui/button';
import OperatorDashboard from './OperatorDashboard.vue';
// import { useDashboard } from '@/composables/dashboard/useDashboard';
// Mendefinisikan props dengan benar
const props = defineProps<{
    username?: string;
    role?: string;
}>();

// Mendefinisikan emits
const emit = defineEmits<{
    (e: 'logout'): void;
}>();

</script>

<template>
  <div class="mt-6 max-w-7xl mx-auto space-y-6 px-4">
    
    <!-- Welcome Header Card -->
    <div class="bg-white p-6 rounded-xl shadow-sm border relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
      <!-- Decorative top border -->
      <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-sky-400"></div>
      
      <div class="text-center md:text-left">
        <h1 class="text-2xl font-bold mb-1 text-slate-800">Dashboard Sistem</h1>
        <p class="text-slate-600">
          Selamat datang kembali, <span class="font-bold text-slate-900">{{ props.username || 'User' }}</span>!
        </p>
      </div>
      
      <div class="mt-4 md:mt-0 flex items-center space-x-4">
        <div class="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold tracking-wide border border-indigo-100">
          ROLE: {{ props.username === 'operator' ? 'OPERATOR' : (props.role?.toUpperCase() || 'ADMIN') }}
        </div>
        <Button
            variant="destructive"
            @click="emit('logout')" 
            class="px-5 shadow-sm"
        >
            Logout
        </Button>
      </div>
    </div>

    <!-- Role-Specific Dashboard Views -->
    <!-- Menampilkan Operator Dashboard khusus untuk Admin Produksi atau Operator -->
    <OperatorDashboard v-if="props.role === 'Admin Produksi' || props.role === 'Operator' || props.username === 'operator' || !props.role" />
    
    <!-- Placeholder untuk Role Lain -->
    <div v-else class="bg-white p-12 rounded-xl shadow-sm border text-center">
      <div class="mx-auto w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-slate-800">Dashboard {{ props.role }} Belum Tersedia</h3>
      <p class="text-slate-500 mt-1">Modul dashboard untuk role ini sedang dalam tahap pengembangan.</p>
    </div>

  </div>
</template>