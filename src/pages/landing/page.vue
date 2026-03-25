<script setup lang="ts">
import { Link } from '@tanstack/vue-router';
import { Button } from '@/components/ui/button';
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
    <div class="max-w-2xl text-center">
      <h1 class="text-5xl font-extrabold text-slate-900 mb-6">
        Sistem Inventaris
      </h1>
      <p class="text-lg text-slate-600 mb-10">
        Kelola stok barang, pantau pergerakan aset, dan optimalkan efisiensi gudang Anda dalam satu platform terpadu.
      </p>
      
      <div class="flex justify-center gap-4">
        <Button 
          to="/login" >
          Masuk ke Sistem
        </Button>
      </div>
    </div>
  </div>
</template>