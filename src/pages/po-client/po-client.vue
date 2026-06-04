<script setup lang="ts">
import { h, ref, watch, onMounted, computed } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon, PencilIcon } from 'lucide-vue-next';

import { useAuthStore } from '@/store/authStore';
import { getPOClients, type POClientListItem } from '@/api/po-clients/po-clients';
import { poClientSchema } from '@/routes/_authenticated/po-client.index';

import DataTable from '@/components/DataTable.vue';
import { Button } from '@/components/ui/button';
import { useTable } from '@/composables/useTable';
import { formatDate } from '@/lib/formatter';

const search = useSearch({ strict: false }) as any;
const router = useRouter();
const authStore = useAuthStore();

const data = ref<POClientListItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

const canCreateOrEdit = computed(() => {
    if (authStore.isMitra) return true;
    const role = authStore.user?.role?.toLowerCase() || '';
    const isSuperAdmin = role === 'super-admin' || role === 'super_admin' || role === 'admin';
    return isSuperAdmin || authStore.permissions.includes('PO_CREATE') || authStore.isManager;
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
        { header: 'PO Number', accessorKey: 'po_number' },
        { header: 'Tanggal', accessorKey: 'tanggal', cell: ({ row }) => formatDate(row.getValue('tanggal')) },
        { header: 'Season', accessorKey: 'season' },
        { header: 'Delivery', accessorKey: 'delivery', cell: ({ row }) => formatDate(row.getValue('delivery')) },
        { header: 'Mitra', accessorKey: 'mitra_name' },
        { header: 'Actions', id: 'actions', cell:({ row }) => {
            const id = row.getValue('id_po_client') as number;

            return h('div', { class: 'flex gap-2 justify-center items-center' }, [
                h(Button, { 
                    variant: 'outline',
                    size: 'sm',
                    onClick: () => router.navigate({ to: '/po-client/$id', params: { id: String(id) } }) 
                }, () => [
                    h(EyeIcon, { class: 'w-4 h-4 mr-1' }),
                    'View'
                ]),
                ...(canCreateOrEdit.value ? [
                    h(Button, { 
                        variant: 'ghost',
                        size: 'sm',
                        onClick: () => router.navigate({ to: '/po-client/edit/$id', params: { id: String(id) } }) 
                    }, () => [
                        h(PencilIcon, { class: 'w-4 h-4 mr-1' }),
                        'Edit'
                    ])
                ] : [])
            ])
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
        <template #actions v-if="canCreateOrEdit">
            <Button @click="router.navigate({ to: '/po-client/create' })" variant="outline" class="shadow-sm border-neutral-300">
                <PlusIcon class="w-4 h-4 mr-2" />
                Tambah PO Client
            </Button>
        </template>
    </DataTable>
</template>
