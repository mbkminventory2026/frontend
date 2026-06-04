<script setup lang="ts">
import { Truck } from 'lucide-vue-next';
import { createReportPengiriman, getReportPengirimanById, updateReportPengiriman } from '@/api/reportPengiriman/reportPengiriman';
import ResourceCreateEditPage from '@/components/pages/ResourceCreateEditPage.vue';

const formSchema = [
  {
    name: 'date',
    label: 'Tanggal Pengiriman',
    placeholder: 'Pilih tanggal pengiriman',
    type: 'date',
    required: true,
    rules: 'required'
  },
  {
    name: 'id_wo_shell_size',
    label: 'ID WO Shell Size',
    placeholder: 'Masukkan ID WO Shell Size',
    type: 'number',
    required: true,
    rules: 'required'
  },
  {
    name: 'quantity',
    label: 'Quantity',
    placeholder: 'Masukkan quantity yang dikirim',
    type: 'number',
    required: true,
    rules: 'required'
  }
];
</script>

<template>
  <ResourceCreateEditPage
    resourceName="Report Pengiriman"
    createPermission="INVENTORY_ISSUE_CREATE"
    updatePermission="INVENTORY_ISSUE_UPDATE"
    :getApi="getReportPengirimanById"
    :createApi="createReportPengiriman"
    :updateApi="(id, data) => updateReportPengiriman(id, data)"
    :formSchema="formSchema"
    :icon="Truck"
    redirectPath="/report-pengiriman"
    :idExtractor="(data) => data.id_report_pengiriman || data.idReportPengiriman"
  />
</template>
