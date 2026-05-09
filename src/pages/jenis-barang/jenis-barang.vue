<script setup lang="ts">
import { h, ref, watch, onMounted } from 'vue';
import { useSearch } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon, PencilIcon, Hash, Package, Calendar } from 'lucide-vue-next';

import { 
    deleteJenisBarang, 
    getJenisBarang, 
    getJenisBarangById, 
    createJenisBarang, 
    updateJenisBarang 
} from '@/api/jenis-barang/jenis-barang';
import { type JenisBarangResponseItem } from '@/schemas/jenis-barang/response';
import { jenisBarangSchema } from '@/routes/_authenticated/jenis-barang';

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
import { type DetailSchema } from '@/schemas/detail/detail';
import { computed } from 'vue';

const search = useSearch({ from: '/_authenticated/jenis-barang' });

const data = ref<JenisBarangResponseItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

const isDetailOpen = ref(false);
const selectedDetailData = ref<any>(null);
const isDetailLoading = ref(false);

const detailSchema: DetailSchema = [
  { 
    key: 'id_jenis_barang', 
    label: 'ID Jenis Barang', 
    icon: Hash 
  },
  { 
    key: 'kode', 
    label: 'Kode',  
  },
  { 
    key: 'nama_jenis_barang', 
    label: 'Nama Jenis Barang', 
    icon: Package 
  },
  {
    key: 'created_at',
    label: 'Created At',
    icon: Calendar,
    format: (val) => formatDate(val)
  }
];

const handleViewDetail = async (id: number) => {
    isDetailOpen.value = true;
    isDetailLoading.value = true;
    try {
        const res = await getJenisBarangById(id);
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

        const response = await getJenisBarang({
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

const createDialog = useDialog({
    onSubmit: async (values, isEdit) => {
        if (isEdit) {
            return await updateJenisBarang(values.id_jenis_barang, values);
        } else {
            return await createJenisBarang(values);
        }
    },
    onSuccess: () => fetchData() 
});

const { table, searchTerm, onSearch, clearFilter } = useTable({
    data: data,
    rowCount: totalCount,
    columns: [
        { header: 'Created At', accessorKey: 'created_at', cell: ({ row }) => formatDate(row.getValue('created_at')) },
        { header: 'ID Jenis Barang', accessorKey: 'id_jenis_barang' },
        { header: 'Kode', accessorKey: 'kode' },
        { header: 'Nama Jenis Barang', accessorKey: 'nama_jenis_barang' },
        { header: 'Actions', id: 'actions', cell:({ row }) => {
        const id = row.getValue('id_jenis_barang') as number;

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
                onClick: () => createDialog.openDialog(row.original) 
            }, () => [
                h(PencilIcon, { class: 'w-4 h-4 mr-1' }),
                'Edit'
            ]),
            h(DeleteButton, {
                onConfirm: async() => {
                    await deleteJenisBarang(id);
                    await fetchData()
                },
                confirmMessage: 'Apakah Anda yakin ingin menghapus Jenis Barang ini?'
            })
        ]) } 
    }
    ],
    search: search,
    schema: jenisBarangSchema,
})

const JenisBarangDialogSchema = computed<DialogSchemaType>(() => [
    {
        key: "kode",
        label: "Kode Jenis Barang",
        type: "text",
        placeholder: "Contoh: JNS-001",
        rules: "required",
        position: "full"
    },
    {
        key: "nama_jenis_barang",
        label: "Nama Jenis Barang",
        type: "text",
        placeholder: "Masukkan nama jenis barang",
        rules: "required",
        position: "full"
    }
])

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
                <PlusIcon class="w-4 h-4 mr-2" />
                Tambah Jenis Barang
            </Button>
        </template>
    </DataTable>

    <AppDialog
        :title="createDialog.isEditMode.value ? 'Edit Jenis Barang' : 'Tambah Jenis Barang'"
        :description="createDialog.isEditMode.value ? 'Perbarui informasi jenis barang di bawah ini.' : 'Masukkan detail jenis barang baru di sini.'"
        :schema="JenisBarangDialogSchema"
        :is-open="createDialog.isOpen.value"
        :initial-values="createDialog.initialValues.value"
        :submit-label="createDialog.isLoading.value ? 'Sending...' : (createDialog.isEditMode.value ? 'Update' : 'Create')"
        @update:is-open="createDialog.isOpen.value = $event"
        @submit="createDialog.handleSubmit"
    />

    <Dialog :open="isDetailOpen" @update:open="isDetailOpen = $event">
        <DialogContent class="sm:max-w-[600px] p-0 overflow-hidden border-none bg-transparent shadow-none">
            <AppDetailView
                title="Quick View Jenis Barang"
                description="Detail informasi jenis barang."
                :data="selectedDetailData"
                :schema="detailSchema"
                :is-loading="isDetailLoading"
                :show-edit="false"
                :show-delete="false"
            />
        </DialogContent>
    </Dialog>
</template>
