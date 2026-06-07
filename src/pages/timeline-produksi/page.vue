<script setup lang="ts">
import { h, ref, watch, onMounted } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon, CalendarIcon } from 'lucide-vue-next';

import { getTimelinePlans } from '@/api/timeline-produksi/timeline-produksi';
import { timelineProduksiSchema } from '@/pages/timeline-produksi/schema';

import DataTable from '@/components/DataTable.vue';
import { Button } from '@/components/ui/button';

import { usePermission } from '@/composables/usePermission';
import { useTable } from '@/composables/useTable';
import { formatDate } from '@/lib/formatter';

const { hasPermission } = usePermission();
const search = useSearch({ strict: false }) as any;
const router = useRouter();

const data = ref<any[]>([]);
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

        const response = await getTimelinePlans({
            page,
            pageSize,
            search: filter,
            sortBy,
            sortDesc
        });

        data.value = response.results;
        totalCount.value = response.count;
    } catch (error) {
        console.error("Gagal fetch data timeline produksi:", error);
    } finally {
        isLoading.value = false;
    }
}

const { table, searchTerm, onSearch, clearFilter } = useTable({
    data: data,
    rowCount: totalCount,
    columns: [
        { header: 'Created At', accessorKey: 'created_at', cell: ({ row }) => formatDate(row.getValue('created_at')) },
        { header: 'ID Timeline', accessorKey: 'id_timeline', cell: ({ row }) => h('span', { class: 'font-mono text-neutral-800 font-medium' }, `#${row.getValue('id_timeline')}`) },
        { header: 'Mitra', accessorKey: 'client_name' },
        { header: 'PO Number', accessorKey: 'po_number', cell: ({ row }) => h('span', { class: 'font-mono text-neutral-700' }, row.getValue('po_number')) },
        { header: 'Tanggal Disusun', accessorKey: 'tanggal_disusun', cell: ({ row }) => formatDate(row.getValue('tanggal_disusun')) },
        { header: 'Notes', accessorKey: 'notes' },
        { header: 'Actions', id: 'actions', cell:({ row }) => {
            const id = row.original.id_timeline;
            return h('div', { class: 'flex gap-2 justify-center items-center' }, [
                h(Button, {
                    variant: 'outline',
                    size: 'sm',
                    class: 'shadow-xs border-neutral-300',
                    onClick: () => router.navigate({ to: '/timeline-produksi/$id', params: { id: String(id) } })
                }, () => [
                    h(EyeIcon, { class: 'w-4 h-4 mr-1' }),
                    'View'
                ])
            ]);
        } }
    ],
    search: search,
    schema: timelineProduksiSchema,
})

onMounted(() => {
    fetchData();
})

watch(() => search, () => {
    fetchData();
}, { deep: true })
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between border-b pb-5 border-neutral-100 gap-4">
            <div class="flex items-center gap-3">
                <div class="bg-neutral-50 border border-neutral-200/80 p-2.5 rounded-xl shadow-sm">
                    <CalendarIcon class="w-6 h-6 text-neutral-600" />
                </div>
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-neutral-900">Timeline Produksi</h1>
                    <p class="text-[13px] text-neutral-500 mt-1">Daftar rencana dan pemantauan status pengerjaan komponen (Cutting, Embro, Sewing, dll).</p>
                </div>
            </div>
            <div class="flex items-center gap-3" v-if="hasPermission('TIMELINE_PRODUKSI_CREATE')">
                <Button @click="router.navigate({ to: '/timeline-produksi/create' })" variant="outline" class="shadow-sm border-neutral-300">
                    <PlusIcon class="w-4 h-4 mr-2" />
                    Tambah Timeline Produksi
                </Button>
            </div>
        </div>

        <!-- DataTable -->
        <DataTable
            :table="table"
            :is-loading="isLoading"
            v-model:search="searchTerm"
            @search="onSearch"
            @clear-filter="clearFilter"
        />
    </div>
</template>
