<script setup lang="ts">
import { Wrench } from 'lucide-vue-next';
import { createWorkOrder, getWorkOrderById, updateWorkOrder } from '@/api/work-orders/work-orders';
import ResourceCreateEditPage from '@/components/pages/ResourceCreateEditPage.vue';

const formSchema = [
  {
    name: 'id_po_client_item',
    label: 'PO Client Item ID',
    placeholder: 'Masukkan PO Client Item ID',
    type: 'number',
    required: true,
    rules: 'required'
  },
  {
    name: 'delivery',
    label: 'Tanggal Delivery',
    placeholder: 'Pilih tanggal delivery',
    type: 'date',
    required: true,
    rules: 'required'
  },
  {
    name: 'fob_cmt',
    label: 'FOB/CMT',
    placeholder: 'Pilih tipe FOB/CMT',
    type: 'select',
    required: true,
    rules: 'required',
    options: [
      { label: 'FOB', value: true },
      { label: 'CMT', value: false }
    ]
  }
];
</script>

<template>
  <ResourceCreateEditPage
    resourceName="Work Order"
    createPermission="WORK_ORDER_CREATE"
    updatePermission="WORK_ORDER_UPDATE"
    :getApi="getWorkOrderById"
    :createApi="createWorkOrder"
    :updateApi="(id, data) => updateWorkOrder(id, data)"
    :formSchema="formSchema"
    :icon="Wrench"
    redirectPath="/work-order"
    :idExtractor="(data) => data.id_wo"
  />
</template>
