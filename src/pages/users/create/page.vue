<script setup lang="ts">
import { Users } from 'lucide-vue-next';
import { createUser, getUserById, updateUser } from '@/api/users/users';
import ResourceCreateEditPage from '@/components/pages/ResourceCreateEditPage.vue';

const formSchema = [
  {
    name: 'username',
    label: 'Username',
    placeholder: 'Masukkan username',
    type: 'text',
    required: true,
    rules: 'required'
  },
  {
    name: 'id_role',
    label: 'Role',
    placeholder: 'Pilih role',
    type: 'select',
    required: true,
    rules: 'required'
  },
  {
    name: 'status',
    label: 'Status',
    placeholder: 'Pilih status',
    type: 'select',
    required: true,
    rules: 'required'
  },
  {
    name: 'id_departemen',
    label: 'Departemen',
    placeholder: 'Pilih departemen (opsional)',
    type: 'select',
    required: false,
    rules: ''
  },
  {
    name: 'id_mitra',
    label: 'Mitra',
    placeholder: 'Pilih mitra (opsional)',
    type: 'select',
    required: false,
    rules: ''
  }
];
</script>

<template>
  <ResourceCreateEditPage
    resourceName="User"
    createPermission="USER_CREATE"
    updatePermission="USER_UPDATE"
    :getApi="getUserById"
    :createApi="createUser"
    :updateApi="(id, data) => updateUser(id, data)"
    :formSchema="formSchema"
    :icon="Users"
    redirectPath="/users"
    :idExtractor="(data) => data.id_user"
    :payloadProcessor="(data) => {
      const { created_at, nama_role, nama_departemen, nama_perusahaan, ...payload } = data;
      return payload;
    }"
  />
</template>
