<script setup lang="ts">
import { h, ref, watch, onMounted } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon, PencilIcon } from 'lucide-vue-next';

import { 
    deleteMitra, 
    getMitra, 
    createMitra, 
    updateMitra 
} from '@/api/mitra/mitra';
import { type MitraResponseItem } from '@/schemas/mitra/response';
import { mitraSchema } from '@/routes/_authenticated/mitra.index';

import DataTable from '@/components/DataTable.vue';
import AppDialog from '@/components/AppDialog.vue';
import { Button } from '@/components/ui/button';

import { useTable } from '@/composables/useTable';
import { useDialog } from '@/composables/useDialog';
import { type DialogSchemaType } from '@/schemas/dialog/dialog';
import { formatDate } from '@/lib/formatter';
import DeleteButton from '@/components/DeleteButton.vue';
import { computed } from 'vue';

const search = useSearch({ strict: false }) as any;
const router = useRouter();

const data = ref<MitraResponseItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

const fetchData = async () => {
    isLoading.value = true;
    try {
        const page = search.value?.page ?? 1;
        const pageSize = search.value?.pageSize ?? 20;
        const filter = search.value?.filter ?? '';

        const response = await getMitra({
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
            return await updateMitra(values.id_mitra, values);
        } else {
            return await createMitra(values);
        }
    },
    onSuccess: () => fetchData() 
});

const { table, searchTerm, onSearch, clearFilter } = useTable({
    data: data,
    rowCount: totalCount,
    columns: [
        { header: 'Created At', accessorKey: 'created_at', cell: ({ row }) => formatDate(row.getValue('created_at')) },
        { header: 'ID Mitra', accessorKey: 'id_mitra' },
        { header: 'Perusahaan', accessorKey: 'nama_perusahaan' },
        { header: 'Tipe', accessorKey: 'tipe_perusahaan' },
        { header: 'Email', accessorKey: 'email' },
        { header: 'No. Telp', accessorKey: 'no_telp' },
        { header: 'Actions', id: 'actions', cell:({ row }) => {
        const id = row.getValue('id_mitra') as number;

        return h('div', { class: 'flex gap-2 justify-center items-center' }, [
            h(Button, { 
                variant: 'outline',
                size: 'sm',
                onClick: () => router.navigate({ to: '/mitra/$id', params: { id: String(id) } }) 
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
                    await deleteMitra(id);
                    await fetchData()
                },
                confirmMessage: 'Apakah Anda yakin ingin menghapus Mitra ini?'
            })
        ]) } 
    }
    ],
    search: search,
    schema: mitraSchema,
})

const MitraDialogSchema = computed<DialogSchemaType>(() => [
    {
        key: "nama_perusahaan",
        label: "Nama Perusahaan",
        type: "text",
        placeholder: "Masukkan nama perusahaan",
        rules: "required",
        position: "full"
    },
    {
        key: "tipe_perusahaan",
        label: "Tipe Perusahaan",
        type: "text",
        placeholder: "Contoh: Supplier, Client, dll",
        rules: "required",
        position: "left"
    },
    {
        key: "email",
        label: "Email",
        type: "text",
        placeholder: "contoh@email.com",
        rules: "required|email",
        position: "right"
    },
    {
        key: "no_telp",
        label: "No. Telp",
        type: "text",
        placeholder: "08xxxxxxxxxx",
        rules: "required",
        position: "left"
    },
    {
        key: "kota",
        label: "Kota",
        type: "text",
        placeholder: "Masukkan kota",
        rules: "required",
        position: "right"
    },
    {
        key: "kode_pos",
        label: "Kode Pos",
        type: "text",
        placeholder: "xxxxx",
        rules: "required",
        position: "left"
    },
    {
        key: "alamat",
        label: "Alamat",
        type: "text",
        placeholder: "Masukkan alamat lengkap",
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
                Tambah Mitra
            </Button>
        </template>
    </DataTable>

    <AppDialog
        :title="createDialog.isEditMode.value ? 'Edit Mitra' : 'Tambah Mitra'"
        :description="createDialog.isEditMode.value ? 'Perbarui informasi mitra di bawah ini.' : 'Masukkan detail mitra baru di sini.'"
        :schema="MitraDialogSchema"
        :is-open="createDialog.isOpen.value"
        :initial-values="createDialog.initialValues.value"
        :submit-label="createDialog.isLoading.value ? 'Sending...' : (createDialog.isEditMode.value ? 'Update' : 'Create')"
        @update:is-open="createDialog.isOpen.value = $event"
        @submit="createDialog.handleSubmit"
    />
</template>