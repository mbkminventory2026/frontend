<script setup lang="ts">
import { h, ref, watch, onMounted } from 'vue';
import { useSearch } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon, PencilIcon, Hash, Package, Calendar } from 'lucide-vue-next';

import { 
    deleteDepartemen, 
    getDepartemen, 
    getDepartemenById, 
    createDepartemen, 
    updateDepartemen 
} from '@/api/departemen/departemen';
import { type DepartemenResponseItem } from '@/schemas/departemen/response';
import { departemenSchema } from '@/routes/_authenticated/departemen';

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

const search = useSearch({ from: '/_authenticated/departemen' });

const data = ref<DepartemenResponseItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

const isDetailOpen = ref(false);
const selectedDetailData = ref<any>(null);
const isDetailLoading = ref(false);

const detailSchema: DetailSchema = [
  { 
    key: 'id_departemen', 
    label: 'ID Departemen', 
    icon: Hash 
  },
  { 
    key: 'nama_departemen', 
    label: 'Nama Departemen', 
    icon: Package 
  },
  {
    key: 'created_at',
    label: 'Created At',
    icon: Calendar,
    formatter: (val: string) => formatDate(val)
  }
];

const handleViewDetail = async (id: number) => {
    isDetailOpen.value = true;
    isDetailLoading.value = true;
    try {
        const res = await getDepartemenById(id);
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

        const response = await getDepartemen({
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
            return await updateDepartemen(values.id_departemen, values);
        } else {
            return await createDepartemen(values);
        }
    },
    onSuccess: () => fetchData() 
});

const { table, searchTerm, onSearch, clearFilter } = useTable({
    data: data,
    rowCount: totalCount,
    columns: [
        { header: 'Created At', accessorKey: 'created_at', cell: ({ row }) => formatDate(row.getValue('created_at')) },
        { header: 'ID Departemen', accessorKey: 'id_departemen' },
        { header: 'Nama Departemen', accessorKey: 'nama_departemen' },
        { header: 'Actions', id: 'actions', cell:({ row }) => {
        const id = row.getValue('id_departemen') as number;

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
                    await deleteDepartemen(id);
                    await fetchData()
                },
                confirmMessage: 'Apakah Anda yakin ingin menghapus Departemen ini?'
            })
        ]) } 
    }
    ],
    search: search,
    schema: departemenSchema,
})

const DepartemenDialogSchema = computed<DialogSchemaType>(() => [
    {
        key: "nama_departemen",
        label: "Nama Departemen",
        type: "text",
        placeholder: "Masukkan nama departemen",
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
                Tambah Departemen
            </Button>
        </template>
    </DataTable>

    <AppDialog
        :title="createDialog.isEditMode.value ? 'Edit Departemen' : 'Tambah Departemen'"
        :description="createDialog.isEditMode.value ? 'Perbarui informasi departemen di bawah ini.' : 'Masukkan detail departemen baru di sini.'"
        :schema="DepartemenDialogSchema"
        :is-open="createDialog.isOpen.value"
        :initial-values="createDialog.initialValues.value"
        :submit-label="createDialog.isLoading.value ? 'Sending...' : (createDialog.isEditMode.value ? 'Update' : 'Create')"
        @update:is-open="createDialog.isOpen.value = $event"
        @submit="createDialog.handleSubmit"
    />

    <Dialog :open="isDetailOpen" @update:open="isDetailOpen = $event">
        <DialogContent class="sm:max-w-[600px] p-0 overflow-hidden border-none bg-transparent shadow-none">
            <AppDetailView
                title="Quick View Departemen"
                description="Detail informasi departemen."
                :data="selectedDetailData"
                :schema="detailSchema"
                :is-loading="isDetailLoading"
                :show-edit="false"
                :show-delete="false"
            />
        </DialogContent>
    </Dialog>
</template>
