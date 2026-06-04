<script setup lang="ts">
import { h, ref, watch, onMounted } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon, PencilIcon } from 'lucide-vue-next';

import {
    deleteDepartemen,
    getDepartemen
} from '@/api/departemen/departemen';
import { type DepartemenResponseItem } from '@/schemas/departemen/response';
import { departemenSchema } from '@/routes/_authenticated/departemen.index';

import DataTable from '@/components/DataTable.vue';

import { Button } from '@/components/ui/button';

import { usePermission } from '@/composables/usePermission';
import { useTable } from '@/composables/useTable';

import { formatDate } from '@/lib/formatter';
import DeleteButton from '@/components/DeleteButton.vue';

const { hasPermission } = usePermission();
const search = useSearch({ strict: false }) as any;
const router = useRouter();

const data = ref<DepartemenResponseItem[]>([]);
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

        const response = await getDepartemen({
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

// Dialog removed - using separate create/edit pages instead

const { table, searchTerm, onSearch, clearFilter } = useTable({
    data: data,
    rowCount: totalCount,
    columns: [
        { header: 'Created At', accessorKey: 'created_at', cell: ({ row }) => formatDate(row.getValue('created_at')) },
        { header: 'ID Departemen', accessorKey: 'id_departemen' },
        { header: 'Nama Departemen', accessorKey: 'nama_departemen' },
        { header: 'Actions', id: 'actions', cell:({ row }) => {
        const id = row.getValue('id_departemen') as number;
        const buttons = [];

        buttons.push(h(Button, {
            variant: 'outline',
            size: 'sm',
            onClick: () => router.navigate({ to: '/departemen/$id', params: { id: String(id) } })
        }, () => [
            h(EyeIcon, { class: 'w-4 h-4 mr-1' }),
            'View'
        ]));

        if (hasPermission('MASTER_DEPARTEMEN_UPDATE')) {
            buttons.push(h(Button, {
                variant: 'ghost',
                size: 'sm',
                onClick: () => router.navigate({ to: '/departemen/edit/$id', params: { id: String(id) } })
            }, () => [
                h(PencilIcon, { class: 'w-4 h-4 mr-1' }),
                'Edit'
            ]));
        }

        if (hasPermission('MASTER_DEPARTEMEN_DELETE')) {
            buttons.push(h(DeleteButton, {
                onConfirm: async() => {
                    await deleteDepartemen(id);
                    await fetchData()
                },
                confirmMessage: 'Apakah Anda yakin ingin menghapus Departemen ini?'
            }));
        }

        return h('div', { class: 'flex gap-2 justify-center items-center' }, buttons);
        } }
    ],
    search: search,
    schema: departemenSchema,
})

// Dialog schema removed - using separate create/edit pages
// const DepartemenDialogSchema = computed<DialogSchemaType>(() => [
//     {
//         key: "nama_departemen",
//         label: "Nama Departemen",
//         type: "text",
//         placeholder: "Masukkan nama departemen",
//         rules: "required",
//         position: "full"
//     }
// ])

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
            <Button v-if="hasPermission('MASTER_DEPARTEMEN_CREATE')" @click="router.navigate({ to: '/departemen/create' })" variant="outline">
                <PlusIcon class="w-4 h-4 mr-2" />
                Tambah Departemen
            </Button>
        </template>
    </DataTable>
</template>
