<!-- 
ini adalah file skeleton yang berisi kumpulan skeleton komponen untuk digunakan di seluruh aplikasi saat mengambil data (loading state).

Kriteria Desain & Teknis Skeleton:
1. Fleksibilitas Ukuran (Sizing Fill): Lebar dan tinggi skeleton harus bersifat responsif dan mengisi (fill) container induknya (menggunakan class CSS w-full, h-full, atau flexbox).
2. Adaptabilitas Struktur: Komponen tidak boleh memiliki ukuran statis (pixel hardcoded) agar dapat menyesuaikan dengan tata letak container aslinya tanpa merusak layout.
3. Kualitas Visual (Premium Design): Sesuai dengan estetika desain Permatatex, skeleton menggunakan animasi pulsasi halus bawaan PrimeVue.
4. Multiguna (Reusability): Menyediakan beberapa template skeleton (seperti 'table-cell', 'text', 'card', 'circle') yang diatur melalui properti `type`.
-->
<script setup lang="ts">
import Skeleton from 'primevue/skeleton';

interface Props {
  type?: 'table-cell' | 'text' | 'card' | 'circle'
}

withDefaults(defineProps<Props>(), {
  type: 'table-cell'
});
</script>

<template>
  <div class="w-full h-full flex items-center justify-center">
    <template v-if="type === 'table-cell'">
      <!-- Mengisi lebar sel tabel secara responsif -->
      <Skeleton class="w-full h-4" />
    </template>
    <template v-else-if="type === 'text'">
      <!-- Mengisi lebar baris teks secara responsif -->
      <Skeleton class="w-full h-3" />
    </template>
    <template v-else-if="type === 'circle'">
      <!-- Lingkaran (avatar/icon) -->
      <Skeleton shape="circle" class="w-8 h-8" />
    </template>
    <template v-else-if="type === 'card'">
      <!-- Mengisi card container penuh -->
      <Skeleton class="w-full h-full min-h-[150px]" />
    </template>
  </div>
</template>
