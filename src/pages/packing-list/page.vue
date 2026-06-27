<script setup lang="ts">
import { h, ref, watch, onMounted } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon, DownloadIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { downloadPackingListExcel, getPackingLists } from '@/api/packing-list/packing-list';
import type { PackingListListItem } from '@/schemas/packing-list/response';
import { packingListSchema } from '@/pages/packing-list/schema';

import DataTable from '@/components/DataTable.vue';
import { Button } from '@/components/ui/button';

import { usePermission } from '@/composables/usePermission';
import { useTable } from '@/composables/useTable';
import { formatDate } from '@/lib/formatter';

const { hasPermission } = usePermission();
const search = useSearch({ strict: false }) as any;
const router = useRouter();

const data = ref<PackingListListItem[]>([]);
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

        const response = await getPackingLists({
            page,
            pageSize,
            search: filter,
            sortBy,
            sortDesc
        });

        data.value = response.results;
        totalCount.value = response.count;
    } catch (error) {
        console.error("Gagal fetch data packing list:", error);
    } finally {
        isLoading.value = false;
    }
}

const handleExportExcel = async (id: number) => {
    isExportingMap.value[id] = true;
    try {
        const result = await downloadPackingListExcel(id);
        const objectUrl = window.URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = result.fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(objectUrl);
        toast.success('Export Excel Packing List berhasil diunduh.');
    } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Gagal mengunduh export Excel Packing List.');
    } finally {
        isExportingMap.value[id] = false;
    }
}

const { table, searchTerm, onSearch, clearFilter } = useTable({
    data: data,
    rowCount: totalCount,
    columns: [
        { header: 'Tanggal Dibuat', accessorKey: 'created_at', cell: ({ row }) => formatDate(row.original.created_at) },
        { header: 'ID Packing List', accessorKey: 'id_packing_list' },
        { header: 'Buyer', accessorKey: 'buyer' },
        { header: 'Model', accessorKey: 'model' },
        { header: 'ID WO', accessorKey: 'id_wo' },
        { header: 'Pcs per Box', accessorKey: 'total_garment_per_box', cell: ({ row }) => row.original.total_garment_per_box.toLocaleString('id-ID') },
        { header: 'Total Reject', accessorKey: 'total_reject', cell: ({ row }) => row.original.total_reject.toLocaleString('id-ID') },
        { 
            header: 'No. SJ Internal', 
            accessorKey: 'id_surat_jalan_internal', 
            cell: ({ row }) => {
                const sjId = row.original.id_surat_jalan_internal;
                return sjId 
                    ? h('button', { 
                        class: 'text-indigo-600 hover:underline font-medium', 
                        onClick: () => router.navigate({ to: '/surat-jalan-internal/$id', params: { id: String(sjId) } }) 
                      }, `#${sjId}`) 
                    : '—';
            } 
        },
        { 
            header: 'Actions', 
            id: 'actions', 
            cell: ({ row }) => {
                const id = row.original.id_packing_list;
                return h('div', { class: 'flex min-w-[240px] gap-2 justify-center items-center' }, [
                    h(Button, {
                        variant: 'outline',
                        size: 'sm',
                        class: 'shadow-xs border-neutral-300',
                        onClick: () => router.navigate({ to: '/packing-list/$id', params: { id: String(id) } })
                    }, () => [
                        h(EyeIcon, { class: 'w-4 h-4 mr-1' }),
                        'View Detail'
                    ]),
                    h(Button, {
                        variant: 'outline',
                        size: 'sm',
                        class: 'shadow-xs border-neutral-300 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/50',
                        disabled: isExportingMap.value[id] || false,
                        onClick: () => handleExportExcel(id)
                    }, () => [
                        h(DownloadIcon, { class: 'w-4 h-4 mr-1' }),
                        isExportingMap.value[id] ? 'Exporting...' : 'Export'
                    ])
                ]);
            } 
        }
    ],
    search: search,
    schema: packingListSchema,
})

onMounted(() => {
    fetchData();
})

watch(() => search, () => {
    fetchData();
}, { deep: true })
</script>

<template>
    <DataTable
        :table="table"
        :is-loading="isLoading"
        v-model:search="searchTerm"
        @search="onSearch"
        @clear-filter="clearFilter"
    >
        <template #actions>
            <Button v-if="hasPermission('PACKING_LIST_CREATE')" @click="router.navigate({ to: '/packing-list/create' })" variant="outline">
                <PlusIcon class="w-4 h-4 mr-2" />
                Tambah Packing List
            </Button>
        </template>
    </DataTable>
</template>
