<script setup lang="ts">
import { useRoute, useRouter } from '@tanstack/vue-router';
import { getReportPengirimanById, deleteReportPengiriman } from '@/api/reportPengiriman/reportPengiriman';
import { useDetail } from '@/composables/useDetail';
import { useDelete } from '@/composables/useDelete';
import AppDetailView from '@/components/AppDetailView.vue';
import { Button } from '@/components/ui/button';
import { type DetailSchema } from '@/schemas/detail/detail';
import { Calendar, Package, Hash, Layers } from 'lucide-vue-next';

const route = useRoute({ from: '/_authenticated/report-pengiriman/$id' });
const router = useRouter();
const id = route.params.id;

const { data, isLoading } = useDetail(
  async (id) => {
    const res = await getReportPengirimanById(id);
    return Array.isArray(res) ? res[0] : res;
  },
  id
);

const { deleteItem } = useDelete({
  onSuccess: () => {
    router.navigate({ to: '/report-pengiriman' });
  }
});

const schema: DetailSchema = [
  { 
    key: 'idReportPengiriman', 
    label: 'ID Report', 
    icon: Hash 
  },
  { 
    key: 'date', 
    label: 'Tanggal Pengiriman', 
    type: 'date',
    icon: Calendar 
  },
  { 
    key: 'idWoShellSize', 
    label: 'ID WO Shell Size', 
    icon: Layers 
  },
  { 
    key: 'quantity', 
    label: 'Kuantitas', 
    type: 'number',
    icon: Package,
    className: 'text-primary'
  },
  {
    key: 'file_lampiran', // Contoh field file
    label: 'Lampiran',
    type: 'file',
    span: 'full'
  }
];

const handleEdit = () => {
  console.log("Navigating to edit page for ID:", id);
  // router.navigate({ to: `/report-pengiriman/${id}/edit` });
};

const handleDelete = () => {
  deleteItem(async () => {
    await deleteReportPengiriman(id);
  }, "Apakah Anda yakin ingin menghapus laporan pengiriman ini?");
};
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center gap-4">
       <Button variant="ghost" @click="router.history.back()">
         &larr; Kembali
       </Button>
    </div>

    <AppDetailView
      title="Detail Laporan Pengiriman"
      description="Informasi lengkap mengenai laporan pengiriman barang."
      :data="data"
      :schema="schema"
      :is-loading="isLoading"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </div>
</template>
