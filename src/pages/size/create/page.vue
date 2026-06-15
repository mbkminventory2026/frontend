<script setup lang="ts">
import { Ruler } from 'lucide-vue-next';
import { createSize, getSizeById, updateSize } from '@/api/size/size';
import ResourceCreateEditPage from '@/components/pages/ResourceCreateEditPage.vue';

const formSchema = [
  {
    name: 'nama_size',
    label: 'Nama Size',
    placeholder: 'Contoh: S, M, L, XL, Free Size',
    type: 'text',
    required: true,
    rules: 'required'
  },
];
</script>

<template>
  <ResourceCreateEditPage
    resourceName="Size"
    createPermission="MASTER_SIZE_CREATE"
    updatePermission="MASTER_SIZE_UPDATE"
    :getApi="getSizeById"
    :createApi="createSize"
    :updateApi="(id, data) => updateSize(id, data)"
    :formSchema="formSchema"
    :icon="Ruler"
    redirectPath="/size"
    :idExtractor="(data) => data.id_size"
    :payloadProcessor="(data) => {
      const { created_at, ...payload } = data;
      return payload;
    }"
  />
</template>
