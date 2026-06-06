<script setup lang="ts">
import { h, ref, watch, onMounted } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon, PencilIcon } from 'lucide-vue-next';

import { deleteWarna, getWarna } from '@/api/warna/warna';
import { type WarnaResponseItem } from '@/schemas/warna/response';
import { warnaSchema } from '@/pages/warna/schema';

import DataTable from '@/components/DataTable.vue';
import { Button } from '@/components/ui/button';

import { usePermission } from '@/composables/usePermission';
import { useTable } from '@/composables/useTable';

import { formatDate } from '@/lib/formatter';
import DeleteButton from '@/components/DeleteButton.vue';

const { hasPermission } = usePermission();
const search = useSearch({ strict: false }) as any;
const router = useRouter();

const data = ref<WarnaResponseItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

const fetchData = async () => {
    isLoading.value = true;
    try {
        const page = search.value?.page ?? 1;
        const pageSize = search.value?.pageSize ?? 20;
        const filter = search.value?.filter ?? '';

        const response = await getWarna({
            limit: pageSize,
            offset: (page - 1) * pageSize,
            search: filter
        });

        data.value = response.results;
        totalCount.value = response.count;
    } catch (error) {
        console.error("Gagal fetch data warna:", error);
    } finally {
        isLoading.value = false;
    }
}

const { table, searchTerm, onSearch, clearFilter } = useTable({
    data: data,
    rowCount: totalCount,
    columns: [
        { header: 'Created At', accessorKey: 'created_at', cell: ({ row }) => formatDate(row.getValue('created_at')) },
        { header: 'ID Warna', accessorKey: 'id_warna' },
        { header: 'Nama Warna', accessorKey: 'nama_warna' },
        { 
            header: 'Kode HEX', 
            accessorKey: 'kode_hex',
            cell: ({ row }) => {
                const hex = row.getValue('kode_hex') as string;
                if (!hex) return '-';
                return h('div', { class: 'flex items-center gap-2 font-mono' }, [
                    h('span', { 
                        class: 'w-4 h-4 rounded-full border border-slate-200 shadow-xs inline-block',
                        style: { backgroundColor: hex }
                    }),
                    hex
                ]);
            }
        },
        { header: 'Actions', id: 'actions', cell:({ row }) => {
        const id = row.getValue('id_warna') as number;
        const buttons = [];

        buttons.push(h(Button, { 
            variant: 'outline',
            size: 'sm',
            onClick: () => router.navigate({ to: '/warna/$id', params: { id: String(id) } }) 
        }, () => [
            h(EyeIcon, { class: 'w-4 h-4 mr-1' }),
            'View'
        ]));

        if (hasPermission('MASTER_WARNA_UPDATE')) {
            buttons.push(h(Button, { 
                variant: 'ghost',
                size: 'sm',
                onClick: () => router.navigate({ to: '/warna/edit/$id', params: { id: String(id) } })
            }, () => [
                h(PencilIcon, { class: 'w-4 h-4 mr-1' }),
                'Edit'
            ]));
        }

        if (hasPermission('MASTER_WARNA_DELETE')) {
            buttons.push(h(DeleteButton, {
                onConfirm: async() => {
                    await deleteWarna(id);
                    await fetchData();
                },
                confirmMessage: 'Apakah Anda yakin ingin menghapus Warna ini?'
            }));
        }

        return h('div', { class: 'flex gap-2 justify-center items-center' }, buttons);
        } }
    ],
    search: search,
    schema: warnaSchema,
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
            <Button v-if="hasPermission('MASTER_WARNA_CREATE')" @click="router.navigate({ to: '/warna/create' })" variant="outline">
                <PlusIcon class="w-4 h-4 mr-2" />
                Tambah Warna
            </Button>
        </template>
    </DataTable>
</template>
