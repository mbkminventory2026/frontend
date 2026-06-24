<script setup lang="ts">
import { h, ref, watch, onMounted, computed } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon, CheckCircleIcon, FileTextIcon, DownloadIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import {
    getWorkOrders,
    closeWorkOrder,
    downloadWorkOrderExcel,
    type WorkOrderListItem,
} from '@/api/work-orders/work-orders';
import { workOrderSchema } from '@/pages/work-order/schema';

import DataTable from '@/components/DataTable.vue';
import { Button } from '@/components/ui/button';

import { useTable } from '@/composables/useTable';
import { formatDate } from '@/lib/formatter';
import { usePermission } from '@/composables/usePermission';
import { useAuthStore } from '@/store/authStore';

const router = useRouter();
const search = useSearch({ strict: false }) as any;
const { hasPermission } = usePermission();
const authStore = useAuthStore();

// ─── Table State ───────────────────────────────────────
const data = ref<WorkOrderListItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

// ─── Permission ────────────────────────────────────────
const canCreate = computed(() => hasPermission('WO_CREATE'));
const canClose = computed(() => hasPermission('WO_CLOSE'));

// ─── Fetch WO List ─────────────────────────────────────
const fetchData = async () => {
    isLoading.value = true;
    try {
        const page = search.value?.page ?? 1;
        const pageSize = search.value?.pageSize ?? 20;
        const filter = search.value?.filter ?? '';
        const sortBy = search.value?.sortBy;
        const sortDesc = search.value?.sortDesc ?? false;

        const response = await getWorkOrders({ page, pageSize, search: filter, sortBy, sortDesc });
        data.value = response.results;
        totalCount.value = response.count;
    } catch (error) {
        console.error('Gagal fetch Work Orders:', error);
    } finally {
        isLoading.value = false;
    }
};
// ─── Close WO ──────────────────────────────────────────
const handleCloseWO = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menyelesaikan/menutup Work Order ini? Status penutupan tidak dapat diubah.')) return;
    try {
        await closeWorkOrder(id);
        toast.success('Work Order berhasil diselesaikan/ditutup');
        await fetchData();
    } catch (error: any) {
        toast.error(error.response?.data?.message || 'Gagal menutup Work Order.');
    }
};

// ─── Export Excel ──────────────────────────────────────
const isExportingMap = ref<Record<number, boolean>>({});
const handleExportExcel = async (id: number) => {
    isExportingMap.value[id] = true;
    try {
        const result = await downloadWorkOrderExcel(id);
        const objectUrl = window.URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = result.fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(objectUrl);
        toast.success('Export Excel Work Order berhasil diunduh.');
    } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Gagal mengunduh export Excel Work Order.');
    } finally {
        isExportingMap.value[id] = false;
    }
};

// ─── Table Columns ─────────────────────────────────────
const { table, searchTerm, onSearch, clearFilter } = useTable({
    data: data,
    rowCount: totalCount,
    columns: [
        { header: 'Created At', accessorKey: 'created_at', cell: ({ row }) => formatDate(row.getValue('created_at')) },
        { header: 'ID WO', accessorKey: 'id_wo' },
        { header: 'Buyer', accessorKey: 'buyer' },
        { header: 'Model', accessorKey: 'model' },
        { header: 'Qty', accessorKey: 'qty' },
        {
            header: 'FOB / CMT',
            accessorKey: 'fob_cmt',
            cell: ({ row }) => {
                const fobCmt = row.getValue('fob_cmt');
                return h('span', {
                    class: `inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${fobCmt ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-700/10' : 'bg-orange-50 text-orange-700 ring-1 ring-orange-700/10'}`
                }, fobCmt ? 'FOB' : 'CMT');
            }
        },
        { header: 'Delivery', accessorKey: 'delivery', cell: ({ row }) => formatDate(row.getValue('delivery')) },
        {
            header: 'PO Number',
            accessorKey: 'po_number',
            cell: ({ row }) => h('span', { class: 'font-mono text-neutral-800 font-medium' }, row.getValue('po_number'))
        },
        { header: 'PO Item Style', accessorKey: 'po_client_item_style' },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: ({ row }) => {
                const status = (row.getValue('status') as string || '').toLowerCase();
                const hasRetur = row.original.has_retur;
                const role = (authStore.roleName || '').toUpperCase();
                const isCompanyStaff = role === 'SUPER_ADMIN' || role === 'ADMIN_PRODUKSI';

                let badgeClass = 'bg-neutral-100 text-neutral-800 border border-neutral-200';
                let label = status.toUpperCase();

                if (isCompanyStaff && hasRetur) {
                    badgeClass = 'bg-red-100 text-red-800 border border-red-200';
                    label = 'DIKEMBALIKAN';
                } else if (status === 'closed') {
                    badgeClass = 'bg-neutral-100 text-neutral-800 border border-neutral-200';
                    label = 'Closed';
                } else if (status === 'client_closed') {
                    badgeClass = 'bg-amber-100 text-amber-800 border border-amber-200';
                    label = 'Closed by Client';
                } else if (status === 'open') {
                    badgeClass = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
                    label = 'Open';
                } else if (status === 'pending') {
                    badgeClass = 'bg-blue-100 text-blue-800 border border-blue-200';
                    label = 'Pending';
                }

                const statusBadge = h('span', {
                    class: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`
                }, label);

                if (hasRetur) {
                    if (isCompanyStaff) {
                        const fileLink = row.original.retur_file ? h('a', {
                            href: 'http://localhost:8080/' + row.original.retur_file,
                            target: '_blank',
                            class: 'inline-flex items-center gap-1 text-[10px] font-bold text-red-700 hover:text-red-800 hover:underline cursor-pointer bg-red-50 border border-red-200 rounded px-1.5 py-0.5 ml-2 transition-colors duration-150',
                            onClick: (e: Event) => e.stopPropagation()
                        }, 'Lihat File Bukti') : null;
                        
                        return h('div', { class: 'flex items-center gap-1' }, [statusBadge, fileLink]);
                    } else {
                        const returBadge = h('span', {
                            class: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200 cursor-pointer hover:bg-orange-200 ml-2 transition-colors duration-150',
                            onClick: (e: Event) => {
                                e.stopPropagation();
                                router.navigate({ to: '/po-client/$id', params: { id: String(row.original.id_po_client) } });
                            }
                        }, 'Retur');
                        return h('div', { class: 'flex items-center gap-1' }, [statusBadge, returBadge]);
                    }
                }

                return statusBadge;
            }
        },
        {
            header: 'Actions',
            id: 'actions',
            cell: ({ row }) => {
                const id = row.getValue('id_wo') as number;
                const status = (row.getValue('status') as string || '').toLowerCase();
                const isClientClosed = status === 'client_closed';

                return h('div', { class: 'flex gap-2 justify-center items-center' }, [
                    h(Button, {
                        variant: 'outline',
                        size: 'sm',
                        class: 'shadow-xs border-neutral-300',
                        onClick: () => router.navigate({ to: '/work-order/$id', params: { id: String(id) } })
                    }, () => [
                        h(EyeIcon, { class: 'w-4 h-4 mr-1' }),
                        'View'
                    ]),
                    h(Button, {
                        variant: 'outline',
                        size: 'sm',
                        class: 'shadow-xs border-neutral-300 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/50',
                        disabled: isExportingMap.value[id] || false,
                        onClick: () => handleExportExcel(id)
                    }, () => [
                        h(DownloadIcon, { class: 'w-4 h-4 mr-1' }),
                        isExportingMap.value[id] ? 'Exporting...' : 'Export'
                    ]),
                    ...(canClose.value && isClientClosed ? [
                        h(Button, {
                            variant: 'ghost',
                            size: 'sm',
                            class: 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50',
                            onClick: () => handleCloseWO(id)
                        }, () => [
                            h(CheckCircleIcon, { class: 'w-4 h-4 mr-1' }),
                            'Tandai Selesai'
                        ])
                    ] : [])
                ]);
            }
        }
    ],
    search: search,
    schema: workOrderSchema,
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
                    <h1 class="text-2xl font-bold tracking-tight text-neutral-900">Work Orders</h1>
                    <p class="text-[13px] text-neutral-500 mt-1">Daftar perintah kerja produksi dan relasi detail pesanan produksi.</p>
                </div>
            </div>
            <div class="flex items-center gap-3" v-if="canCreate">
                <Button @click="router.navigate({ to: '/work-order/create' })" variant="outline" class="shadow-sm border-neutral-300">
                    <PlusIcon class="w-4 h-4 mr-2" />
                    Tambah Work Order
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
