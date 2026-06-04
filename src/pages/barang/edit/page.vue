<script setup lang="ts">
import { Package } from 'lucide-vue-next';
import { createBarang, getBarangById, updateBarang } from '@/api/barang/barang';
import ResourceCreateEditPage from '@/components/pages/ResourceCreateEditPage.vue';

const formSchema = [
  {
    name: 'kode',
    label: 'Kode Barang',
    placeholder: 'Contoh: BR-001',
    type: 'text',
    required: true,
    rules: 'required'
  },
  {
    name: 'nama_barang',
    label: 'Nama Barang',
    placeholder: 'Masukkan nama barang',
    type: 'text',
    required: true,
    rules: 'required'
  },
  {
    name: 'id_jenis_barang',
    label: 'Jenis Barang',
    placeholder: 'Pilih jenis barang',
    type: 'select',
    required: true,
    rules: 'required'
  },
  {
    name: 'id_mitra',
    label: 'Mitra',
    placeholder: 'Pilih mitra',
    type: 'select',
    required: true,
    rules: 'required'
  }
];
</script>

<template>
  <ResourceCreateEditPage
    resourceName="Barang"
    createPermission="MASTER_BARANG_CREATE"
    updatePermission="MASTER_BARANG_UPDATE"
    :getApi="getBarangById"
    :createApi="createBarang"
    :updateApi="(id, data) => updateBarang(id, data)"
    :formSchema="formSchema"
    :icon="Package"
    redirectPath="/barang"
    :idExtractor="(data) => data.id_barang"
    :payloadProcessor="(data) => {
      const { created_at, nama_jenis_barang, nama_perusahaan, ...payload } = data;
      return payload;
    }"
  />
</template>
