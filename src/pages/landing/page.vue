<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/vue-router';
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
        <Link
          to="/login" >
          <Button
          variant="outline"
          >
            Masuk ke Sistem
          </Button>
        </Link>
      </div>
    </div>
  </div>
</template>