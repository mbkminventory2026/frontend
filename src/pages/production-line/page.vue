<script setup lang="ts">
import { h, ref, watch, onMounted } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { PlusIcon, PencilIcon, EyeIcon } from 'lucide-vue-next';

import {
    deleteProductionLine,
    getProductionLines
} from '@/api/production-master/production-master';
import type { ProductionLine } from '@/api/production-master/production-master';
import { productionLineSchema } from '@/pages/production-line/schema';

import DataTable from '@/components/DataTable.vue';
import { Button } from '@/components/ui/button';
import { useTable } from '@/composables/useTable';
import { formatDate } from '@/lib/formatter';
import DeleteButton from '@/components/DeleteButton.vue';

const search = useSearch({ strict: false }) as any;
const router = useRouter();

const data = ref<ProductionLine[]>([]);
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

        const response = await getProductionLines({
            page,
            limit: pageSize,
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

const { table, searchTerm, onSearch, clearFilter } = useTable({
    data: data,
    rowCount: totalCount,
    columns: [
        { header: 'Created At', accessorKey: 'created_at', cell: ({ row }) => formatDate(row.getValue('created_at')) },
        { header: 'ID', accessorKey: 'id_production_line' },
        { header: 'Nama Line', accessorKey: 'name' },
        { header: 'Actions', id: 'actions', cell:({ row }) => {
            const id = row.getValue('id_production_line') as number;
            const buttons = [];

            buttons.push(h(Button, {
                variant: 'outline',
                size: 'sm',
                onClick: () => router.navigate({ to: '/production-line/$id', params: { id: String(id) } })
            }, () => [
                h(EyeIcon, { class: 'w-4 h-4 mr-1' }),
                'View'
            ]));

            buttons.push(h(Button, {
                variant: 'ghost',
                size: 'sm',
                onClick: () => router.navigate({ to: '/production-line/edit/$id', params: { id: String(id) } })
            }, () => [
                h(PencilIcon, { class: 'w-4 h-4 mr-1' }),
                'Edit'
            ]));

            buttons.push(h(DeleteButton, {
                onConfirm: async() => {
                    await deleteProductionLine(id);
                    await fetchData()
                },
                confirmMessage: 'Apakah Anda yakin ingin menghapus Line Produksi ini?'
            }));

            return h('div', { class: 'flex gap-2 justify-center items-center' }, buttons);
        } }
    ],
    search: search,
    schema: productionLineSchema,
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
            <Button @click="router.navigate({ to: '/production-line/create' })" variant="outline">
                <PlusIcon class="w-4 h-4 mr-2" />
                Tambah Line
            </Button>
        </template>
    </DataTable>
</template>
