<script setup lang="ts">
import { Button } from '@/components/ui/button';
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
  <div class="bg-white p-8 rounded-xl shadow-sm border text-center mt-10 max-w-2xl mx-auto">
    <h1 class="text-3xl font-bold mb-2 text-slate-800">Dashboard Sistem</h1>
    
    <div class="mb-8 mt-4 space-y-2">
      <p class="text-lg text-slate-600">
        HALO! DATA USER: <span class="font-bold text-slate-900">{{ username }}</span>!
      </p>
      
      <span class="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-100 uppercase tracking-wide">
        Akses: {{ props.role }}
      </span>
    </div>

    <Button
        variant="destructive"
        @click="emit('logout')" 
        class="px-6 py-2"
    >
        Keluar (Logout)
    </Button>
  </div>
</template>