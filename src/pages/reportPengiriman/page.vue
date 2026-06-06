<script setup lang="ts">
import { h, ref, watch, onMounted } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon, PencilIcon } from 'lucide-vue-next';

import {
    deleteReportPengiriman,
    getReportPengiriman
} from '@/api/reportPengiriman/reportPengiriman';
import { type ReportPengirimanItem } from '@/schemas/reportPengiriman/reportPengiriman';
import { reportPengirimanSchema } from '@/pages/reportPengiriman/schema';

import DataTable from '@/components/DataTable.vue';
import { Button } from '@/components/ui/button';

import { useTable } from '@/composables/useTable';
import { formatDate } from '@/lib/formatter';
import DeleteButton from '@/components/DeleteButton.vue';
import { usePermission } from '@/composables/usePermission';

const search = useSearch({ strict: false }) as any
const router = useRouter();
const { hasPermission } = usePermission();

const data = ref<ReportPengirimanItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

const fetchData = async () => {
    isLoading.value = true;
    try {
        const page = search.value?.page ?? 1;
        const pageSize = search.value?.pageSize ?? 20;
        const filter = search.value?.filter ?? '';

        const response = await getReportPengiriman({
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
        { header: 'Date', accessorKey: 'date' },
        { header: 'ID Report Pengiriman', accessorKey: 'id_report_pengiriman' },
        { header: 'ID WO Shell Size', accessorKey: 'id_wo_shell_size' },
        { header: 'Quantity', accessorKey: 'quantity' },
        { header: 'Actions', id: 'actions', cell:({ row }) => {
        const id = row.getValue('id_report_pengiriman') as number;
        const buttons = [];

        buttons.push(h(Button, {
            variant: 'outline',
            size: 'sm',
            onClick: () => router.navigate({ to: '/report-pengiriman/$id', params: { id: String(id) } })
        }, () => [
            h(EyeIcon, { class: 'w-4 h-4 mr-1' }),
            'View'
        ]));

        if (hasPermission('INVENTORY_ISSUE')) {
            buttons.push(
                h(Button, {
                    variant: 'ghost',
                    size: 'sm',
                    onClick: () => router.navigate({ to: '/report-pengiriman/edit/$id', params: { id: String(id) } })
                }, () => [
                    h(PencilIcon, { class: 'w-4 h-4 mr-1' }),
                    'Edit'
                ]),
                h(DeleteButton, {
                    onConfirm: async() => {
                        await deleteReportPengiriman(id);
                        await fetchData()
                    },
                    confirmMessage: 'Apakah Anda yakin ingin menghapus Report Pengiriman ini?',
                    resourceName: 'Laporan Pengiriman'
                })
            );
        }

        return h('div', { class: 'flex gap-2 justify-center items-center' }, buttons);
        } }
    ],
    search: search,
    schema: reportPengirimanSchema,
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
            <Button v-if="hasPermission('INVENTORY_ISSUE')" @click="router.navigate({ to: '/report-pengiriman/create' })" variant="outline">
                <PlusIcon class="w-4 h-4" />
                <span class="hidden lg:inline">Tambah Data</span>
            </Button>
        </template>
    </DataTable>
</template>
