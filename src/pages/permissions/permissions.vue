<script setup lang="ts">
import { h, ref, watch, onMounted } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon, PencilIcon } from 'lucide-vue-next';

import {
    deletePermissions,
    getPermissions
} from '@/api/permissions/permissions';
import { type PermissionsResponseItem } from '@/schemas/permissions/response';
import { permissionsSchema } from '@/routes/_authenticated/permissions.index';

import DataTable from '@/components/DataTable.vue';
import { Button } from '@/components/ui/button';

import { useTable } from '@/composables/useTable';
import { usePermission } from '@/composables/usePermission';
import { formatDate } from '@/lib/formatter';
import DeleteButton from '@/components/DeleteButton.vue';

const search = useSearch({ strict: false }) as any;
const router = useRouter();

const data = ref<PermissionsResponseItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);
const { hasPermission } = usePermission();

const fetchData = async () => {
    isLoading.value = true;
    try {
        const page = search.value?.page ?? 1;
        const pageSize = search.value?.pageSize ?? 20;
        const filter = search.value?.filter ?? '';
        const sortBy = search.value?.sortBy;
        const sortDesc = search.value?.sortDesc ?? false;

        const response = await getPermissions({
            page,
            pageSize,
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
        { header: 'ID Hak Akses', accessorKey: 'id_hak_akses' },
        { header: 'Nama Halaman', accessorKey: 'nama_halaman' },
        { header: 'Actions', id: 'actions', cell:({ row }) => {
        const id = row.getValue('id_hak_akses') as number;

        return h(
            'div',
            { class: 'flex gap-2 justify-center items-center' },
            [
                h(Button, {
                    variant: 'outline',
                    size: 'sm',
                    onClick: () => router.navigate({ to: '/permissions/$id', params: { id: String(id) } })
                }, () => [
                    h(EyeIcon, { class: 'w-4 h-4 mr-1' }),
                    'View'
                ]),
                hasPermission('PERMISSION_UPDATE')
                    ? h(Button, {
                        variant: 'ghost',
                        size: 'sm',
                        onClick: () => router.navigate({ to: '/permissions/edit/$id', params: { id: String(id) } })
                    }, () => [
                        h(PencilIcon, { class: 'w-4 h-4 mr-1' }),
                        'Edit'
                    ])
                    : null,
                hasPermission('PERMISSION_DELETE')
                    ? h(DeleteButton, {
                        onConfirm: async() => {
                            await deletePermissions(id);
                            await fetchData()
                        },
                        confirmMessage: 'Apakah Anda yakin ingin menghapus Permissions ini?'
                    })
                    : null,
            ].filter(Boolean)
        ) }
    }
    ],
    search: search,
    schema: permissionsSchema,
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
            <Button
                v-if="hasPermission('PERMISSION_CREATE')"
                @click="router.navigate({ to: '/permissions/create' })"
                variant="outline"
            >
                <PlusIcon class="w-4 h-4 mr-2" />
                Tambah Permissions
            </Button>
        </template>
    </DataTable>
</template>
