<script setup lang="ts">
import { h, ref, watch, onMounted } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon, PencilIcon } from 'lucide-vue-next';

import { deleteBarang, getBarang, getBarangById, createBarang, updateBarang } from '@/api/barang/barang';
import { getJenisBarang } from '@/api/barang/jenisBarang';
import { getMitra } from '@/api/mitra/mitra';
import { type BarangResponseItem } from '@/schemas/barang/response';
import { barangSchema } from '@/routes/_authenticated/barang.index';

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

const data = ref<BarangResponseItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

const jenisBarangOptions = ref<{ label: string, value: number }[]>([]);
const mitraOptions = ref<{ label: string, value: number }[]>([]);

const fetchJenisBarang = async () => {
    try {
        const res = await getJenisBarang();
        jenisBarangOptions.value = res.map(item => ({
            label: item.nama_jenis_barang,
            value: item.id_jenis_barang
        }));
    } catch (error) {
        console.error("Gagal fetch jenis barang:", error);
    }
}

const fetchMitra = async () => {
    try {
        const res = await getMitra({ limit: 100, offset: 0 });
        mitraOptions.value = res.results.map((item: any) => ({
            label: item.nama_perusahaan,
            value: item.id_mitra
        }));
    } catch (error) {
        console.error("Gagal fetch mitra:", error);
    }
}


const fetchData = async () => {
    isLoading.value = true;
    try {
        const page = search.value?.page ?? 1;
        const pageSize = search.value?.pageSize ?? 20;
        const filter = search.value?.filter ?? '';
        const sortBy = search.value?.sortBy;
        const sortDesc = search.value?.sortDesc ?? false;

        const response = await getBarang({
            page,
            pageSize,
            search: filter,
            sortBy,
            sortDesc
        });

        data.value = response.results;
        totalCount.value = response.count;
    } catch (error) {
        console.error("Gagal fetch data barang:", error);
    } finally {
        isLoading.value = false;
    }
}

const createDialog = useDialog({
    onSubmit: async (values, isEdit) => {
        if (isEdit) {
            return await updateBarang(values.id_barang, values);
        } else {
            return await createBarang(values);
        }
    },
    onSuccess: () => fetchData() 
});

const { table, searchTerm, onSearch, clearFilter } = useTable({
    data: data,
    rowCount: totalCount,
    columns: [
        { header: 'Created At', accessorKey: 'created_at', cell: ({ row }) => formatDate(row.getValue('created_at')) },
        { header: 'Kode Barang', accessorKey: 'kode' },
        { header: 'Nama Barang', accessorKey: 'nama_barang' },
        { header: 'Jenis', accessorKey: 'nama_jenis_barang' },
        { header: 'Perusahaan', accessorKey: 'nama_perusahaan' },
        { header: 'Actions', id: 'actions', cell:({ row }) => {
        const id = row.getValue('id_barang') as number;
        const buttons = [];

        buttons.push(h(Button, { 
            variant: 'outline',
            size: 'sm',
            onClick: () => router.navigate({ to: '/barang/$id', params: { id: String(id) } }) 
        }, () => [
            h(EyeIcon, { class: 'w-4 h-4 mr-1' }),
            'View'
        ]));

        if (hasPermission('MASTER_BARANG_UPDATE')) {
            buttons.push(h(Button, { 
                variant: 'ghost',
                size: 'sm',
                onClick: async () => {
                    try {
                        const detailData = (await getBarangById(id)) as any;
                        
                        // Fallback mapping if IDs are missing but names are present
                        if ((detailData.id_jenis_barang === undefined || detailData.id_jenis_barang === null) && detailData.nama_jenis_barang) {
                            const option = jenisBarangOptions.value.find(opt => 
                                opt.label.trim().toLowerCase() === detailData.nama_jenis_barang.trim().toLowerCase()
                            );
                            if (option) detailData.id_jenis_barang = option.value;
                        }
                        if ((detailData.id_mitra === undefined || detailData.id_mitra === null) && detailData.nama_perusahaan) {
                            const option = mitraOptions.value.find(opt => 
                                opt.label.trim().toLowerCase() === detailData.nama_perusahaan.trim().toLowerCase()
                            );
                            if (option) detailData.id_mitra = option.value;
                        }

                        createDialog.openDialog(detailData);
                    } catch (error) {
                        console.error("Gagal fetch detail untuk edit:", error);
                    }
                }
            }, () => [
                h(PencilIcon, { class: 'w-4 h-4 mr-1' }),
                'Edit'
            ]));
        }

        if (hasPermission('MASTER_BARANG_DELETE')) {
            buttons.push(h(DeleteButton, {
                onConfirm: async() => {
                    await deleteBarang(id);
                    await fetchData()
                },
                confirmMessage: 'Apakah Anda yakin ingin menghapus Barang ini?',
                resourceName: 'Barang'
            }));
        }

        return h('div', { class: 'flex gap-2 justify-center items-center' }, buttons);
        } } 
    ],
    search: search,
    schema: barangSchema,
})

const BarangDialogSchema = computed<DialogSchemaType>(() => [
    {
        key: "kode",
        label: "Kode Barang",
        type: "text",
        placeholder: "Contoh: BRG-001",
        rules: "required",
        position: "full"
    },
    {
        key: "nama_barang",
        label: "Nama Barang",
        type: "text",
        placeholder: "Masukkan nama barang",
        rules: "required",
        position: "full"
    },
    {
        key: "id_jenis_barang",
        label: "Jenis Barang",
        type: "select",
        placeholder: "Pilih jenis barang",
        rules: "required",
        position: "left",
        options: jenisBarangOptions.value
    },
    {
        key: "id_mitra",
        label: "Perusahaan (Mitra)",
        type: "select",
        placeholder: "Pilih mitra",
        rules: "required",
        position: "right",
        options: mitraOptions.value
    }
])

onMounted(() => {
    fetchData();
    fetchJenisBarang();
    fetchMitra();
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
            <Button v-if="hasPermission('MASTER_BARANG_CREATE')" @click="createDialog.openDialog()" variant="outline">
                <PlusIcon class="w-4 h-4 mr-2" />
                Tambah Barang
            </Button>
        </template>
    </DataTable>

    <AppDialog
        :title="createDialog.isEditMode.value ? 'Edit Barang' : 'Tambah Barang'"
        :description="createDialog.isEditMode.value ? 'Perbarui informasi barang di bawah ini.' : 'Masukkan detail barang baru di sini.'"
        :schema="BarangDialogSchema"
        :is-open="createDialog.isOpen.value"
        :initial-values="createDialog.initialValues.value"
        :submit-label="createDialog.isLoading.value ? 'Sending...' : (createDialog.isEditMode.value ? 'Update' : 'Create')"
        @update:is-open="createDialog.isOpen.value = $event"
        @submit="createDialog.handleSubmit"
    />
</template>
