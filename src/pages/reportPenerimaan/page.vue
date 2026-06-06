<script setup lang="ts">
import { h, ref, watch, onMounted } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon, PencilIcon } from 'lucide-vue-next';

import {
    deleteReportPenerimaan,
    getReportPenerimaan
} from '@/api/reportPenerimaan/reportPenerimaan';
import { type ReportPenerimaanItem } from '@/schemas/reportPenerimaan/reportPenerimaan';
import { reportPenerimaanSchema } from '@/pages/reportPenerimaan/schema';

import DataTable from '@/components/DataTable.vue';
import { Button } from '@/components/ui/button';

import { useTable } from '@/composables/useTable';
import { formatDate } from '@/lib/formatter';
import DeleteButton from '@/components/DeleteButton.vue';
import { usePermission } from '@/composables/usePermission';

const search = useSearch({ strict: false }) as any
const router = useRouter();
const { hasPermission } = usePermission();

const data = ref<ReportPenerimaanItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

const fetchData = async () => {
    isLoading.value = true;
    try {
        const page = search.value?.page ?? 1;
        const pageSize = search.value?.pageSize ?? 20;
        const filter = search.value?.filter ?? '';

        const response = await getReportPenerimaan({
            limit: pageSize,
            offset: (page - 1) * pageSize,
            search: filter
        });

        data.value = response.results;
        totalCount.value = response.count;
    } catch (error) {
        console.error("Gagal fetch data:", error);
    } finally {
        isLoading.value = false;
    }
}



const { table, searchTerm, onSearch, clearFilter } = useTable({
    data: data,
    rowCount: totalCount,
    columns: [
        { header: 'Created At', accessorKey: 'created_at', cell: ({ row }) => formatDate(row.getValue('created_at')) },
        { header: 'Tanggal Penerimaan', accessorKey: 'tanggal', cell: ({ row }) => formatDate(row.getValue('tanggal')) },
        { header: 'ID Received', accessorKey: 'id_received' },
        { header: 'ID Material List', accessorKey: 'id_material_list' },
        { header: 'Quantity (Qty)', accessorKey: 'qty' },
        { header: 'Keterangan', accessorKey: 'keterangan' },
        { header: 'Actions', id: 'actions', cell:({ row }) => {
        const id = row.getValue('id_received') as number;
        const buttons = [];

        buttons.push(h(Button, {
            variant: 'outline',
            size: 'sm',
            onClick: () => router.navigate({ to: '/report-penerimaan/$id', params: { id: String(id) } })
        }, () => [
            h(EyeIcon, { class: 'w-4 h-4 mr-1' }),
            'View'
        ]));

        if (hasPermission('INVENTORY_RECEIVE')) {
            buttons.push(
                h(Button, {
                    variant: 'ghost',
                    size: 'sm',
                    onClick: () => router.navigate({ to: '/report-penerimaan/edit/$id', params: { id: String(id) } })
                }, () => [
                    h(PencilIcon, { class: 'w-4 h-4 mr-1' }),
                    'Edit'
                ]),
                h(DeleteButton, {
                    onConfirm: async() => {
                        await deleteReportPenerimaan(id);
                        await fetchData()
                    },
                    confirmMessage: 'Apakah Anda yakin ingin menghapus Laporan Penerimaan ini?',
                    resourceName: 'Laporan Penerimaan'
                })
            );
        }

        return h('div', { class: 'flex gap-2 justify-center items-center' }, buttons);
        } }
    ],
    search: search,
    schema: reportPenerimaanSchema,
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
            <Button v-if="hasPermission('INVENTORY_RECEIVE')" @click="router.navigate({ to: '/report-penerimaan/create' })" variant="outline">
                <PlusIcon class="w-4 h-4" />
                <span class="hidden lg:inline">Tambah Data</span>
            </Button>
        </template>
    </DataTable>
</template>
