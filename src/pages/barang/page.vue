<script setup lang="ts">
import { h, ref, watch, onMounted } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon, PencilIcon } from 'lucide-vue-next';

import { deleteBarang, getBarang } from '@/api/barang/barang';
import { type BarangResponseItem } from '@/schemas/barang/response';
import { barangSchema } from '@/routes/_authenticated/barang.index';

import DataTable from '@/components/DataTable.vue';
import { Button } from '@/components/ui/button';

import { usePermission } from '@/composables/usePermission';
import { useTable } from '@/composables/useTable';
import { formatDate } from '@/lib/formatter';
import DeleteButton from '@/components/DeleteButton.vue';

const { hasPermission } = usePermission();
const search = useSearch({ strict: false }) as any;
const router = useRouter();

const data = ref<BarangResponseItem[]>([]);
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



const { table, searchTerm, onSearch, clearFilter } = useTable({
    data: data,
    rowCount: totalCount,
    columns: [
        { header: 'Created At', accessorKey: 'created_at', cell: ({ row }) => formatDate(row.getValue('created_at')) },
        { header: 'ID Barang', accessorKey: 'id_barang' },
        { header: 'Kode Barang', accessorKey: 'kode' },
        { header: 'Nama Barang', accessorKey: 'nama_barang' },
        { header: 'Jenis', accessorKey: 'nama_jenis_barang' },
        { header: 'Perusahaan', accessorKey: 'nama_perusahaan' },
        { header: 'Actions', id: 'actions', cell:({ row }) => {
        const id = row.original.id_barang;
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
                onClick: () => router.navigate({ to: '/barang/edit/$id', params: { id: String(id) } })
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
            <Button v-if="hasPermission('MASTER_BARANG_CREATE')" @click="router.navigate({ to: '/barang/create' })" variant="outline">
                <PlusIcon class="w-4 h-4 mr-2" />
                Tambah Barang
            </Button>
        </template>
    </DataTable>
</template>
