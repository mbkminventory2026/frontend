<script setup lang="ts">
import { FileText } from 'lucide-vue-next';
import { createReportPenerimaan, getReportPenerimaanById, updateReportPenerimaan } from '@/api/reportPenerimaan/reportPenerimaan';
import ResourceCreateEditPage from '@/components/pages/ResourceCreateEditPage.vue';

const formSchema = [
  {
    name: 'tanggal',
    label: 'Tanggal Penerimaan',
    placeholder: 'Pilih tanggal penerimaan',
    type: 'date',
    required: true,
    rules: 'required'
  },
  {
    name: 'id_material_list',
    label: 'ID Material List',
    placeholder: 'Masukkan ID Material List',
    type: 'number',
    required: true,
    rules: 'required'
  },
  {
    name: 'qty',
    label: 'Quantity (Qty)',
    placeholder: 'Masukkan quantity yang diterima',
    type: 'number',
    required: true,
    rules: 'required'
  },
  {
    name: 'keterangan',
    label: 'Keterangan',
    placeholder: 'Masukkan keterangan (opsional)',
    type: 'text',
    required: false,
    rules: ''
  }
];
</script>

<template>
  <ResourceCreateEditPage
    resourceName="Report Penerimaan"
    createPermission="INVENTORY_RECEIVE_CREATE"
    updatePermission="INVENTORY_RECEIVE_UPDATE"
    :getApi="getReportPenerimaanById"
    :createApi="createReportPenerimaan"
    :updateApi="(id, data) => updateReportPenerimaan(id, data)"
    :formSchema="formSchema"
    :icon="FileText"
    redirectPath="/report-penerimaan"
    :idExtractor="(data) => data.id_received || data.idReceived"
  />
</template>
