<script setup lang="ts">
import { h, ref, watch, onMounted } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon, PencilIcon } from 'lucide-vue-next';

import { 
    deleteReportPengiriman, 
    getReportPengiriman, 
    getReportPengirimanById,
    createReportPengiriman,
    updateReportPengiriman 
} from '@/api/reportPengiriman/reportPengiriman';
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
import AppDetailView from '@/components/AppDetailView.vue';
import { 
    Dialog, 
    DialogContent, 
} from '@/components/ui/dialog';
import { Calendar, Package, Hash, Layers } from 'lucide-vue-next';
import { type DetailSchema } from '@/schemas/detail/detail';

const search = useSearch({ from: '/_authenticated/report-pengiriman' })
const router = useRouter();

const data = ref<ReportPengirimanItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

// Detail Modal State
const isDetailOpen = ref(false);
const selectedDetailData = ref<any>(null);
const isDetailLoading = ref(false);

const detailSchema: DetailSchema = [
  { 
    key: 'id_report_pengiriman', 
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
    key: 'id_wo_shell_size', 
    label: 'ID WO Shell Size', 
    icon: Layers 
  },
  { 
    key: 'quantity', 
    label: 'Kuantitas', 
    type: 'number',
    icon: Package,
    className: 'text-primary'
  }
];

const handleViewDetail = async (id: number) => {
    isDetailOpen.value = true;
    isDetailLoading.value = true;
    try {
        const res = await getReportPengirimanById(id);
        selectedDetailData.value = Array.isArray(res) ? res[0] : res;
    } catch (error) {
        console.error("Gagal fetch detail:", error);
    } finally {
        isDetailLoading.value = false;
    }
}

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
    onSubmit: async (values, isEdit) => {
        if (isEdit) {
            const id = values.id_report_pengiriman || values.idReportPengiriman;
            return await updateReportPengiriman(id, values);
        } else {
            return await createReportPengiriman(values);
        }
    },
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
            h(Button, { 
                variant: 'outline',
                size: 'sm',
                onClick: () => handleViewDetail(id) 
            }, () => [
                h(EyeIcon, { class: 'w-4 h-4 mr-1' }),
                'View'
            ]),
            h(Button, { 
                variant: 'ghost',
                size: 'sm',
                onClick: async () => {
                    try {
                        const res = await getReportPengirimanById(id);
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
            h(Button, { 
                variant: 'ghost',
                size: 'sm',
                onClick: () => router.navigate({ to: `/report-pengiriman/${id}`, params: { id: String(id) } }) 
            }, () => [
                'Detail'
            ]) ,
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
        key: "id_wo_shell_size",
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
        :title="createDialog.isEditMode.value ? 'Edit Report Pengiriman' : 'Tambah Report Pengiriman'"
        :description="createDialog.isEditMode.value ? 'Perbarui informasi laporan pengiriman di bawah ini.' : 'Masukkan detail laporan pengiriman baru di sini.'"
        :schema="reportPengirimanDialogSchema"
        :is-open="createDialog.isOpen.value"
        :initial-values="createDialog.initialValues.value"
        :submit-label="createDialog.isLoading.value ? 'Sending...' : (createDialog.isEditMode.value ? 'Update' : 'Create')"
        @update:is-open="createDialog.isOpen.value = $event"
        @submit="createDialog.handleSubmit"
    />
    <Dialog :open="isDetailOpen" @update:open="isDetailOpen = $event">
        <DialogContent class="sm:max-w-[600px] p-0 overflow-hidden border-none bg-transparent shadow-none">
            <AppDetailView
                title="Quick View Report Pengiriman"
                description="Detail ringkas laporan pengiriman barang."
                :data="selectedDetailData"
                :schema="detailSchema"
                :is-loading="isDetailLoading"
                :show-edit="false"
                :show-delete="false"
            />
        </DialogContent>
    </Dialog>
</template>