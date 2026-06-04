<script setup lang="ts">
import { Building } from 'lucide-vue-next';
import { createMitra, getMitraById, updateMitra } from '@/api/mitra/mitra';
import ResourceCreateEditPage from '@/components/pages/ResourceCreateEditPage.vue';

const formSchema = [
  {
    name: 'nama_perusahaan',
    label: 'Nama Perusahaan',
    placeholder: 'Masukkan nama perusahaan',
    type: 'text',
    required: true,
    rules: 'required'
  },
  {
    name: 'email',
    label: 'Email',
    placeholder: 'Masukkan email',
    type: 'email',
    required: true,
    rules: 'required|email'
  },
  {
    name: 'tipe_perusahaan',
    label: 'Tipe Perusahaan',
    placeholder: 'Pilih tipe perusahaan',
    type: 'select',
    required: true,
    rules: 'required'
  },
  {
    name: 'alamat',
    label: 'Alamat',
    placeholder: 'Masukkan alamat',
    type: 'textarea',
    required: true,
    rules: 'required'
  },
  {
    name: 'telepon',
    label: 'Telepon',
    placeholder: 'Masukkan nomor telepon',
    type: 'text',
    required: true,
    rules: 'required'
  },
  {
    name: 'website',
    label: 'Website',
    placeholder: 'Masukkan website',
    type: 'text',
    required: false,
    rules: ''
  }
];
</script>

<template>
  <ResourceCreateEditPage
    resourceName="Mitra"
    createPermission="MASTER_MITRA_CREATE"
    updatePermission="MASTER_MITRA_UPDATE"
    :getApi="getMitraById"
    :createApi="createMitra"
    :updateApi="(id, data) => updateMitra(id, data)"
    :formSchema="formSchema"
    :icon="Building"
    redirectPath="/mitra"
    :idExtractor="(data) => data.id_mitra"
  />
</template>
