<script setup lang="ts">
import { computed } from 'vue';
import { Button } from '@/components/ui/button';
import OperatorDashboard from './OperatorDashboard.vue';
import FinanceDashboard from './FinanceDashboard.vue';
import AdminProduksiDashboard from './AdminProduksiDashboard.vue';
import AdminGudangDashboard from './AdminGudangDashboard.vue';
import ManagerDashboard from './ManagerDashboard.vue';
import ClientDashboard from './ClientDashboard.vue';
import trollImage from '@/assets/images/troll_superadmin.png';
const props = defineProps<{
    username?: string;
    role?: string;
}>();

const emit = defineEmits<{
    (e: 'logout'): void;
}>();

const normalizedRole = computed(() => (props.role || '').toUpperCase());
const roleLabel = computed(() => normalizedRole.value.replace(/_/g, ' ') || 'ADMIN');

</script>

<template>
  <div class="mt-6 max-w-7xl mx-auto space-y-6 px-4">
    
    <!-- Welcome Header Card -->
    <div class="bg-white p-6 rounded-xl shadow-sm border relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
      <!-- Decorative top border -->
      <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-sidebar via-sidebar-accent to-sidebar-primary"></div>
      
      <div class="text-center md:text-left">
        <h1 class="text-2xl font-bold mb-1 text-slate-800">Dashboard Sistem</h1>
        <p class="text-slate-600">
          Selamat datang kembali, <span class="font-bold text-slate-900">{{ props.username || 'User' }}</span>!
        </p>
      </div>
      
      <div class="mt-4 md:mt-0 flex items-center space-x-4">
        <div class="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold tracking-wide border border-indigo-100">
          ROLE: {{ roleLabel }}
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
    <!-- Menampilkan Admin Sistem Dashboard khusus untuk Admin Sistem -->
    <OperatorDashboard v-if="normalizedRole === 'ADMIN_SISTEM' || !normalizedRole" />
    
    <FinanceDashboard v-else-if="normalizedRole === 'ADMIN_KEUANGAN'" />
    <AdminProduksiDashboard v-else-if="normalizedRole === 'ADMIN_PRODUKSI'" />
    <AdminGudangDashboard v-else-if="normalizedRole === 'ADMIN_GUDANG'" />
    <ManagerDashboard v-else-if="normalizedRole === 'MANAGER'" />
    <ClientDashboard v-else-if="normalizedRole === 'CLIENT'" />

    <!-- Troll untuk Super Admin -->
    <div v-else-if="normalizedRole === 'SUPER_ADMIN'" class="bg-white p-12 rounded-xl shadow-sm border text-center animate-in fade-in zoom-in duration-500">
      <h3 class="text-2xl font-bold text-slate-800 mb-6">😎 Dashboard {{ roleLabel }} 😎</h3>
      <div class="mx-auto w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden shadow-2xl border-4 border-indigo-500 transform hover:scale-105 transition-transform duration-300">
        <img :src="trollImage" alt="Super Admin Mastermind" class="w-full h-full object-cover" />
      </div>
      <p class="text-slate-600 mt-6 font-medium text-lg">"The system is fully under your control. Proceed with caution."</p>
    </div>

    <!-- Placeholder untuk Role Lain -->
    <div v-else class="bg-white p-12 rounded-xl shadow-sm border text-center">
      <div class="mx-auto w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-slate-800">Dashboard {{ roleLabel }} Belum Tersedia</h3>
      <p class="text-slate-500 mt-1">Modul dashboard untuk role ini sedang dalam tahap pengembangan.</p>
    </div>

  </div>
</template>
