<script setup lang="ts">
import { h, ref, watch, onMounted, computed } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon, FileTextIcon } from 'lucide-vue-next';

import {
    getMarkerPlans,
    type MarkerPlanListItem,
} from '@/api/marker-plan/marker-plan';
import { markerPlanSchema } from '@/pages/marker-plan/schema';

import DataTable from '@/components/DataTable.vue';
import { Button } from '@/components/ui/button';

import { useTable } from '@/composables/useTable';
import { formatDate } from '@/lib/formatter';
import { usePermission } from '@/composables/usePermission';

const router = useRouter();
const search = useSearch({ strict: false }) as any;
const { hasPermission } = usePermission();

// ─── Table State ───────────────────────────────────────
const data = ref<MarkerPlanListItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

// ─── Permission ────────────────────────────────────────
const canCreate = computed(() => hasPermission('MARKER_PLAN_CREATE'));

// ─── Fetch List ────────────────────────────────────────
const fetchData = async () => {
    isLoading.value = true;
    try {
        const page = search.value?.page ?? 1;
        const pageSize = search.value?.pageSize ?? 20;
        const filter = search.value?.filter ?? '';
        const sortBy = search.value?.sortBy;
        const sortDesc = search.value?.sortDesc ?? false;

        const response = await getMarkerPlans({ page, pageSize, search: filter, sortBy, sortDesc });
        data.value = response.results;
        totalCount.value = response.count;
    } catch (error) {
        console.error('Gagal fetch Marker Plans:', error);
    } finally {
        isLoading.value = false;
    }
};

// ─── Table Columns ─────────────────────────────────────
const { table, searchTerm, onSearch, clearFilter } = useTable({
    data: data,
    rowCount: totalCount,
    columns: [
        { header: 'Created At', accessorKey: 'created_at', cell: ({ row }) => formatDate(row.getValue('created_at')) },
        { header: 'No Dokumen', accessorKey: 'no_dokumen', cell: ({ row }) => h('span', { class: 'font-mono text-neutral-800 font-medium' }, row.getValue('no_dokumen')) },
        { header: 'Tanggal Efektif', accessorKey: 'tanggal_efektif', cell: ({ row }) => formatDate(row.getValue('tanggal_efektif')) },
        { header: 'Buyer', accessorKey: 'buyer' },
        { header: 'Model', accessorKey: 'model' },
        { header: 'Fabric', accessorKey: 'fabric' },
        { header: 'Color', accessorKey: 'color' },
        {
            header: 'Actions',
            id: 'actions',
            cell: ({ row }) => {
                const id = row.original.id_marker_plan;
                return h('div', { class: 'flex gap-2 justify-center items-center' }, [
                    h(Button, {
                        variant: 'outline',
                        size: 'sm',
                        class: 'shadow-xs border-neutral-300',
                        onClick: () => router.navigate({ to: '/marker-plan/$id', params: { id: String(id) } })
                    }, () => [
                        h(EyeIcon, { class: 'w-4 h-4 mr-1' }),
                        'View'
                    ])
                ]);
            }
        }
    ],
    search: search,
    schema: markerPlanSchema,
});

onMounted(() => {
    fetchData();
});
watch(() => search, () => { fetchData(); }, { deep: true });
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between border-b pb-5 border-neutral-100 gap-4">
            <div class="flex items-center gap-3">
                <div class="bg-neutral-50 border border-neutral-200/80 p-2.5 rounded-xl shadow-sm">
                    <FileTextIcon class="w-6 h-6 text-neutral-600" />
                </div>
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-neutral-900">Marker Plans</h1>
                    <p class="text-[13px] text-neutral-500 mt-1">Daftar rencana marker, rasio size, dan efisiensi pemotongan kain.</p>
                </div>
            </div>
            <div class="flex items-center gap-3" v-if="canCreate">
                <Button @click="router.navigate({ to: '/marker-plan/create' })" variant="outline" class="shadow-sm border-neutral-300">
                    <PlusIcon class="w-4 h-4 mr-2" />
                    Tambah Marker Plan
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
