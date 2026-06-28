<script setup lang="ts">
import { h, ref, watch, onMounted } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon, DownloadIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { downloadSuratJalanInternalExcel, getSuratJalanInternals } from '@/api/surat-jalan-internal/surat-jalan-internal';
import type { SuratJalanInternalListItem } from '@/schemas/surat-jalan-internal/response';
import { suratJalanInternalSchema } from '@/pages/surat-jalan-internal/schema';

import DataTable from '@/components/DataTable.vue';
import { Button } from '@/components/ui/button';

import { usePermission } from '@/composables/usePermission';
import { useTable } from '@/composables/useTable';
import { formatDate } from '@/lib/formatter';

const { hasPermission } = usePermission();
const search = useSearch({ strict: false }) as any;
const router = useRouter();

const data = ref<SuratJalanInternalListItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);
const isExportingMap = ref<Record<number, boolean>>({});

const fetchData = async () => {
    isLoading.value = true;
    try {
        const page = search.value?.page ?? 1;
        const pageSize = search.value?.pageSize ?? 20;
        const filter = search.value?.filter ?? '';
        const sortBy = search.value?.sortBy;
        const sortDesc = search.value?.sortDesc ?? false;

        const response = await getSuratJalanInternals({
            page,
            pageSize,
            search: filter,
            sortBy,
            sortDesc
        });

        data.value = response.results;
        totalCount.value = response.count;
    } catch (error) {
        console.error("Gagal fetch data surat jalan internal:", error);
    } finally {
        isLoading.value = false;
    }
}

const handleExportExcel = async (id: number) => {
    isExportingMap.value[id] = true;
    try {
        const result = await downloadSuratJalanInternalExcel(id);
        const objectUrl = window.URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = result.fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(objectUrl);
        toast.success('Export Excel Surat Jalan Internal berhasil diunduh.');
    } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Gagal mengunduh export Excel Surat Jalan Internal.');
    } finally {
        isExportingMap.value[id] = false;
    }
}

const { table, searchTerm, onSearch, clearFilter } = useTable<SuratJalanInternalListItem, typeof suratJalanInternalSchema>({
    data: data,
    rowCount: totalCount,
    columns: [
        { header: 'Tanggal Dibuat', accessorKey: 'created_at', cell: ({ row }) => formatDate(row.original.created_at) },
        { header: 'ID SJ', accessorKey: 'id_surat_jalan_internal' },
        { header: 'No. Dokumen', accessorKey: 'no_dokumen', cell: ({ row }) => row.original.no_dokumen || '—' },
        { header: 'ID WO', accessorKey: 'id_wo', cell: ({ row }) => row.original.id_wo ? `#${row.original.id_wo}` : '—' },
        { header: 'Buyer', accessorKey: 'buyer', cell: ({ row }) => row.original.buyer || '—' },
        { header: 'Model', accessorKey: 'model', cell: ({ row }) => row.original.model || '—' },
        { header: 'Deskripsi', accessorKey: 'deskripsi', cell: ({ row }) => row.original.deskripsi || '—' },
        { header: 'Jml Packing List', accessorKey: 'packing_list_count', cell: ({ row }) => row.original.packing_list_count ?? 0 },
        { 
            header: 'Actions', 
            id: 'actions', 
            cell: ({ row }) => {
                const id = row.original.id_surat_jalan_internal;
                return h('div', { class: 'flex gap-2 justify-center items-center' }, [
                    h(Button, {
                        variant: 'outline',
                        size: 'sm',
                        class: 'flex gap-2 items-center',
                        onClick: () => router.navigate({ to: '/surat-jalan-internal/$id', params: { id: id.toString() } })
                    }, () => [h(EyeIcon, { class: 'w-4 h-4' }), 'Lihat Rincian']),
                    h(Button, {
                        variant: 'outline',
                        size: 'sm',
                        class: 'flex gap-2 items-center text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/50',
                        disabled: isExportingMap.value[id] || false,
                        onClick: () => handleExportExcel(id)
                    }, () => [
                        h(DownloadIcon, { class: 'w-4 h-4' }),
                        isExportingMap.value[id] ? 'Exporting...' : 'Export'
                    ])
                ]);
            } 
        }
    ],
    search: search,
    schema: suratJalanInternalSchema,
});

watch(() => search.value, () => {
    fetchData();
}, { deep: true });

onMounted(() => {
    fetchData();
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Surat Jalan Internal</h2>
        <p class="text-muted-foreground">Kelola dokumen surat jalan pengiriman internal per Work Order</p>
      </div>
      <Button 
        v-if="hasPermission('SURAT_JALAN_INTERNAL_CREATE')" 
        @click="router.navigate({ to: '/surat-jalan-internal/create' })"
        class="flex gap-2 items-center"
      >
        <PlusIcon class="w-4 h-4" /> Tambah Surat Jalan
      </Button>
    </div>

    <DataTable 
      :table="table" 
      :is-loading="isLoading" 
      :search-term="searchTerm"
      @search="onSearch"
      @clear-filter="clearFilter"
    />
  </div>
</template>
