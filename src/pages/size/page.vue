<script setup lang="ts">
import { h, ref, watch, onMounted } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon, PencilIcon } from 'lucide-vue-next';

import { deleteSize, getSize } from '@/api/size/size';
import { type SizeResponseItem } from '@/schemas/size/response';
import { sizeSchema } from '@/pages/size/schema';

import DataTable from '@/components/DataTable.vue';
import { Button } from '@/components/ui/button';

import { usePermission } from '@/composables/usePermission';
import { useTable } from '@/composables/useTable';

import { formatDate } from '@/lib/formatter';
import DeleteButton from '@/components/DeleteButton.vue';

const { hasPermission } = usePermission();
const search = useSearch({ strict: false }) as any;
const router = useRouter();

const data = ref<SizeResponseItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

const fetchData = async () => {
    isLoading.value = true;
    try {
        const page = search.value?.page ?? 1;
        const pageSize = search.value?.pageSize ?? 20;
        const filter = search.value?.filter ?? '';

        const response = await getSize({
            limit: pageSize,
            offset: (page - 1) * pageSize,
            search: filter
        });

        data.value = response.results;
        totalCount.value = response.count;
    } catch (error) {
        console.error("Gagal fetch data size:", error);
    } finally {
        isLoading.value = false;
    }
}

const { table, searchTerm, onSearch, clearFilter } = useTable({
    data: data,
    rowCount: totalCount,
    columns: [
        { header: 'Created At', accessorKey: 'created_at', cell: ({ row }) => formatDate(row.getValue('created_at')) },
        { header: 'ID Size', accessorKey: 'id_size' },
        { header: 'Nama Size', accessorKey: 'nama_size' },
        { header: 'Actions', id: 'actions', cell: ({ row }) => {
            const id = row.getValue('id_size') as number;
            const buttons = [];

            buttons.push(h(Button, {
                variant: 'outline',
                size: 'sm',
                onClick: () => router.navigate({ to: '/size/$id', params: { id: String(id) } })
            }, () => [
                h(EyeIcon, { class: 'w-4 h-4 mr-1' }),
                'View'
            ]));

            if (hasPermission('MASTER_SIZE_UPDATE')) {
                buttons.push(h(Button, {
                    variant: 'ghost',
                    size: 'sm',
                    onClick: () => router.navigate({ to: '/size/edit/$id', params: { id: String(id) } })
                }, () => [
                    h(PencilIcon, { class: 'w-4 h-4 mr-1' }),
                    'Edit'
                ]));
            }

            if (hasPermission('MASTER_SIZE_DELETE')) {
                buttons.push(h(DeleteButton, {
                    onConfirm: async () => {
                        await deleteSize(id);
                        await fetchData();
                    },
                    confirmMessage: 'Apakah Anda yakin ingin menghapus Size ini?'
                }));
            }

            return h('div', { class: 'flex gap-2 justify-center items-center' }, buttons);
        } }
    ],
    search: search,
    schema: sizeSchema,
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
            <Button v-if="hasPermission('MASTER_SIZE_CREATE')" @click="router.navigate({ to: '/size/create' })" variant="outline">
                <PlusIcon class="w-4 h-4 mr-2" />
                Tambah Size
            </Button>
        </template>
    </DataTable>
</template>
