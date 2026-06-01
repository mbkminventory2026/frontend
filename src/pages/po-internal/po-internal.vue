<script setup lang="ts">
import { h, ref, watch, onMounted } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon } from 'lucide-vue-next';

import { getPOInternals, type POInternalListItem } from '@/api/po-internals/po-internals';
import { poInternalSchema } from '@/routes/_authenticated/po-internal.index';

import DataTable from '@/components/DataTable.vue';
import { Button } from '@/components/ui/button';
import { useTable } from '@/composables/useTable';
import { formatDate } from '@/lib/formatter';

const search = useSearch({ strict: false }) as any;
const router = useRouter();

const data = ref<POInternalListItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

const fetchData = async () => {
    isLoading.value = true;
    try {
        const page = search.value?.page ?? 1;
        const pageSize = search.value?.pageSize ?? 20;
        const filter = search.value?.filter ?? '';

        const response = await getPOInternals({
            limit: pageSize,
            offset: (page - 1) * pageSize,
            search: filter
        });

        data.value = response.results;
        totalCount.value = response.count;
    } catch (error) {
        console.error("Gagal fetch PO Internals:", error);
    } finally {
        isLoading.value = false;
    }
};

const { table, searchTerm, onSearch, clearFilter } = useTable({
    data: data,
    rowCount: totalCount,
    columns: [
        { header: 'Created At', accessorKey: 'created_at', cell: ({ row }) => formatDate(row.getValue('created_at')) },
        { header: 'ID PO', accessorKey: 'id_po_internal' },
        { header: 'Nama PO', accessorKey: 'nama_po' },
        { header: 'Tanggal', accessorKey: 'tanggal', cell: ({ row }) => formatDate(row.getValue('tanggal')) },
        { header: 'Supplier', accessorKey: 'supplier_name' },
        { header: 'Currency', accessorKey: 'currency' },
        { header: 'Ship Date', accessorKey: 'ship_date', cell: ({ row }) => formatDate(row.getValue('ship_date')) },
        {
            header: 'Actions', id: 'actions', cell: ({ row }) => {
                const id = row.getValue('id_po_internal') as number;
                return h('div', { class: 'flex gap-2 justify-center items-center' }, [
                    h(Button, {
                        variant: 'outline',
                        size: 'sm',
                        onClick: () => router.navigate({ to: '/po-internal/$id', params: { id: String(id) } })
                    }, () => [
                        h(EyeIcon, { class: 'w-4 h-4 mr-1' }),
                        'View'
                    ])
                ])
            }
        }
    ],
    search: search,
    schema: poInternalSchema,
});

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
            <Button @click="router.navigate({ to: '/po-internal/create' })" variant="outline" class="shadow-sm border-neutral-300">
                <PlusIcon class="w-4 h-4 mr-2" />
                Tambah PO Internal
            </Button>
        </template>
    </DataTable>
</template>
