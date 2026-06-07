<script setup lang="ts">
import { h, ref, watch, onMounted } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { EyeIcon, DownloadIcon, FileTextIcon } from 'lucide-vue-next';

import { getWorkOrderReturns, type ReturClientListItem } from '@/api/work-orders/work-orders';
import { returClientSchema } from '@/pages/ajuan-pengembalian/schema';

import DataTable from '@/components/DataTable.vue';
import { Button } from '@/components/ui/button';
import { useTable } from '@/composables/useTable';
import { formatDate } from '@/lib/formatter';
import { apiClient } from '@/lib/apiClient';

const search = useSearch({ strict: false }) as any;
const router = useRouter();

const data = ref<ReturClientListItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

const fetchData = async () => {
    isLoading.value = true;
    try {
        const page = search.value?.page ?? 1;
        const pageSize = search.value?.pageSize ?? 20;
        const filter = search.value?.filter ?? '';

        const response = await getWorkOrderReturns({
            page,
            pageSize,
            search: filter
        });

        data.value = response.results;
        totalCount.value = response.count;
    } catch (error) {
        console.error("Gagal fetch Return Requests:", error);
    } finally {
        isLoading.value = false;
    }
};

const downloadFile = (file: string) => {
    if (!file) return;
    const baseUrl = apiClient.defaults.baseURL || 'http://localhost:8080';
    const fileUrl = `${baseUrl}/${file}`;
    window.open(fileUrl, '_blank');
};

const { table, searchTerm, onSearch, clearFilter } = useTable({
    data: data,
    rowCount: totalCount,
    columns: [
        { 
            header: 'Tanggal Pengajuan', 
            accessorKey: 'created_at', 
            cell: ({ row }) => formatDate(row.getValue('created_at')) 
        },
        { 
            header: 'Client / Mitra', 
            accessorKey: 'mitra_name' 
        },
        { 
            header: 'No. PO', 
            accessorKey: 'po_number',
            cell: ({ row }) => {
                const poNumber = row.getValue('po_number') as string;
                const idPoClient = row.original.id_po_client;
                return h('span', { 
                    class: 'font-mono text-neutral-900 font-bold hover:underline cursor-pointer',
                    onClick: () => router.navigate({ to: '/po-client/$id', params: { id: String(idPoClient) } })
                }, poNumber);
            }
        },
        { 
            header: 'Buyer', 
            accessorKey: 'buyer' 
        },
        { 
            header: 'Model', 
            accessorKey: 'model' 
        },
        { 
            header: 'Qty WO', 
            accessorKey: 'wo_qty',
            cell: ({ row }) => `${row.getValue('wo_qty')} pcs`
        },
        { 
            header: 'Alasan Retur', 
            accessorKey: 'deskripsi',
            cell: ({ row }) => h('span', { class: 'text-neutral-600 italic line-clamp-2' }, row.getValue('deskripsi') || '-')
        },
        { 
            header: 'Surat Jalan / Berkas', 
            accessorKey: 'file',
            cell: ({ row }) => {
                const file = row.getValue('file') as string;
                if (!file) return h('span', { class: 'text-neutral-400' }, 'Tidak ada berkas');
                
                // Get extension or display clean filename
                const parts = file.split('/');
                const fileName = parts[parts.length - 1];

                return h(Button, {
                    variant: 'link',
                    size: 'sm',
                    class: 'text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1.5 p-0 h-auto',
                    onClick: () => downloadFile(file)
                }, () => [
                    h(DownloadIcon, { class: 'w-3.5 h-3.5' }),
                    h('span', { class: 'truncate max-w-[150px]' }, fileName)
                ]);
            }
        },
        { 
            header: 'Aksi', 
            id: 'actions', 
            cell: ({ row }) => {
                const idPoClient = row.original.id_po_client;
                return h('div', { class: 'flex gap-2 justify-center items-center' }, [
                    h(Button, { 
                        variant: 'outline',
                        size: 'sm',
                        class: 'shadow-xs border-neutral-300',
                        onClick: () => router.navigate({ to: '/po-client/$id', params: { id: String(idPoClient) } }) 
                    }, () => [
                        h(EyeIcon, { class: 'w-4 h-4 mr-1' }),
                        'Detail PO'
                    ])
                ]);
            } 
        }
    ],
    search: search,
    schema: returClientSchema,
});

onMounted(() => {
    fetchData();
});

watch(() => search, () => {
    fetchData();
}, { deep: true });
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between border-b pb-5 border-neutral-100 gap-4">
            <div class="flex items-center gap-3">
                <div class="bg-orange-50 border border-orange-200/80 p-2.5 rounded-xl shadow-sm">
                    <FileTextIcon class="w-6 h-6 text-orange-600" />
                </div>
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-neutral-900">Ajuan Pengembalian (Retur)</h1>
                    <p class="text-[13px] text-neutral-500 mt-1">Kelola dan tinjau berkas pengajuan retur barang yang diajukan oleh mitra/client.</p>
                </div>
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
