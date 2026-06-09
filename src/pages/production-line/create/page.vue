<script setup lang="ts">
import { FactoryIcon } from 'lucide-vue-next';
import { createProductionLine, getProductionLineById, updateProductionLine } from '@/api/production-master/production-master';
import ResourceCreateEditPage from '@/components/pages/ResourceCreateEditPage.vue';

const formSchema = [
  {
    name: 'name',
    label: 'Nama Line Produksi',
    placeholder: 'Masukkan nama line produksi',
    type: 'text',
    required: true,
    rules: 'required'
  }
];
</script>

<template>
  <ResourceCreateEditPage
    resourceName="Line Produksi"
    createPermission=""
    updatePermission=""
    :getApi="getProductionLineById"
    :createApi="createProductionLine"
    :updateApi="(id, data) => updateProductionLine(id, data)"
    :formSchema="formSchema"
    :icon="FactoryIcon"
    redirectPath="/production-line"
    :idExtractor="(data: any) => data.id_production_line"
  />
</template>
