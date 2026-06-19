<script setup lang="ts">
import { h, ref, watch, onMounted, computed } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon, CalendarDaysIcon } from 'lucide-vue-next';

import { getMasterPlans, type MasterPlanListItem } from '@/api/master-plan/master-plan';
import { masterPlanSchema } from '@/pages/master-plan/schema';

import DataTable from '@/components/DataTable.vue';
import { Button } from '@/components/ui/button';
import { useTable } from '@/composables/useTable';
import { formatDate } from '@/lib/formatter';
import { usePermission } from '@/composables/usePermission';

const router = useRouter();
const search = useSearch({ strict: false }) as any;
const { hasPermission } = usePermission();

const data = ref<MasterPlanListItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

const canCreate = computed(() => hasPermission('MASTER_PLAN_CREATE'));

const fetchData = async () => {
    isLoading.value = true;
    try {
        const page = search.value?.page ?? 1;
        const pageSize = search.value?.pageSize ?? 20;
        const filter = search.value?.filter ?? '';
        const response = await getMasterPlans({ page, limit: pageSize, search: filter });
        data.value = response.results;
        totalCount.value = response.count;
    } catch (error) {
        console.error('Gagal fetch Master Plans:', error);
    } finally {
        isLoading.value = false;
    }
};

const { table, searchTerm, onSearch, clearFilter } = useTable({
    data: data,
    rowCount: totalCount,
    columns: [
        {
            header: 'Departemen',
            accessorKey: 'nama_departemen',
        },
        {
            header: 'Line Produksi',
            accessorKey: 'nama_line',
            cell: ({ row }: any) => h('span', { class: 'font-medium' }, row.getValue('nama_line')),
        },
        {
            header: 'Nama Plan',
            accessorKey: 'nama',
            cell: ({ row }: any) => row.getValue('nama') || h('span', { class: 'text-neutral-400 italic' }, '(tidak ada nama)'),
        },
        {
            header: 'Dibuat',
            accessorKey: 'created_at',
            cell: ({ row }: any) => formatDate(row.getValue('created_at')),
        },
        {
            header: 'Aksi',
            id: 'actions',
            cell: ({ row }: any) => {
                const id = row.original.id_master_plan;
                return h('div', { class: 'flex gap-2 justify-center items-center' }, [
                    h(Button, {
                        variant: 'outline',
                        size: 'sm',
                        class: 'shadow-xs border-neutral-300',
                        onClick: () => router.navigate({ to: '/master-plan/$id', params: { id: String(id) } })
                    }, () => [h(EyeIcon, { class: 'w-4 h-4 mr-1' }), 'Lihat'])
                ]);
            }
        }
    ],
    search: search,
    schema: masterPlanSchema,
});

onMounted(() => fetchData());
watch(() => search, () => fetchData(), { deep: true });
</script>

<template>
    <div class="space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between border-b pb-5 border-neutral-100 gap-4">
            <div class="flex items-center gap-3">
                <div class="bg-neutral-50 border border-neutral-200/80 p-2.5 rounded-xl shadow-sm">
                    <CalendarDaysIcon class="w-6 h-6 text-neutral-600" />
                </div>
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-neutral-900">Master Plan</h1>
                    <p class="text-[13px] text-neutral-500 mt-1">Rencana produksi harian per departemen dan line produksi.</p>
                </div>
            </div>
            <div v-if="canCreate" class="flex items-center gap-3">
                <Button @click="router.navigate({ to: '/master-plan/create' })" variant="outline" class="shadow-sm border-neutral-300">
                    <PlusIcon class="w-4 h-4 mr-2" />
                    Buat Master Plan
                </Button>
            </div>
        </div>

        <DataTable
            :table="table"
            :is-loading="isLoading"
            v-model:search="searchTerm"
            @search="onSearch"
            @clear-filter="clearFilter"
        />
    </div>
</template>
