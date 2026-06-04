<script setup lang="ts">
import { h, ref, watch, onMounted, computed } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon, PencilIcon } from 'lucide-vue-next';

import { deleteWarna, getWarna, getWarnaById, createWarna, updateWarna } from '@/api/warna/warna';
import { type WarnaResponseItem } from '@/schemas/warna/response';
import { warnaSchema } from '@/routes/_authenticated/warna.index';

import DataTable from '@/components/DataTable.vue';
import AppDialog from '@/components/AppDialog.vue';
import { Button } from '@/components/ui/button';

import { useTable } from '@/composables/useTable';
import { useDialog } from '@/composables/useDialog';
import { type DialogSchemaType } from '@/schemas/dialog/dialog';
import { formatDate } from '@/lib/formatter';
import DeleteButton from '@/components/DeleteButton.vue';
import { isSimilarName } from '@/lib/utils';

const search = useSearch({ strict: false }) as any;
const router = useRouter();

const data = ref<WarnaResponseItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

const allWarna = ref<WarnaResponseItem[]>([]);
const dialogFormValues = ref<Record<string, any>>({});

const fetchData = async () => {
    isLoading.value = true;
    try {
        const page = search.value?.page ?? 1;
        const pageSize = search.value?.pageSize ?? 20;
        const filter = search.value?.filter ?? '';

        const response = await getWarna({
            limit: pageSize,
            offset: (page - 1) * pageSize,
            search: filter
        });

        data.value = response.results;
        totalCount.value = response.count;
    } catch (error) {
        console.error("Gagal fetch data warna:", error);
    } finally {
        isLoading.value = false;
    }
}

const fetchAllWarna = async () => {
    try {
        const response = await getWarna({ limit: 1000, offset: 0 });
        allWarna.value = response.results;
    } catch (error) {
        console.error("Gagal fetch semua data warna untuk validasi kemiripan:", error);
    }
}

const createDialog = useDialog({
    onSubmit: async (values, isEdit) => {
        if (isEdit) {
            const { 
                created_at, 
                id_warna,
                ...payload 
            } = values;
            
            return await updateWarna(id_warna, payload);
        } else {
            return await createWarna(values);
        }
    },
    onSuccess: () => {
        fetchData();
        fetchAllWarna();
    } 
});

const warningMessage = computed(() => {
    const inputName = dialogFormValues.value?.nama_warna?.trim().toLowerCase();
    if (!inputName) return '';

    const isEdit = createDialog.isEditMode.value;
    const currentId = createDialog.initialValues.value?.id_warna;

    const similar = allWarna.value.find(w => {
        if (isEdit && Number(w.id_warna) === Number(currentId)) return false;
        return isSimilarName(w.nama_warna, inputName);
    });

    if (similar) {
        return `Peringatan: Warna dengan nama yang mirip sudah ada ("${similar.nama_warna}" dengan kode HEX: ${similar.kode_hex || '-'}).`;
    }
    return '';
});

watch(() => createDialog.isOpen.value, (isOpen) => {
    if (!isOpen) {
        dialogFormValues.value = {};
    } else {
        dialogFormValues.value = { ...createDialog.initialValues.value };
    }
});

const { table, searchTerm, onSearch, clearFilter } = useTable({
    data: data,
    rowCount: totalCount,
    columns: [
        { header: 'Created At', accessorKey: 'created_at', cell: ({ row }) => formatDate(row.getValue('created_at')) },
        { header: 'ID Warna', accessorKey: 'id_warna' },
        { header: 'Nama Warna', accessorKey: 'nama_warna' },
        { 
            header: 'Kode HEX', 
            accessorKey: 'kode_hex',
            cell: ({ row }) => {
                const hex = row.getValue('kode_hex') as string;
                if (!hex) return '-';
                return h('div', { class: 'flex items-center gap-2 font-mono' }, [
                    h('span', { 
                        class: 'w-4 h-4 rounded-full border border-slate-200 shadow-xs inline-block',
                        style: { backgroundColor: hex }
                    }),
                    hex
                ]);
            }
        },
        { header: 'Actions', id: 'actions', cell:({ row }) => {
        const id = row.getValue('id_warna') as number;

        return h('div', { class: 'flex gap-2 justify-center items-center' }, [
            h(Button, { 
                variant: 'outline',
                size: 'sm',
                onClick: () => router.navigate({ to: '/warna/$id', params: { id: String(id) } }) 
            }, () => [
                h(EyeIcon, { class: 'w-4 h-4 mr-1' }),
                'View'
            ]),
            h(Button, { 
                variant: 'ghost',
                size: 'sm',
                onClick: async () => {
                    try {
                        const res = await getWarnaById(id);
                        const detailData = Array.isArray(res) ? { ...(res[0] as any) } : { ...(res as any) };
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
                    await deleteWarna(id);
                    await fetchData();
                    await fetchAllWarna();
                },
                confirmMessage: 'Apakah Anda yakin ingin menghapus Warna ini?'
            })
        ]) } 
    }
    ],
    search: search,
    schema: warnaSchema,
})

const WarnaDialogSchema = computed<DialogSchemaType>(() => [
    {
        key: "nama_warna",
        label: "Nama Warna",
        type: "text",
        placeholder: "Contoh: Merah, Biru, Hijau",
        rules: "required",
        position: "full"
    },
    {
        key: "kode_hex",
        label: "Kode HEX Warna",
        type: "text",
        placeholder: "Contoh: #FF0000 atau #FFFFFF (Opsional)",
        rules: "",
        position: "full"
    }
])

onMounted(() => {
    fetchData();
    fetchAllWarna();
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
                Tambah Warna
            </Button>
        </template>
    </DataTable>

    <AppDialog
        :title="createDialog.isEditMode.value ? 'Edit Warna' : 'Tambah Warna'"
        :description="createDialog.isEditMode.value ? 'Perbarui informasi warna di bawah ini.' : 'Masukkan detail warna baru di sini.'"
        :schema="WarnaDialogSchema"
        :is-open="createDialog.isOpen.value"
        :initial-values="createDialog.initialValues.value"
        :submit-label="createDialog.isLoading.value ? 'Sending...' : (createDialog.isEditMode.value ? 'Update' : 'Create')"
        :warning-message="warningMessage"
        @update:is-open="createDialog.isOpen.value = $event"
        @submit="createDialog.handleSubmit"
        @change="(vals) => dialogFormValues = vals"
    />
</template>
