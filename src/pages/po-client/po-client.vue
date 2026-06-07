<script setup lang="ts">
import { h, ref, watch, onMounted, computed } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon, PencilIcon } from 'lucide-vue-next';

import { getPOClients, type POClientListItem } from '@/api/po-clients/po-clients';
import { poClientSchema } from '@/pages/po-client/schema';

import DataTable from '@/components/DataTable.vue';
import { Button } from '@/components/ui/button';
import { useTable } from '@/composables/useTable';
import { formatDate } from '@/lib/formatter';

import { usePermission } from '@/composables/usePermission';

const search = useSearch({ strict: false }) as any;
const router = useRouter();
const { hasPermission } = usePermission();

const data = ref<POClientListItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

const canCreate = computed(() => {
    return hasPermission('PO_CLIENT_CREATE');
});

const canUpdate = computed(() => {
    return hasPermission('PO_CLIENT_UPDATE');
});

const fetchData = async () => {
    isLoading.value = true;
    try {
        const page = search.value?.page ?? 1;
        const pageSize = search.value?.pageSize ?? 20;
        const filter = search.value?.filter ?? '';
        const sortBy = search.value?.sortBy;
        const sortDesc = search.value?.sortDesc ?? false;

        const response = await getPOClients({
            page,
            pageSize,
            search: filter,
            sortBy,
            sortDesc
        });

        data.value = response.results;
        totalCount.value = response.count;
    } catch (error) {
        console.error("Gagal fetch PO Clients:", error);
    } finally {
        isLoading.value = false;
    }
};

const { table, searchTerm, onSearch, clearFilter } = useTable({
    data: data,
    rowCount: totalCount,
    columns: [
        { header: 'Created At', accessorKey: 'created_at', cell: ({ row }) => formatDate(row.getValue('created_at')) },
        { header: 'ID PO', accessorKey: 'id_po_client' },
        { 
            header: 'PO Number', 
            accessorKey: 'po_number',
            cell: ({ row }) => {
                const poNumber = row.getValue('po_number') as string;
                const hasRetur = row.original.has_retur;
                return h('div', { class: 'flex items-center gap-2' }, [
                    h('span', { class: 'font-semibold' }, poNumber),
                    hasRetur ? h('span', { 
                        class: 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200 animate-pulse' 
                    }, 'Retur Diajukan') : null
                ]);
            }
        },
        { header: 'Tanggal', accessorKey: 'tanggal', cell: ({ row }) => formatDate(row.getValue('tanggal')) },
        { header: 'Season', accessorKey: 'season' },
        { header: 'Delivery', accessorKey: 'delivery', cell: ({ row }) => formatDate(row.getValue('delivery')) },
        { header: 'Mitra', accessorKey: 'mitra_name' },
        { header: 'Actions', id: 'actions', cell:({ row }) => {
            const id = row.getValue('id_po_client') as number;
            const buttons = [];

            buttons.push(h(Button, { 
                variant: 'outline',
                size: 'sm',
                onClick: () => router.navigate({ to: '/po-client/$id', params: { id: String(id) } }) 
            }, () => [
                h(EyeIcon, { class: 'w-4 h-4 mr-1' }),
                'View'
            ]));

            if (canUpdate.value) {
                buttons.push(h(Button, { 
                    variant: 'ghost',
                    size: 'sm',
                    onClick: () => router.navigate({ to: '/po-client/edit/$id', params: { id: String(id) } }) 
                }, () => [
                    h(PencilIcon, { class: 'w-4 h-4 mr-1' }),
                    'Edit'
                ]));
            }

            return h('div', { class: 'flex gap-2 justify-center items-center' }, buttons);
        } }
    ],
    search: search,
    schema: poClientSchema,
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
        <template #actions v-if="canCreate">
            <Button @click="router.navigate({ to: '/po-client/create' })" variant="outline" class="shadow-sm border-neutral-300">
                <PlusIcon class="w-4 h-4 mr-2" />
                Tambah PO Client
            </Button>
        </template>
    </DataTable>
</template>
