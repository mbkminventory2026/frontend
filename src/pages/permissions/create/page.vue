<script setup lang="ts">
import { Shield } from 'lucide-vue-next';
import { createPermissions, getPermissionsById, updatePermissions } from '@/api/permissions/permissions';
import ResourceCreateEditPage from '@/components/pages/ResourceCreateEditPage.vue';

const formSchema = [
  {
    name: 'nama_permission',
    label: 'Nama Permission',
    placeholder: 'Masukkan nama permission',
    type: 'text',
    required: true,
    rules: 'required'
  },
  {
    name: 'deskripsi',
    label: 'Deskripsi',
    placeholder: 'Masukkan deskripsi permission',
    type: 'textarea',
    required: true,
    rules: 'required'
  }
];
</script>

<template>
  <ResourceCreateEditPage
    resourceName="Permission"
    createPermission="PERMISSION_CREATE"
    updatePermission="PERMISSION_UPDATE"
    :getApi="getPermissionsById"
    :createApi="createPermissions"
    :updateApi="(id, data) => updatePermissions(id, data)"
    :formSchema="formSchema"
    :icon="Shield"
    redirectPath="/permissions"
    :idExtractor="(data) => data.id_permission"
  />
</template>
