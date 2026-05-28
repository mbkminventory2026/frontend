<script setup lang="ts">
import { h, ref, watch, onMounted, computed } from 'vue';
import { useSearch } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon, CheckCircleIcon, FileTextIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { 
    getWorkOrders, 
    createWorkOrder, 
    closeWorkOrder, 
    getWorkOrderById, 
    type WorkOrderListItem, 
    type WorkOrderDetailResponse 
} from '@/api/work-orders/work-orders';
import { getPOClients, getPOClientById } from '@/api/po-clients/po-clients';
import { workOrderSchema } from '@/routes/_authenticated/work-order.index';

import DataTable from '@/components/DataTable.vue';
import AppDialog from '@/components/AppDialog.vue';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useTable } from '@/composables/useTable';
import { useDialog } from '@/composables/useDialog';
import { type DialogSchemaType } from '@/schemas/dialog/dialog';
import { formatDate } from '@/lib/formatter';
import { useAuthStore } from '@/store/authStore';

const search = useSearch({ strict: false }) as any;
const authStore = useAuthStore();

const data = ref<WorkOrderListItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

const poClientItemOptions = ref<{ label: string; value: number }[]>([]);
const isLoadingPOItems = ref(false);

// State for View Detail Popup
const selectedWO = ref<WorkOrderDetailResponse | null>(null);
const isDetailOpen = ref(false);
const isLoadingDetail = ref(false);
const activeTab = ref<'info' | 'shells' | 'trims' | 'materials'>('info');

const canCreateOrClose = computed(() => {
    const role = authStore.user?.role?.toLowerCase() || '';
    const isSuperAdmin = role === 'super-admin' || role === 'super_admin' || role === 'admin';
    return isSuperAdmin || authStore.permissions.includes('WO_CREATE') || authStore.isManager;
});

const fetchPOClientItems = async () => {
    isLoadingPOItems.value = true;
    try {
        const poRes = await getPOClients({ limit: 100, offset: 0 });
        const poList = poRes.results || [];
        
        // Fetch details for all PO clients to get their items
        const details = await Promise.all(
            poList.map(po => getPOClientById(po.id_po_client).catch(() => null))
        );
        
        const options: { label: string; value: number }[] = [];
        details.forEach(detail => {
            if (detail && detail.items) {
                detail.items.forEach((item: any) => {
                    options.push({
                        label: `${item.style} - ${item.colour} (PO: ${detail.po_number})`,
                        value: item.id_po_client_item
                    });
                });
            }
        });
        
        poClientItemOptions.value = options;
    } catch (error) {
        console.error("Gagal fetch PO Client Items:", error);
    } finally {
        isLoadingPOItems.value = false;
    }
};

const fetchData = async () => {
    isLoading.value = true;
    try {
        const page = search.value?.page ?? 1;
        const pageSize = search.value?.pageSize ?? 20;
        const filter = search.value?.filter ?? '';

        const response = await getWorkOrders({
            limit: pageSize,
            offset: (page - 1) * pageSize,
            search: filter
        });

        data.value = response.results;
        totalCount.value = response.count;
    } catch (error) {
        console.error("Gagal fetch Work Orders:", error);
    } finally {
        isLoading.value = false;
    }
};

const handleViewDetail = async (id: number) => {
    isLoadingDetail.value = true;
    activeTab.value = 'info';
    try {
        selectedWO.value = await getWorkOrderById(id);
        isDetailOpen.value = true;
    } catch (error) {
        console.error("Gagal memuat detail Work Order:", error);
        toast.error("Gagal memuat detail Work Order");
    } finally {
        isLoadingDetail.value = false;
    }
};

const handleCloseWO = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menyelesaikan/menutup Work Order ini? Status penutupan tidak dapat diubah.")) {
        return;
    }
    try {
        await closeWorkOrder(id);
        toast.success("Work Order berhasil diselesaikan/ditutup");
        await fetchData();
    } catch (error: any) {
        console.error("Gagal menutup Work Order:", error);
        toast.error(error.response?.data?.message || "Gagal menutup Work Order");
    }
};

const createDialog = useDialog({
    onSubmit: async (values, isEdit) => {
        if (isEdit) {
            throw new Error("Pembaruan langsung Work Order tidak didukung.");
        } else {
            // Build request with default shells and trims required by backend usecase
            const payload = {
                buyer: values.buyer,
                model: values.model,
                qty: Number(values.qty),
                fob_cmt: values.fob_cmt === 'true' || values.fob_cmt === true,
                delivery: values.delivery,
                id_po_client_item: Number(values.id_po_client_item),
                shells: [
                    {
                        fabric: "Kain Utama",
                        cons: 1.0,
                        color: "Sesuai PO",
                        allow: 0,
                        berat_1_yd: 1.0,
                        sizes: [
                            {
                                size: "ALL",
                                qty: Number(values.qty),
                                ratio: 1
                            }
                        ]
                    }
                ],
                trims: [
                    {
                        item: "Aksesoris",
                        description: "Auto-generated accessories from PO",
                        color: "Sesuai PO",
                        code: "TRM-GEN",
                        cons: 1.0,
                        qty: Number(values.qty),
                        uom: "PCS",
                        allow: 0
                    }
                ]
            };
            return await createWorkOrder(payload);
        }
    },
    onSuccess: () => fetchData() 
});

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
                const isClosed = status === 'closed';
                return h('span', {
                    class: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${isClosed ? 'bg-neutral-100 text-neutral-800' : 'bg-emerald-100 text-emerald-800'}`
                }, isClosed ? 'Closed' : 'Open');
            }
        },
        { 
            header: 'Actions', 
            id: 'actions', 
            cell: ({ row }) => {
                const id = row.getValue('id_wo') as number;
                const status = (row.getValue('status') as string || '').toLowerCase();
                const isOpen = status === 'open';

                return h('div', { class: 'flex gap-2 justify-center items-center' }, [
                    h(Button, { 
                        variant: 'outline',
                        size: 'sm',
                        class: 'shadow-xs border-neutral-300',
                        onClick: () => handleViewDetail(id) 
                    }, () => [
                        h(EyeIcon, { class: 'w-4 h-4 mr-1' }),
                        'View'
                    ]),
                    ...(canCreateOrClose.value && isOpen ? [
                        h(Button, { 
                            variant: 'ghost',
                            size: 'sm',
                            class: 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50',
                            onClick: () => handleCloseWO(id) 
                        }, () => [
                            h(CheckCircleIcon, { class: 'w-4 h-4 mr-1' }),
                            'Selesaikan'
                        ])
                    ] : [])
                ]);
            }
        }
    ],
    search: search,
    schema: workOrderSchema,
});

const WorkOrderDialogSchema = computed<DialogSchemaType>(() => [
    {
        key: "id_po_client_item",
        label: "Item PO Client *",
        type: "select",
        placeholder: "Pilih item pemesanan",
        rules: "required",
        position: "full",
        options: poClientItemOptions.value
    },
    {
        key: "buyer",
        label: "Buyer *",
        type: "text",
        placeholder: "Contoh: ADIDAS",
        rules: "required",
        position: "left"
    },
    {
        key: "model",
        label: "Model *",
        type: "text",
        placeholder: "Contoh: Running Jacket V2",
        rules: "required",
        position: "right"
    },
    {
        key: "qty",
        label: "Kuantitas Produksi (Qty) *",
        type: "number",
        placeholder: "Masukkan kuantitas",
        rules: "required",
        position: "left"
    },
    {
        key: "delivery",
        label: "Tanggal Pengiriman (Delivery) *",
        type: "date",
        placeholder: "Pilih tanggal",
        rules: "required",
        position: "right"
    },
    {
        key: "fob_cmt",
        label: "Jenis Maklon (FOB / CMT) *",
        type: "select",
        placeholder: "Pilih jenis maklon",
        rules: "required",
        position: "full",
        options: [
            { label: "FOB (Free On Board)", value: "true" },
            { label: "CMT (Cut, Make, Trim)", value: "false" }
        ]
    }
]);

onMounted(() => {
    fetchData();
    fetchPOClientItems();
});

watch(() => search, () => {
    fetchData();
}, { deep: true });
</script>

<template>
    <div class="space-y-6">
        <!-- Header Info -->
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
            
            <div class="flex items-center gap-3" v-if="canCreateOrClose">
                <Button @click="createDialog.openDialog()" variant="outline" class="shadow-sm border-neutral-300">
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

        <!-- AppDialog for Creating Work Order -->
        <AppDialog
            title="Tambah Work Order"
            description="Masukkan informasi Work Order baru untuk memulai jadwal instruksi produksi."
            :schema="WorkOrderDialogSchema"
            :is-open="createDialog.isOpen.value"
            :initial-values="createDialog.initialValues.value"
            :submit-label="createDialog.isLoading.value ? 'Mengirim...' : 'Buat'"
            @update:is-open="createDialog.isOpen.value = $event"
            @submit="createDialog.handleSubmit"
        />

        <!-- Custom Read-only Detail Dialog -->
        <Dialog :open="isDetailOpen" @update:open="isDetailOpen = $event">
            <DialogContent class="sm:max-w-[760px] max-h-[85vh] overflow-y-auto flex flex-col p-0 bg-white border border-neutral-200 shadow-xl rounded-xl">
                <DialogHeader class="p-6 pb-0">
                    <DialogTitle class="text-xl font-bold text-neutral-900 flex items-center gap-2">
                        <FileTextIcon class="w-5 h-5 text-neutral-500" />
                        Detail Work Order #{{ selectedWO?.id_wo }}
                    </DialogTitle>
                    <DialogDescription class="text-neutral-500 text-xs">
                        Rincian spesifikasi, shell kain, trim aksesoris, dan material untuk Work Order.
                    </DialogDescription>
                </DialogHeader>

                <div class="flex-1 p-6 space-y-6" v-if="selectedWO">
                    <!-- Custom Tab Headers -->
                    <div class="flex border-b border-neutral-100 pb-1 gap-2">
                        <button 
                            v-for="tab in [
                                { id: 'info', label: 'Informasi Utama' },
                                { id: 'shells', label: `Shells (${selectedWO.shells?.length || 0})` },
                                { id: 'trims', label: `Trims (${selectedWO.trims?.length || 0})` },
                                { id: 'materials', label: `Material List (${selectedWO.material_lists?.length || 0})` }
                            ]" 
                            :key="tab.id"
                            type="button"
                            @click="activeTab = tab.id as any"
                            :class="[
                                'px-4 py-2 text-xs font-semibold transition-all border-b-2 rounded-t-lg -mb-[5px]',
                                activeTab === tab.id 
                                    ? 'border-neutral-900 text-neutral-950 bg-neutral-50/50' 
                                    : 'border-transparent text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50/20'
                            ]"
                        >
                            {{ tab.label }}
                        </button>
                    </div>

                    <!-- Tab Content: Info -->
                    <div v-if="activeTab === 'info'" class="space-y-4">
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-6 bg-neutral-50 p-5 rounded-xl border border-neutral-200/50">
                            <div>
                                <span class="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Buyer</span>
                                <span class="font-semibold text-neutral-800 text-sm mt-0.5 block">{{ selectedWO.buyer }}</span>
                            </div>
                            <div>
                                <span class="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Model / Style</span>
                                <span class="font-semibold text-neutral-800 text-sm mt-0.5 block">{{ selectedWO.model }}</span>
                            </div>
                            <div>
                                <span class="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Kuantitas (Qty)</span>
                                <span class="font-mono font-bold text-neutral-950 text-sm mt-0.5 block">{{ selectedWO.qty }} PCS</span>
                            </div>
                            <div>
                                <span class="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Jenis Maklon</span>
                                <span class="mt-1 block">
                                    <span :class="`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${selectedWO.fob_cmt ? 'bg-indigo-100 text-indigo-800' : 'bg-orange-100 text-orange-800'}`">
                                        {{ selectedWO.fob_cmt ? 'FOB' : 'CMT' }}
                                    </span>
                                </span>
                            </div>
                            <div>
                                <span class="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Delivery Date</span>
                                <span class="font-semibold text-neutral-800 text-sm mt-0.5 block">{{ formatDate(selectedWO.delivery) }}</span>
                            </div>
                            <div>
                                <span class="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Status WO</span>
                                <span class="mt-1 block">
                                    <span :class="`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${selectedWO.status.toLowerCase() === 'closed' ? 'bg-neutral-200 text-neutral-800' : 'bg-emerald-100 text-emerald-800'}`">
                                        {{ selectedWO.status }}
                                    </span>
                                </span>
                            </div>
                            <div class="col-span-full border-t border-neutral-200 pt-4 mt-2 grid grid-cols-2 gap-4">
                                <div>
                                    <span class="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">PO Number</span>
                                    <span class="font-mono font-semibold text-neutral-800 text-xs mt-0.5 block">{{ selectedWO.po_number }}</span>
                                </div>
                                <div>
                                    <span class="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">PO Client Item Style</span>
                                    <span class="font-semibold text-neutral-800 text-xs mt-0.5 block">{{ selectedWO.po_client_item_style }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Tab Content: Shells -->
                    <div v-if="activeTab === 'shells'" class="space-y-4">
                        <div v-if="!selectedWO.shells || selectedWO.shells.length === 0" class="text-center py-8 text-neutral-400 text-sm">
                            Tidak ada data shell kain.
                        </div>
                        <div v-else class="space-y-6">
                            <div v-for="shell in selectedWO.shells" :key="shell.id_wo_shell" class="border border-neutral-200 rounded-xl bg-white p-4 space-y-4">
                                <div class="grid grid-cols-2 md:grid-cols-5 gap-4 border-b border-neutral-100 pb-3">
                                    <div>
                                        <span class="text-[10px] font-bold text-neutral-400 uppercase block">Fabric</span>
                                        <span class="font-medium text-neutral-800 text-xs mt-0.5 block">{{ shell.fabric }}</span>
                                    </div>
                                    <div>
                                        <span class="text-[10px] font-bold text-neutral-400 uppercase block">Color</span>
                                        <span class="font-medium text-neutral-800 text-xs mt-0.5 block">{{ shell.color }}</span>
                                    </div>
                                    <div>
                                        <span class="text-[10px] font-bold text-neutral-400 uppercase block">Consumption (Cons)</span>
                                        <span class="font-mono text-neutral-800 text-xs mt-0.5 block">{{ shell.cons }} YD</span>
                                    </div>
                                    <div>
                                        <span class="text-[10px] font-bold text-neutral-400 uppercase block">Allowance</span>
                                        <span class="font-mono text-neutral-800 text-xs mt-0.5 block">{{ shell.allow }}%</span>
                                    </div>
                                    <div>
                                        <span class="text-[10px] font-bold text-neutral-400 uppercase block">Berat (1 Yd)</span>
                                        <span class="font-mono text-neutral-800 text-xs mt-0.5 block">{{ shell.berat_1_yd }} Kg</span>
                                    </div>
                                </div>

                                <div class="space-y-2">
                                    <h4 class="text-xs font-bold text-neutral-700 uppercase tracking-wide">Jadwal Ukuran & Rasio (Sizes)</h4>
                                    <div class="overflow-x-auto border rounded-lg bg-neutral-50/50">
                                        <table class="w-full text-left border-collapse text-xs">
                                            <thead>
                                                <tr class="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200 text-[10px] uppercase">
                                                    <th class="p-2.5">Size</th>
                                                    <th class="p-2.5 text-center">Quantity</th>
                                                    <th class="p-2.5 text-center">Ratio</th>
                                                </tr>
                                            </thead>
                                            <tbody class="divide-y divide-neutral-100">
                                                <tr v-for="size in shell.sizes" :key="size.id_wo_shell_size" class="text-neutral-750">
                                                    <td class="p-2.5 font-medium">{{ size.size }}</td>
                                                    <td class="p-2.5 text-center font-mono font-medium">{{ size.qty }}</td>
                                                    <td class="p-2.5 text-center font-mono">{{ size.ratio }}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Tab Content: Trims -->
                    <div v-if="activeTab === 'trims'" class="space-y-4">
                        <div v-if="!selectedWO.trims || selectedWO.trims.length === 0" class="text-center py-8 text-neutral-400 text-sm">
                            Tidak ada data trim aksesoris.
                        </div>
                        <div v-else class="overflow-x-auto border border-neutral-200 rounded-xl bg-white">
                            <table class="w-full text-left border-collapse text-xs">
                                <thead class="bg-neutral-50 text-neutral-600 font-bold border-b border-neutral-200 text-[10px] uppercase">
                                    <tr>
                                        <th class="p-3">Item</th>
                                        <th class="p-3">Code</th>
                                        <th class="p-3">Color</th>
                                        <th class="p-3 text-center">Cons</th>
                                        <th class="p-3 text-center">Qty</th>
                                        <th class="p-3">UOM</th>
                                        <th class="p-3">Position</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-neutral-100 text-neutral-700">
                                    <tr v-for="trim in selectedWO.trims" :key="trim.id_wo_trim" class="hover:bg-neutral-50/40">
                                        <td class="p-3 font-semibold">{{ trim.item }}</td>
                                        <td class="p-3 font-mono">{{ trim.code }}</td>
                                        <td class="p-3">{{ trim.color }}</td>
                                        <td class="p-3 text-center font-mono">{{ trim.cons }}</td>
                                        <td class="p-3 text-center font-mono font-medium">{{ trim.qty }}</td>
                                        <td class="p-3">{{ trim.uom }}</td>
                                        <td class="p-3">{{ trim.position || '-' }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Tab Content: Materials -->
                    <div v-if="activeTab === 'materials'" class="space-y-4">
                        <div v-if="!selectedWO.material_lists || selectedWO.material_lists.length === 0" class="text-center py-8 text-neutral-400 text-sm">
                            Tidak ada data material list.
                        </div>
                        <div v-else class="overflow-x-auto border border-neutral-200 rounded-xl bg-white">
                            <table class="w-full text-left border-collapse text-xs">
                                <thead class="bg-neutral-50 text-neutral-600 font-bold border-b border-neutral-200 text-[10px] uppercase">
                                    <tr>
                                        <th class="p-3">Description</th>
                                        <th class="p-3">Size</th>
                                        <th class="p-3">Color</th>
                                        <th class="p-3">UOM</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-neutral-100 text-neutral-700">
                                    <tr v-for="mat in selectedWO.material_lists" :key="mat.id_material_list" class="hover:bg-neutral-50/40">
                                        <td class="p-3 font-medium">{{ mat.description }}</td>
                                        <td class="p-3">{{ mat.size }}</td>
                                        <td class="p-3">{{ mat.color }}</td>
                                        <td class="p-3">{{ mat.uom }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="border-t border-neutral-200 p-4 bg-neutral-50/80 flex justify-end">
                    <Button type="button" @click="isDetailOpen = false" class="bg-neutral-900 text-white hover:bg-neutral-800">
                        Tutup
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    </div>
</template>
