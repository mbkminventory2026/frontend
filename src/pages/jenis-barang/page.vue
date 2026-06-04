<script setup lang="ts">
import { h, ref, watch, onMounted } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon, PencilIcon } from 'lucide-vue-next';

import { 
    deleteJenisBarang, 
    getJenisBarang, 
    createJenisBarang, 
    updateJenisBarang 
} from '@/api/jenis-barang/jenis-barang';
import { type JenisBarangResponseItem } from '@/schemas/jenis-barang/response';
import { jenisBarangSchema } from '@/routes/_authenticated/jenis-barang.index';

import DataTable from '@/components/DataTable.vue';
import AppDialog from '@/components/AppDialog.vue';
import { Button } from '@/components/ui/button';

import { usePermission } from '@/composables/usePermission';
import { useTable } from '@/composables/useTable';
import { useDialog } from '@/composables/useDialog';
import { type DialogSchemaType } from '@/schemas/dialog/dialog';
import { formatDate } from '@/lib/formatter';
import DeleteButton from '@/components/DeleteButton.vue';
import { computed } from 'vue';

const { hasPermission } = usePermission();
const search = useSearch({ strict: false }) as any;
const router = useRouter();

const data = ref<JenisBarangResponseItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

const fetchData = async () => {
    isLoading.value = true;
    try {
        const page = search.value?.page ?? 1;
        const pageSize = search.value?.pageSize ?? 20;
        const filter = search.value?.filter ?? '';
        const sortBy = search.value?.sortBy;
        const sortDesc = search.value?.sortDesc ?? false;

        const response = await getJenisBarang({
            page,
            pageSize,
            search: filter,
            sortBy,
            sortDesc
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
        const buttons = [];

        buttons.push(h(Button, { 
            variant: 'outline',
            size: 'sm',
            onClick: () => router.navigate({ to: '/jenis-barang/$id', params: { id: String(id) } }) 
        }, () => [
            h(EyeIcon, { class: 'w-4 h-4 mr-1' }),
            'View'
        ]));

        if (hasPermission('MASTER_JENIS_BARANG_UPDATE')) {
            buttons.push(h(Button, { 
                variant: 'ghost',
                size: 'sm',
                onClick: () => createDialog.openDialog(row.original) 
            }, () => [
                h(PencilIcon, { class: 'w-4 h-4 mr-1' }),
                'Edit'
            ]));
        }

        if (hasPermission('MASTER_JENIS_BARANG_DELETE')) {
            buttons.push(h(DeleteButton, {
                onConfirm: async() => {
                    await deleteJenisBarang(id);
                    await fetchData()
                },
                confirmMessage: 'Apakah Anda yakin ingin menghapus Jenis Barang ini?'
            }));
        }

        return h('div', { class: 'flex gap-2 justify-center items-center' }, buttons);
        } } 
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
            <Button v-if="hasPermission('MASTER_JENIS_BARANG_CREATE')" @click="createDialog.openDialog()" variant="outline">
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
</template>
