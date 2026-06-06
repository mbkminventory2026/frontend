<script setup lang="ts">
import { h, ref, watch, onMounted } from 'vue';
import { useSearch } from '@tanstack/vue-router';
import { Plus, Pencil } from 'lucide-vue-next';

// API & Types
import { getCoba, createCoba, updateCoba } from '@/api/coba/coba';
import { type CobaListItem } from '@/schemas/coba/coba';
import { pokemonSearchSchema } from '@/pages/pokemon/list/schema';

// Components
import DataTable from '@/components/DataTable.vue';
import AppDialog from '@/components/AppDialog.vue';
import { Button } from '@/components/ui/button';

// Composables & Schemas
import { useTable } from '@/composables/useTable';
import { useDialog } from '@/composables/useDialog';
import { type DialogSchemaType } from '@/schemas/dialog/dialog'; // Schema JSON yang kita buat tadi

const search = useSearch({ from: '/_authenticated/pokemon' });

const data = ref<CobaListItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

const fetchData = async () => {
    isLoading.value = true;
    try {
        const page = search.value.page ?? 1;
        const pageSize = search.value.pageSize ?? 20;
        const filter = search.value.filter ?? '';

        const response = await getCoba({
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

// 1. Dialog untuk Tambah Data
const createDialog = useDialog({
    onSubmit: async (values) => await createCoba(values),
    onSuccess: () => fetchData() // Refresh tabel setelah tambah
});

// 2. Dialog untuk Edit Data
const updateDialog = useDialog({
    onSubmit: async (values) => await updateCoba(values.id, values),
    onSuccess: () => fetchData() // Refresh tabel setelah update
});

// --- LOGIC TABLE ---

const { table, searchTerm, onSearch, clearFilter } = useTable({
    data: data,
    rowCount: totalCount,
    columns: [
        { header: 'Album ID', accessorKey: 'albumId' },
        { header: 'ID', accessorKey: 'id' },
        { header: 'Title', accessorKey: 'title' },
        { header: 'URL', accessorKey: 'url' },
        { header: 'Thumbnail URL', accessorKey: 'thumbnailUrl' },
        { 
            header: 'Actions', 
            id: 'actions',
            cell: ({ row }) => h('div', { class: 'text-right' }, [
                h(Button, {
                    variant: 'ghost',
                    size: 'sm',
                    onClick: () => updateDialog.openDialog(row.original) // Buka dialog edit dengan data row
                }, () => h(Pencil, { class: 'w-4 h-4' }))
            ])
        },
    ],
    search: search,
    schema: pokemonSearchSchema,
})

const vendorSchema: DialogSchemaType = [
  {
    key: "vendor_type",
    label: "Tipe Vendor",
    type: "select",
    placeholder: "Pilih tipe vendor",
    rules: "required",
    position: "left",
    options: [
      { label: "Individu", value: "individual" },
      { label: "Perusahaan", value: "corporate" }
    ]
  },
  {
    key: "vendor_name",
    label: "Nama Lengkap",
    type: "text",
    placeholder: "Nama sesuai KTP",
    rules: "required",
    position: "right",
    // Field ini selalu muncul
  },
  {
    key: "company_name",
    label: "Nama PT / CV",
    type: "text",
    placeholder: "Contoh: PT. Permata Tekstil",
    rules: "required",
    position: "full",
    // DEPENDENCY: Hanya muncul jika vendor_type adalah corporate
    dependency: {
      parentKey: "vendor_type",
      condition: "===",
      value: "corporate",
      action: "show"
    }
  },
  {
    key: "category",
    label: "Kategori Barang",
    type: "select",
    placeholder: "Pilih kategori",
    rules: "required",
    position: "left",
    options: [
      { label: "Bahan Baku", value: "raw_material" },
      { label: "Suku Cadang Mesin", value: "sparepart" }
    ]
  },
  {
    key: "serial_number",
    label: "Serial Number Mesin",
    type: "text",
    placeholder: "Masukkan S/N Mesin",
    rules: "required",
    position: "right",
    // DEPENDENCY: Hanya muncul jika kategori adalah sparepart
    dependency: {
      parentKey: "category",
      condition: "===",
      value: "sparepart",
      action: "show"
    }
  },
  {
    key: "notes",
    label: "Catatan Tambahan",
    type: "textarea",
    placeholder: "Tambahkan info tambahan jika ada",
    rules: "",
    position: "full"
  }
];
onMounted(() => {
    fetchData();
});

watch(() => search, () => {
    fetchData();
}, { deep: true });
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
                <Plus class="w-4 h-4 mr-2" />
                Tambah Data
            </Button>
        </template>
    </DataTable>

    <AppDialog
        title="Tambah Item Baru"
        description="Masukkan detail item coba di sini."
        :schema="vendorSchema"
        :is-open="createDialog.isOpen.value"
        :submit-label="createDialog.isLoading.value ? 'Sending...' : 'Create'"
        @update:is-open="createDialog.isOpen.value = $event"
        @submit="createDialog.handleSubmit"
    />

    <AppDialog
        title="Edit Item"
        description="Perbarui informasi data yang dipilih."
        :schema="vendorSchema"
        :is-open="updateDialog.isOpen.value"
        :initial-values="updateDialog.initialValues.value"
        :submit-label="updateDialog.isLoading.value ? 'Updating...' : 'Update'"
        @update:is-open="updateDialog.isOpen.value = $event"
        @submit="updateDialog.handleSubmit"
    />
</template>