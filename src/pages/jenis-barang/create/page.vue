<script setup lang="ts">
import { Layers } from 'lucide-vue-next';
import { createJenisBarang, getJenisBarangById, updateJenisBarang } from '@/api/jenis-barang/jenis-barang';
import ResourceCreateEditPage from '@/components/pages/ResourceCreateEditPage.vue';

const formSchema = [
  {
    name: 'kode',
    label: 'Kode',
    placeholder: 'Masukkan kode jenis barang',
    type: 'text',
    required: true,
    rules: 'required'
  },
  {
    name: 'nama_jenis_barang',
    label: 'Nama Jenis Barang',
    placeholder: 'Masukkan nama jenis barang',
    type: 'text',
    required: true,
    rules: 'required'
  }
];
</script>

<template>
  <ResourceCreateEditPage
    resourceName="Jenis Barang"
    createPermission="MASTER_JENIS_BARANG_CREATE"
    updatePermission="MASTER_JENIS_BARANG_UPDATE"
    :getApi="getJenisBarangById"
    :createApi="createJenisBarang"
    :updateApi="(id, data) => updateJenisBarang(id, data)"
    :formSchema="formSchema"
    :icon="Layers"
    redirectPath="/jenis-barang"
    :idExtractor="(data) => data.id_jenis_barang"
  />
</template>
