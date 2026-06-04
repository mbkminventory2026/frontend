<script setup lang="ts">
import { BuildingIcon } from 'lucide-vue-next';
import { createDepartemen, getDepartemenById, updateDepartemen } from '@/api/departemen/departemen';
import ResourceCreateEditPage from '@/components/pages/ResourceCreateEditPage.vue';

const formSchema = [
  {
    name: 'nama_departemen',
    label: 'Nama Departemen',
    placeholder: 'Masukkan nama departemen',
    type: 'text',
    required: true,
    rules: 'required'
  }
];
</script>

<template>
  <ResourceCreateEditPage
    resourceName="Departemen"
    createPermission="MASTER_DEPARTEMEN_CREATE"
    updatePermission="MASTER_DEPARTEMEN_UPDATE"
    :getApi="getDepartemenById"
    :createApi="createDepartemen"
    :updateApi="(id, data) => updateDepartemen(id, data)"
    :formSchema="formSchema"
    :icon="BuildingIcon"
    redirectPath="/departemen"
    :idExtractor="(data) => data.id_departemen"
  />
</template>
