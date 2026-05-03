<script setup lang="ts">
import { h, ref, watch, onMounted } from 'vue';
import { useSearch } from '@tanstack/vue-router';
import { PlusIcon, Pencil, Trash2 } from 'lucide-vue-next';

import { deleteReportPengiriman, getReportPengiriman } from '@/api/reportPengiriman/reportPengiriman';
import { type ReportPengirimanItem } from '@/schemas/reportPengiriman/reportPengiriman';
import { reportPengirimanSchema } from '@/routes/_authenticated/report-pengiriman';

import DataTable from '@/components/DataTable.vue';
import AppDialog from '@/components/AppDialog.vue';
import { Button } from '@/components/ui/button';

import { useTable } from '@/composables/useTable';
import { useDialog } from '@/composables/useDialog';
import { type DialogSchemaType } from '@/schemas/dialog/dialog';
import { formatDate } from '@/lib/formatter';
import DeleteButton from '@/components/DeleteButton.vue';

const search = useSearch({ from: '/_authenticated/report-pengiriman' })

const data = ref<ReportPengirimanItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

const fetchData = async () => {
    isLoading.value = true;
    try {
        const page = search.value.page ?? 1;
        const pageSize = search.value.pageSize ?? 20;
        const filter = search.value.filter ?? '';

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

// Dialog
const createDialog = useDialog({
    endpoint: '/api/v1/report-pengiriman',
    onSuccess: () => fetchData() // Refresh tabel setelah tambah
});

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
        console.log("Data Row:", id);

        return h('div', { class: 'flex gap-2 justify-center items-center' }, [
            h(DeleteButton, {
                onConfirm: async() => {
                    await deleteReportPengiriman(id);
                    await fetchData()
                },
                confirmMessage: 'Apakah Anda yakin ingin menghapus Report Pengiriman ini?'
            })
        ]) } 
    }
    ],
    search: search,
    schema: reportPengirimanSchema,
})

const reportPengirimanDialogSchema: DialogSchemaType = [
    {
        key: "date",
        label: "Date",
        type: "date",
        placeholder: "Pilih tanggal",
        rules: "required",
        position: "full"
    },
    {
        key: "idWoShellSize",
        label: "ID WO Shell Size",
        type: "select",
        placeholder: "Pilih WO Shell Size",
        rules: "required",
        position: "full",
        options: [
            { label: "1", value: 1 },
            { label: "2", value: 2 }
        ]
    },
    {
        key: "quantity",
        label: "Quantity",
        type: "number",
        placeholder: "Masukkan quantity",
        rules: "required",
        position: "full"
    },
];

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
            <Button @click="createDialog.openDialog()" variant="outline">
                <PlusIcon class="w-4 h-4" />
                <span class="hidden lg:inline">Tambah Data</span>
            </Button>
        </template>
    </DataTable>

    <AppDialog
        title="Tambah Item Baru"
        description="Masukkan detail item coba di sini."
        :schema="reportPengirimanDialogSchema"
        :is-open="createDialog.isOpen.value"
        :submit-label="createDialog.isLoading.value ? 'Sending...' : 'Create'"
        @update:is-open="createDialog.isOpen.value = $event"
        @submit="createDialog.handleSubmit"
    />
</template>