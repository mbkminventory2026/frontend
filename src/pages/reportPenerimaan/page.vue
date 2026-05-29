<script setup lang="ts">
import { h, ref, watch, onMounted } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon, PencilIcon } from 'lucide-vue-next';

import { 
    deleteReportPenerimaan, 
    getReportPenerimaan, 
    getReportPenerimaanById,
    createReportPenerimaan,
    updateReportPenerimaan 
} from '@/api/reportPenerimaan/reportPenerimaan';
import { type ReportPenerimaanItem } from '@/schemas/reportPenerimaan/reportPenerimaan';
import { reportPenerimaanSchema } from '@/routes/_authenticated/report-penerimaan.index';

import DataTable from '@/components/DataTable.vue';
import AppDialog from '@/components/AppDialog.vue';
import { Button } from '@/components/ui/button';

import { useTable } from '@/composables/useTable';
import { useDialog } from '@/composables/useDialog';
import { type DialogSchemaType } from '@/schemas/dialog/dialog';
import { formatDate } from '@/lib/formatter';
import DeleteButton from '@/components/DeleteButton.vue';

const search = useSearch({ strict: false }) as any
const router = useRouter();

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

// Dialog
const createDialog = useDialog({
    onSubmit: async (values, isEdit) => {
        if (isEdit) {
            const id = values.id_received || values.idReceived;
            return await updateReportPenerimaan(id, values);
        } else {
            return await createReportPenerimaan(values);
        }
    },
    onSuccess: () => fetchData() // Refresh tabel setelah tambah/edit
});

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

        return h('div', { class: 'flex gap-2 justify-center items-center' }, [
            h(Button, { 
                variant: 'outline',
                size: 'sm',
                onClick: () => router.navigate({ to: '/report-penerimaan/$id', params: { id: String(id) } }) 
            }, () => [
                h(EyeIcon, { class: 'w-4 h-4 mr-1' }),
                'View'
            ]),
            h(Button, { 
                variant: 'ghost',
                size: 'sm',
                onClick: async () => {
                    try {
                        const res = await getReportPenerimaanById(id);
                        const detailData = Array.isArray(res) ? res[0] : res;
                        createDialog.openDialog(detailData);
                    } catch (error) {
                        console.error("Gagal fetch detail untuk edit:", error);
                    }
                }
            }, () => [
                h(PencilIcon, { class: 'w-4 h-4 mr-1' }),
                'Edit'
            ]),
            h(DeleteButton, {
                onConfirm: async() => {
                    await deleteReportPenerimaan(id);
                    await fetchData()
                },
                confirmMessage: 'Apakah Anda yakin ingin menghapus Laporan Penerimaan ini?'
            })
        ]) } 
    }
    ],
    search: search,
    schema: reportPenerimaanSchema,
})

const reportPenerimaanDialogSchema: DialogSchemaType = [
    {
        key: "tanggal",
        label: "Tanggal Penerimaan",
        type: "date",
        placeholder: "Pilih tanggal penerimaan",
        rules: "required",
        position: "full"
    },
    {
        key: "id_material_list",
        label: "ID Material List",
        type: "number",
        placeholder: "Masukkan ID Material List",
        rules: "required",
        position: "full"
    },
    {
        key: "qty",
        label: "Quantity (Qty)",
        type: "number",
        placeholder: "Masukkan quantity yang diterima",
        rules: "required",
        position: "full"
    },
    {
        key: "keterangan",
        label: "Keterangan",
        type: "text",
        placeholder: "Masukkan keterangan (opsional)",
        rules: "",
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
        :title="createDialog.isEditMode.value ? 'Edit Laporan Penerimaan' : 'Tambah Laporan Penerimaan'"
        :description="createDialog.isEditMode.value ? 'Perbarui informasi laporan penerimaan di bawah ini.' : 'Masukkan detail laporan penerimaan baru di sini.'"
        :schema="reportPenerimaanDialogSchema"
        :is-open="createDialog.isOpen.value"
        :initial-values="createDialog.initialValues.value"
        :submit-label="createDialog.isLoading.value ? 'Sending...' : (createDialog.isEditMode.value ? 'Update' : 'Create')"
        @update:is-open="createDialog.isOpen.value = $event"
        @submit="createDialog.handleSubmit"
    />
</template>
