<script setup lang="ts">
import { Palette } from 'lucide-vue-next';
import { createWarna, getWarnaById, updateWarna } from '@/api/warna/warna';
import ResourceCreateEditPage from '@/components/pages/ResourceCreateEditPage.vue';

const formSchema = [
  {
    name: 'nama_warna',
    label: 'Nama Warna',
    placeholder: 'Contoh: Merah, Biru, Hijau',
    type: 'text',
    required: true,
    rules: 'required'
  },
  {
    name: 'kode_hex',
    label: 'Kode HEX Warna',
    placeholder: 'Contoh: #FF0000 atau #FFFFFF (Opsional)',
    type: 'text',
    required: false,
    rules: ''
  }
];
</script>

<template>
  <ResourceCreateEditPage
    resourceName="Warna"
    createPermission="MASTER_WARNA_CREATE"
    updatePermission="MASTER_WARNA_UPDATE"
    :getApi="getWarnaById"
    :createApi="createWarna"
    :updateApi="(id, data) => updateWarna(id, data)"
    :formSchema="formSchema"
    :icon="Palette"
    redirectPath="/warna"
    :idExtractor="(data) => data.id_warna"
    :payloadProcessor="(data) => {
      const { created_at, ...payload } = data;
      return payload;
    }"
  />
</template>
