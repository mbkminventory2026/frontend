<script setup lang="ts">
import { h, ref, watch, onMounted } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon, BuildingIcon, PencilIcon } from 'lucide-vue-next';

import { deleteBarang, getBarang, getBarangById, createBarang, updateBarang } from '@/api/barang/barang';
import { getJenisBarang } from '@/api/barang/jenisBarang';
import { getMitra } from '@/api/mitra/mitra';
import { type BarangResponseItem } from '@/schemas/barang/response';
import { barangSchema } from '@/routes/_authenticated/barang';

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
import { computed } from 'vue';

const search = useSearch({ from: '/_authenticated/barang' });
const router = useRouter();

const data = ref<BarangResponseItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

const isDetailOpen = ref(false);
const selectedDetailData = ref<any>(null);
const isDetailLoading = ref(false);

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

const detailSchema: DetailSchema = [
  { 
    key: 'id_barang', 
    label: 'ID Barang', 
    icon: Hash 
  },
  { 
    key: 'kode', 
    label: 'Kode',  
  },
  { 
    key: 'nama_barang', 
    label: 'Nama', 
    icon: Package 
  },
  { 
    key: 'nama_jenis_barang', 
    label: 'Jenis Barang', 
    icon: Layers,
  },
  { 
    key: 'nama_perusahaan', 
    label: 'Perusahaan', 
    icon: BuildingIcon,
  }

];

const handleViewDetail = async (id: number) => {
    isDetailOpen.value = true;
    isDetailLoading.value = true;
    try {
        const res = await getBarangById(id);
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

        const response = await getBarang({
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
        { header: 'ID Barang', accessorKey: 'id_barang' },
        { header: 'Nama', accessorKey: 'nama_barang' },
        { header: 'Jenis', accessorKey: 'nama_jenis_barang' },
        { header: 'Perusahaan', accessorKey: 'nama_perusahaan' },
        { header: 'Actions', id: 'actions', cell:({ row }) => {
        const id = row.getValue('id_barang') as number;

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
                    await deleteBarang(id);
                    await fetchData()
                },
                confirmMessage: 'Apakah Anda yakin ingin menghapus Barang ini?'
            })
        ]) } 
    }
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
            <Button @click="createDialog.openDialog()" variant="outline">
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

    <Dialog :open="isDetailOpen" @update:open="isDetailOpen = $event">
        <DialogContent class="sm:max-w-[600px] p-0 overflow-hidden border-none bg-transparent shadow-none">
            <AppDetailView
                title="Quick View Barang"
                description="Detail informasi barang."
                :data="selectedDetailData"
                :schema="detailSchema"
                :is-loading="isDetailLoading"
                :show-edit="false"
                :show-delete="false"
            />
        </DialogContent>
    </Dialog>
</template>
