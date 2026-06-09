<script setup lang="ts">
import { ClipboardListIcon } from 'lucide-vue-next';
import { createProductionStatusPlan, getProductionStatusPlanById, updateProductionStatusPlan } from '@/api/production-master/production-master';
import ResourceCreateEditPage from '@/components/pages/ResourceCreateEditPage.vue';

const formSchema = [
  {
    name: 'name',
    label: 'Nama Status Plan Produksi',
    placeholder: 'Masukkan nama status plan',
    type: 'text',
    required: true,
    rules: 'required'
  }
];
</script>

<template>
  <ResourceCreateEditPage
    resourceName="Status Plan Produksi"
    createPermission=""
    updatePermission=""
    :getApi="getProductionStatusPlanById"
    :createApi="createProductionStatusPlan"
    :updateApi="(id, data) => updateProductionStatusPlan(id, data)"
    :formSchema="formSchema"
    :icon="ClipboardListIcon"
    redirectPath="/production-status-plan"
    :idExtractor="(data: any) => data.id_production_status_plan"
  />
</template>
