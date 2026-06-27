<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useParams, useRouter, useSearch, useNavigate } from '@tanstack/vue-router';
import {
    ArrowLeftIcon,
    FileTextIcon,
    DownloadIcon,
    Layers2Icon,
    ScissorsIcon,
    ClipboardListIcon,
    CheckCircleIcon,
    CalendarIcon,
    HashIcon,
    UndoIcon,
    ArrowUpRightIcon,
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import {
    getWorkOrderById,
    closeWorkOrder,
    clientCloseWorkOrder,
    downloadWorkOrderExcel,
    submitWorkOrderReturn,
    type WorkOrderDetailResponse,
} from '@/api/work-orders/work-orders';
import { createMaterialListItem, type CreateMaterialListItemPayload } from '@/api/material-list/material-list';
import { getProductionSummary, createFactoryReport } from '@/api/production/production';
import type { ProductionAggregateResponse } from '@/schemas/production/production';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { formatDate } from '@/lib/formatter';

import { usePermission } from '@/composables/usePermission';
import { useAuthStore } from '@/store/authStore';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import DateInput from '@/components/form/DateInput.vue';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { parseToInt } from '@/lib/number';
const router = useRouter();
const search = useSearch({ strict: false }) as any;
const navigate = useNavigate();
const { hasPermission } = usePermission();
const authStore = useAuthStore();
const params = useParams({ from: '/_authenticated/work-order/$id' });
const id = computed(() => params.value.id);

const detail = ref<WorkOrderDetailResponse | null>(null);
const isLoading = ref(true);
const productionSummary = ref<ProductionAggregateResponse[]>([]);
const isExportingExcel = ref(false);

// Shell detail state
const selectedShellId = computed(() => search.value?.['wo-shell'] ? Number(search.value['wo-shell']) : null);
const selectedShell = computed(() => {
    if (!selectedShellId.value || !detail.value?.shells) return null;
    return detail.value.shells.find(s => s.id_wo_shell === selectedShellId.value) || null;
});

const selectedSizeId = ref<number | null>(null);
const selectedTab = ref<'cutting' | 'sewing' | 'qc-finish' | 'packing' | 'pengiriman'>('cutting');
const reportDate = ref<string>(new Date().toISOString().split('T')[0] || '');
const reportQty = ref('');
const isConfirmDialogOpen = ref(false);
const isSubmittingReport = ref(false);

const selectedSize = computed(() => {
    if (!selectedSizeId.value || !selectedShell.value?.sizes) return null;
    return selectedShell.value.sizes.find(sz => sz.id_wo_shell_size === selectedSizeId.value) || null;
});

// Dialog state untuk retur
const isReturDialogOpen = ref(false);
const returFile = ref<File | null>(null);
const returDeskripsi = ref('');
const isSubmittingRetur = ref(false);

const isClient = computed(() => authStore.isMitra);
const canClose = computed(() => {
    return hasPermission('WO_CLOSE');
});

const isWOOpen = computed(() => {
    const status = detail.value?.status?.toLowerCase();
    return status === 'open' || status === 'pending' || status === 'approved';
});
const isClientClosed = computed(() => detail.value?.status?.toLowerCase() === 'client_closed');

const totals = computed(() => {
    const res = {
        target_qty: 0,
        cutting: 0,
        sewing: 0,
        qc_pass: 0,
        packing: 0,
        shipped: 0,
    };
    if (productionSummary.value && productionSummary.value.length > 0) {
        productionSummary.value.forEach(item => {
            res.target_qty += item.target_qty || 0;
            if (item.production) {
                res.cutting += item.production.cutting || 0;
                res.sewing += item.production.sewing || 0;
                res.qc_pass += item.production.qc_pass || 0;
                res.packing += item.production.packing || 0;
                res.shipped += item.production.shipped || 0;
            }
        });
    } else if (detail.value) {
        res.target_qty = detail.value.qty || 0;
    }
    return res;
});

const progressPercentages = computed(() => {
    const t = totals.value;
    const target = t.target_qty || 1;
    return {
        cutting: Math.min(100, Math.round((t.cutting / target) * 100)),
        sewing: Math.min(100, Math.round((t.sewing / target) * 100)),
        qc_pass: Math.min(100, Math.round((t.qc_pass / target) * 100)),
        packing: Math.min(100, Math.round((t.packing / target) * 100)),
        shipped: Math.min(100, Math.round((t.shipped / target) * 100)),
    };
});

const fetchDetail = async () => {
    isLoading.value = true;
    try {
        detail.value = await getWorkOrderById(id.value);
        const prodSummaryRes = await getProductionSummary({ id_wo: Number(id.value) });
        productionSummary.value = prodSummaryRes?.items || [];
    } catch (e) {
        console.error('Gagal fetch Work Order detail:', e);
        toast.error('Gagal memuat data Work Order.');
    } finally {
        isLoading.value = false;
    }
};

const handleCloseWO = async () => {
    if (!confirm('Apakah Anda yakin ingin menyelesaikan/menutup Work Order ini? Status penutupan tidak dapat diubah.')) return;
    try {
        await closeWorkOrder(id.value);
        toast.success('Work Order berhasil diselesaikan/ditutup.');
        await fetchDetail();
    } catch (error: any) {
        toast.error(error.response?.data?.message || 'Gagal menutup Work Order.');
    }
};

const handleClientCloseWO = async () => {
    if (!confirm('Apakah Anda yakin ingin menandai Work Order ini selesai? Setelah ditandai selesai, Anda tidak dapat mengajukan retur lagi.')) return;
    try {
        await clientCloseWorkOrder(id.value);
        toast.success('Work Order berhasil ditandai selesai.');
        await fetchDetail();
    } catch (error: any) {
        toast.error(error.response?.data?.message || 'Gagal menandai selesai.');
    }
};

const handleExportExcel = async () => {
    isExportingExcel.value = true;
    try {
        const result = await downloadWorkOrderExcel(id.value);
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
        isExportingExcel.value = false;
    }
};

const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        returFile.value = target.files[0] || null;
    }
};

const handleSubmitRetur = async () => {
    if (!returFile.value) {
        toast.error('Surat jalan (file) wajib diunggah.');
        return;
    }
    isSubmittingRetur.value = true;
    try {
        const formData = new FormData();
        formData.append('file', returFile.value);
        formData.append('deskripsi', returDeskripsi.value);

        await submitWorkOrderReturn(id.value, formData);
        toast.success('Retur berhasil diajukan.');
        isReturDialogOpen.value = false;
        returFile.value = null;
        returDeskripsi.value = '';
        await fetchDetail();
    } catch (error: any) {
        toast.error(error.response?.data?.message || 'Gagal mengajukan retur.');
    } finally {
        isSubmittingRetur.value = false;
    }
};

// WO Shell detailed view methods
const activeProductionItem = computed(() => {
    if (!productionSummary.value || !selectedSizeId.value) return null;
    return productionSummary.value.find(item => item.id_wo_shell_size === selectedSizeId.value) || null;
});

const maxReportQty = computed(() => {
    const item = activeProductionItem.value;
    if (!item) return 0;
    
    let limit = 0;
    switch (selectedTab.value) {
        case 'cutting':
            limit = item.target_qty;
            break;
        case 'sewing':
            limit = item.production?.cutting ?? 0;
            break;
        case 'qc-finish':
            limit = item.production?.sewing ?? 0;
            break;
        case 'packing':
            limit = item.production?.qc_pass ?? 0;
            break;
        case 'pengiriman':
            limit = item.production?.packing ?? 0;
            break;
        default:
            limit = 0;
    }
    return Math.min(limit, item.target_qty);
});

const prevStageLabel = computed(() => {
    switch (selectedTab.value) {
        case 'cutting':
            return 'Target Work Order Size';
        case 'sewing':
            return 'Output Cutting';
        case 'qc-finish':
            return 'Output Sewing';
        case 'packing':
            return 'Output QC Finish';
        case 'pengiriman':
            return 'Output Packing';
        default:
            return '';
    }
});

const currentStageOutput = computed(() => {
    const item = activeProductionItem.value;
    if (!item?.production) return 0;
    
    switch (selectedTab.value) {
        case 'cutting':
            return item.production.cutting || 0;
        case 'sewing':
            return item.production.sewing || 0;
        case 'qc-finish':
            return item.production.qc_pass || 0;
        case 'packing':
            return item.production.packing || 0;
        case 'pengiriman':
            return item.production.shipped || 0;
        default:
            return 0;
    }
});

const isStageSubmitted = (tabName: 'cutting' | 'sewing' | 'qc-finish' | 'packing' | 'pengiriman') => {
    const item = activeProductionItem.value;
    if (!item?.production) return false;
    
    switch (tabName) {
        case 'cutting':
            return (item.production.cutting || 0) > 0;
        case 'sewing':
            return (item.production.sewing || 0) > 0;
        case 'qc-finish':
            return (item.production.qc_pass || 0) > 0;
        case 'packing':
            return (item.production.packing || 0) > 0;
        case 'pengiriman':
            return (item.production.shipped || 0) > 0;
        default:
            return false;
    }
};

const sizeProgressList = computed(() => {
    if (!selectedShell.value || !productionSummary.value) return [];
    
    return selectedShell.value.sizes.map(sizeObj => {
        const summaryItem = productionSummary.value.find(
            item => item.id_wo_shell_size === sizeObj.id_wo_shell_size
        );
        
        return {
            id_wo_shell_size: sizeObj.id_wo_shell_size,
            size: sizeObj.size,
            target_qty: sizeObj.qty,
            ratio: sizeObj.ratio,
            stages: {
                cutting: (summaryItem?.production?.cutting || 0) > 0,
                sewing: (summaryItem?.production?.sewing || 0) > 0,
                qcFinish: (summaryItem?.production?.qc_pass || 0) > 0,
                packing: (summaryItem?.production?.packing || 0) > 0,
                pengiriman: (summaryItem?.production?.shipped || 0) > 0,
            }
        };
    });
});

const preSubmitReport = () => {
    if (!selectedSizeId.value) return;
    if (!reportDate.value) {
        toast.error('Harap isi Tanggal laporan.');
        return;
    }
    const qtyVal = parseToInt(reportQty.value);
    if (reportQty.value === '' || qtyVal <= 0) {
        toast.error('Jumlah QTY harus lebih dari 0.');
        return;
    }

    if (maxReportQty.value > 0 && qtyVal > maxReportQty.value) {
        toast.error(
            `QTY tidak boleh melebihi batas ${prevStageLabel.value}: ${maxReportQty.value.toLocaleString('id-ID')} pcs.`
        );
        return;
    }
    
    isConfirmDialogOpen.value = true;
};

const submitReportData = async () => {
    if (!selectedSizeId.value) return;
    const qtyVal = parseToInt(reportQty.value);
    
    isSubmittingReport.value = true;
    try {
        await createFactoryReport(selectedTab.value, {
            id_wo_shell_size: selectedSizeId.value,
            qty: qtyVal,
            tanggal: reportDate.value,
        });
        toast.success('Laporan produksi berhasil ditambahkan!');
        reportQty.value = '';
        isConfirmDialogOpen.value = false;
        await fetchDetail();
    } catch (error: any) {
        const msg = error?.response?.data?.message || 'Gagal menambahkan laporan produksi.';
        toast.error(msg);
    } finally {
        isSubmittingReport.value = false;
    }
};

const selectShell = (shellId: number) => {
    navigate({
        to: '.',
        search: (prev: any) => ({ ...prev, 'wo-shell': shellId })
    });
};

const clearShellSelection = () => {
    navigate({
        to: '.',
        search: (prev: any) => {
            const next = { ...prev };
            delete next['wo-shell'];
            return next;
        }
    });
};

watch(selectedShellId, () => {
    selectedSizeId.value = null;
    selectedTab.value = 'cutting';
    reportQty.value = '';
});

watch(currentStageOutput, (newVal) => {
    if (newVal > 0) {
        reportQty.value = newVal.toString();
    } else {
        reportQty.value = '';
    }
}, { immediate: true });

// ─── Add Material List Item ───────────────────────────────────────────────────
const addItemDialogOpen = ref(false);
const addItemTargetMLId = ref<number | null>(null);
const addItemForm = ref<CreateMaterialListItemPayload>({ item: '', description: '', qty: 0, unit: '', est_price: 0 });
const isSubmittingAddItem = ref(false);

const openAddItemDialog = (idML: number) => {
    addItemTargetMLId.value = idML;
    addItemForm.value = { item: '', description: '', qty: 0, unit: '', est_price: 0 };
    addItemDialogOpen.value = true;
};

const submitAddItem = async () => {
    if (!addItemTargetMLId.value) return;
    if (!addItemForm.value.item || !addItemForm.value.unit) {
        toast.error('Item dan unit wajib diisi.');
        return;
    }
    isSubmittingAddItem.value = true;
    try {
        await createMaterialListItem(addItemTargetMLId.value, {
            item: addItemForm.value.item,
            description: addItemForm.value.description || '',
            qty: Number(addItemForm.value.qty) || 0,
            unit: addItemForm.value.unit,
            est_price: Number(addItemForm.value.est_price) || 0,
        });
        toast.success('Item berhasil ditambahkan.');
        addItemDialogOpen.value = false;
        await fetchDetail();
    } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Gagal menambahkan item.');
    } finally {
        isSubmittingAddItem.value = false;
    }
};

onMounted(fetchDetail);
</script>

<template>
    <div class="container mx-auto py-8 max-w-6xl">
        <!-- Loading State -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <div class="w-8 h-8 border-4 border-neutral-200 border-t-neutral-700 rounded-full animate-spin" />
            <p class="text-neutral-500 animate-pulse text-sm">Memuat data Work Order...</p>
        </div>

        <!-- Detail Content -->
        <div v-else-if="detail">
            <!-- CASE 1: Shell Terpilih (Show Shell Detail View) -->
            <template v-if="selectedShell">
                <!-- Page Header for Shell Detail -->
                <div class="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8 border-b pb-6 border-neutral-200">
                    <div class="flex items-center gap-4">
                        <Button
                            @click="clearShellSelection"
                            variant="outline"
                            class="border-neutral-300 shadow-xs h-10 px-4"
                        >
                            <ArrowLeftIcon class="w-4 h-4 mr-2" />
                            Kembali ke Detail WO
                        </Button>
                        <div>
                            <div class="flex items-center gap-2.5">
                                <h1 class="text-xl font-bold tracking-tight text-neutral-900">
                                    Detail Shell Kain
                                </h1>
                                <span class="bg-neutral-100 text-neutral-700 border border-neutral-200 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold">
                                    WO #{{ detail.id_wo }}
                                </span>
                            </div>
                            <p class="text-sm text-neutral-500 mt-0.5">
                                {{ selectedShell.deskripsi }} ({{ selectedShell.color }})
                            </p>
                        </div>
                    </div>
                    
                    <div class="text-xs font-semibold text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 flex items-center gap-4">
                        <div>Type: <span class="text-neutral-900 capitalize">{{ selectedShell.material_type }}</span></div>
                        <div class="h-3 w-px bg-neutral-200"></div>
                        <div>Provided By: <span class="text-neutral-900 capitalize">{{ selectedShell.provided_by }}</span></div>
                        <div class="h-3 w-px bg-neutral-200"></div>
                        <div>Cons: <span class="font-mono text-neutral-900">{{ selectedShell.cons }} yd</span></div>
                        <div class="h-3 w-px bg-neutral-200"></div>
                        <div>Allow: <span class="font-mono text-neutral-900">{{ selectedShell.allow }}%</span></div>
                        <div class="h-3 w-px bg-neutral-200"></div>
                        <div>Berat/yd: <span class="font-mono text-neutral-900">{{ selectedShell.berat_1_yd }} kg</span></div>
                    </div>
                </div>

                <!-- OVERVIEW CHECKLIST PROGRESS PER SIZE -->
                <div class="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 mb-6">
                    <h2 class="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span class="inline-block w-1.5 h-4 bg-neutral-900 rounded-full"></span>
                        Overview Progres per Ukuran (Shell Kain)
                    </h2>
                    
                    <div class="divide-y divide-neutral-100">
                        <div
                            v-for="item in sizeProgressList"
                            :key="item.id_wo_shell_size"
                            class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                            <div class="flex items-center gap-2.5 min-w-[120px]">
                                <span class="font-bold text-neutral-900 bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 rounded font-mono text-center min-w-[50px]">
                                    Size {{ item.size }}
                                </span>
                                <span class="text-[10px] text-neutral-400 font-mono">Target: {{ item.target_qty }} pcs</span>
                            </div>
                            
                            <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
                                <!-- Cutting -->
                                <div class="flex items-center gap-1.5" :class="item.stages.cutting ? 'text-emerald-700 font-semibold' : 'text-neutral-400/80'">
                                    <CheckCircleIcon class="w-4 h-4 flex-shrink-0" :class="item.stages.cutting ? 'text-emerald-600' : 'text-neutral-300'" />
                                    <span>Cutting</span>
                                </div>

                                <!-- Sewing -->
                                <div class="flex items-center gap-1.5" :class="item.stages.sewing ? 'text-emerald-700 font-semibold' : 'text-neutral-400/80'">
                                    <CheckCircleIcon class="w-4 h-4 flex-shrink-0" :class="item.stages.sewing ? 'text-emerald-600' : 'text-neutral-300'" />
                                    <span>Sewing</span>
                                </div>

                                <!-- QC Finish -->
                                <div class="flex items-center gap-1.5" :class="item.stages.qcFinish ? 'text-emerald-700 font-semibold' : 'text-neutral-400/80'">
                                    <CheckCircleIcon class="w-4 h-4 flex-shrink-0" :class="item.stages.qcFinish ? 'text-emerald-600' : 'text-neutral-300'" />
                                    <span>QC Finish</span>
                                </div>

                                <!-- Packing -->
                                <div class="flex items-center gap-1.5" :class="item.stages.packing ? 'text-emerald-700 font-semibold' : 'text-neutral-400/80'">
                                    <CheckCircleIcon class="w-4 h-4 flex-shrink-0" :class="item.stages.packing ? 'text-emerald-600' : 'text-neutral-300'" />
                                    <span>Packing</span>
                                </div>

                                <!-- Pengiriman -->
                                <div class="flex items-center gap-1.5" :class="item.stages.pengiriman ? 'text-emerald-700 font-semibold' : 'text-neutral-400/80'">
                                    <CheckCircleIcon class="w-4 h-4 flex-shrink-0" :class="item.stages.pengiriman ? 'text-emerald-600' : 'text-neutral-300'" />
                                    <span>Pengiriman</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- DROPDOWN UKURAN (WO SHELL SIZE) -->
                <div class="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 mb-6">
                    <div class="max-w-md space-y-2">
                        <Label for="shellSizeSelect" class="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                            Pilih Ukuran Shell (Size) <span class="text-red-500">*</span>
                        </Label>
                        <select
                            id="shellSizeSelect"
                            v-model="selectedSizeId"
                            class="w-full h-10 rounded-md border border-neutral-200 bg-white pl-3 pr-9 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 appearance-none cursor-pointer"
                        >
                            <option :value="null">-- Pilih Ukuran (Size) --</option>
                            <option
                                v-for="size in selectedShell.sizes"
                                :key="size.id_wo_shell_size"
                                :value="size.id_wo_shell_size"
                            >
                                Size {{ size.size }} (Qty: {{ size.qty }} pcs, Ratio: {{ size.ratio }})
                            </option>
                        </select>
                        <p class="text-[10px] text-neutral-400">Pilih salah satu ukuran untuk menginput progress produksi.</p>
                    </div>
                </div>

                <!-- MAIN PANEL (SUB-CONTENT) -->
                <div>
                    <!-- Case A: No size selected -->
                    <div v-if="!selectedSizeId" class="bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-200 py-16 px-6 text-center space-y-4">
                        <div class="inline-flex bg-neutral-100 p-4 rounded-full border border-neutral-200 text-neutral-400">
                            <Layers2Icon class="w-10 h-10" />
                        </div>
                        <div class="max-w-sm mx-auto space-y-1">
                            <h3 class="text-base font-bold text-neutral-800">Tidak ada Work Order Size yang dipilih</h3>
                            <p class="text-xs text-neutral-500 leading-normal">
                                Silakan pilih salah satu ukuran (size) dari dropdown di atas untuk mulai memasukkan progress laporan harian.
                            </p>
                        </div>
                    </div>

                    <!-- Case B: Size is selected (Show Tabs) -->
                    <div v-else class="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                        <!-- Tab Switcher Header -->
                        <div class="bg-neutral-50 border-b border-neutral-200 flex overflow-x-auto">
                            <button
                                type="button"
                                @click="selectedTab = 'cutting'"
                                :class="['px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap',
                                    selectedTab === 'cutting' 
                                        ? 'border-neutral-900 text-neutral-900 bg-white font-bold' 
                                        : 'border-transparent text-neutral-400 opacity-60 hover:opacity-100 bg-transparent'
                                ]"
                            >
                                1. Cutting
                                <CheckCircleIcon v-if="isStageSubmitted('cutting')" class="w-3.5 h-3.5 text-emerald-600 ml-1 flex-shrink-0" />
                            </button>
                            <button
                                type="button"
                                @click="selectedTab = 'sewing'"
                                :class="['px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap',
                                    selectedTab === 'sewing' 
                                        ? 'border-neutral-900 text-neutral-900 bg-white font-bold' 
                                        : 'border-transparent text-neutral-400 opacity-60 hover:opacity-100 bg-transparent'
                                ]"
                            >
                                2. Sewing
                                <CheckCircleIcon v-if="isStageSubmitted('sewing')" class="w-3.5 h-3.5 text-emerald-600 ml-1 flex-shrink-0" />
                            </button>
                            <button
                                type="button"
                                @click="selectedTab = 'qc-finish'"
                                :class="['px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap',
                                    selectedTab === 'qc-finish' 
                                        ? 'border-neutral-900 text-neutral-900 bg-white font-bold' 
                                        : 'border-transparent text-neutral-400 opacity-60 hover:opacity-100 bg-transparent'
                                ]"
                            >
                                3. QC Finish
                                <CheckCircleIcon v-if="isStageSubmitted('qc-finish')" class="w-3.5 h-3.5 text-emerald-600 ml-1 flex-shrink-0" />
                            </button>
                            <button
                                type="button"
                                @click="selectedTab = 'packing'"
                                :class="['px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap',
                                    selectedTab === 'packing' 
                                        ? 'border-neutral-900 text-neutral-900 bg-white font-bold' 
                                        : 'border-transparent text-neutral-400 opacity-60 hover:opacity-100 bg-transparent'
                                ]"
                            >
                                4. Packing
                                <CheckCircleIcon v-if="isStageSubmitted('packing')" class="w-3.5 h-3.5 text-emerald-600 ml-1 flex-shrink-0" />
                            </button>
                            <button
                                type="button"
                                @click="selectedTab = 'pengiriman'"
                                :class="['px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap',
                                    selectedTab === 'pengiriman' 
                                        ? 'border-neutral-900 text-neutral-900 bg-white font-bold' 
                                        : 'border-transparent text-neutral-400 opacity-60 hover:opacity-100 bg-transparent'
                                ]"
                            >
                                5. Pengiriman
                                <CheckCircleIcon v-if="isStageSubmitted('pengiriman')" class="w-3.5 h-3.5 text-emerald-600 ml-1 flex-shrink-0" />
                            </button>
                        </div>

                        <!-- Tab Content / Form Area -->
                        <div class="p-6">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <!-- Info Panel (Left) -->
                                <div class="md:col-span-1 bg-neutral-50 rounded-xl border border-neutral-200 p-4 space-y-4">
                                    <h4 class="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <ClipboardListIcon class="w-4 h-4 text-neutral-500" />
                                        Informasi Status Ukuran
                                    </h4>
                                    
                                    <div class="space-y-3.5 text-xs">
                                        <div class="flex justify-between">
                                            <span class="text-neutral-500">Ukuran / Size:</span>
                                            <span class="font-bold text-neutral-900 bg-neutral-200/60 px-2 py-0.5 rounded font-mono">{{ selectedSize?.size }}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-neutral-500">Target Size Qty:</span>
                                            <span class="font-bold text-neutral-900 font-mono">{{ selectedSize?.qty.toLocaleString('id-ID') }} pcs</span>
                                        </div>
                                        <Separator class="bg-neutral-200" />
                                        <div class="flex justify-between">
                                            <span class="text-neutral-500">Current Output Stage:</span>
                                            <span class="font-bold text-neutral-900 font-mono">{{ currentStageOutput.toLocaleString('id-ID') }} pcs</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-neutral-500">Batas Maks Qty Input:</span>
                                            <span class="font-mono font-bold text-[#10756e] bg-[#10756e]/10 px-2 py-0.5 rounded">{{ maxReportQty.toLocaleString('id-ID') }} pcs</span>
                                        </div>
                                        <div class="text-[10px] text-neutral-400 italic leading-normal">
                                            * Batas maksimal dihitung berdasarkan output dari tahap sebelumnya ({{ prevStageLabel }}).
                                        </div>
                                    </div>
                                </div>

                                <!-- Input Form Panel (Right) -->
                                <div class="md:col-span-2 space-y-4">
                                    <h4 class="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                                        Input Hasil Produksi Harian (Tahap {{ selectedTab === 'qc-finish' ? 'QC Finish' : selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1) }})
                                    </h4>
                                    
                                    <div class="grid grid-cols-2 gap-4">
                                        <!-- Date Input -->
                                        <div class="space-y-1.5">
                                            <Label for="reportDateInput" class="text-xs font-semibold text-neutral-700">Tanggal Laporan <span class="text-red-500">*</span></Label>
                                            <DateInput
                                                id="reportDateInput"
                                                v-model="reportDate"
                                                :disabled="currentStageOutput > 0"
                                                class="h-10 text-sm border-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-800 bg-white disabled:bg-neutral-50 disabled:text-neutral-500 disabled:border-neutral-200 disabled:cursor-not-allowed"
                                            />
                                        </div>

                                        <!-- Qty Input -->
                                        <div class="space-y-1.5">
                                            <Label for="reportQtyInput" class="text-xs font-semibold text-neutral-700">Jumlah Qty (pcs) <span class="text-red-500">*</span></Label>
                                            <Input
                                                id="reportQtyInput"
                                                v-model="reportQty"
                                                type="text"
                                                placeholder="Contoh: 50"
                                                :disabled="currentStageOutput > 0"
                                                class="h-10 text-sm border-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-800 bg-white disabled:bg-neutral-50 disabled:text-neutral-500 disabled:border-neutral-200 disabled:cursor-not-allowed"
                                            />
                                        </div>
                                    </div>

                                    <div class="pt-4 flex justify-end">
                                        <Button
                                            type="button"
                                            :disabled="currentStageOutput >= maxReportQty || maxReportQty <= 0"
                                            @click="preSubmitReport"
                                            class="bg-[#10756e] hover:bg-[#158f85] text-white border border-[#10756e] shadow-sm px-6 font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 disabled:border-neutral-200"
                                        >
                                            <template v-if="currentStageOutput >= maxReportQty && maxReportQty > 0">
                                                Laporan Selesai (Sudah Disubmit)
                                            </template>
                                            <template v-else-if="maxReportQty <= 0">
                                                Menunggu Tahap Sebelumnya
                                            </template>
                                            <template v-else>
                                                Kirim Laporan Tahap {{ selectedTab === 'qc-finish' ? 'QC Finish' : selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1) }}
                                            </template>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <!-- CASE 2: No Shell Terpilih (Standard View) -->
            <template v-else>
                <!-- Page Header -->
                <div class="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8 border-b pb-6 border-neutral-200">
                    <div class="flex items-center gap-4">
                        <div class="bg-neutral-100 p-3.5 rounded-2xl border border-neutral-200 shadow-sm">
                            <FileTextIcon class="w-8 h-8 text-neutral-700" />
                        </div>
                        <div>
                            <div class="flex items-center gap-2.5">
                                <h1 class="text-2xl font-bold tracking-tight text-neutral-900">
                                    WO #{{ detail.id_wo }}
                                </h1>
                                <span
                                    :class="[
                                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                        detail.status?.toLowerCase() === 'open'
                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                            : detail.status?.toLowerCase() === 'pending'
                                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                                : isClientClosed
                                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                                    : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                                    ]"
                                >
                                    {{ detail.status === 'client_closed' ? 'Closed by Client' : detail.status }}
                                </span>
                            </div>
                            <p class="text-sm text-neutral-500 mt-0.5">
                                {{ detail.buyer }} · {{ detail.model }}
                            </p>
                        </div>
                    </div>

                    <div class="flex gap-2.5 w-full md:w-auto">
                        <Button
                            @click="router.navigate({ to: '/work-order' })"
                            variant="outline"
                            class="flex-1 md:flex-none border-neutral-300 shadow-xs"
                        >
                            <ArrowLeftIcon class="w-4 h-4 mr-2" />
                            Kembali
                        </Button>
                        <Button
                            v-if="!isClient"
                            :disabled="isExportingExcel"
                            @click="handleExportExcel"
                            variant="outline"
                            class="flex-1 md:flex-none border-emerald-300 text-emerald-700 hover:bg-emerald-50 shadow-xs"
                        >
                            <DownloadIcon class="w-4 h-4 mr-2" />
                            {{ isExportingExcel ? 'Mengunduh...' : 'Export Excel' }}
                        </Button>
                        <Button
                            v-if="isClient && isWOOpen && !detail.retur"
                            @click="isReturDialogOpen = true"
                            variant="outline"
                            class="flex-1 md:flex-none border-amber-300 hover:bg-amber-50 text-amber-700 shadow-xs"
                        >
                            <UndoIcon class="w-4 h-4 mr-2" />
                            Ajukan Retur
                        </Button>
                        <Button
                            v-if="isClient && isWOOpen"
                            @click="handleClientCloseWO"
                            class="flex-1 md:flex-none bg-amber-600 hover:bg-amber-700 text-white border border-amber-700 shadow-xs"
                        >
                            <CheckCircleIcon class="w-4 h-4 mr-2" />
                            Tandai Selesai
                        </Button>
                        <Button
                            v-if="canClose && isClientClosed"
                            @click="handleCloseWO"
                            class="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 shadow-xs"
                        >
                            <CheckCircleIcon class="w-4 h-4 mr-2" />
                            Selesaikan WO
                        </Button>
                    </div>
                </div>

                <!-- Production Progress Card -->
                <div class="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden mb-6 p-5">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                            <h2 class="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
                                <span class="inline-block w-1.5 h-4 bg-emerald-600 rounded-full"></span>
                                Progres Produksi Work Order
                            </h2>
                            <p class="text-xs text-neutral-500 mt-1">Status pengerjaan berdasarkan input laporan harian pabrik.</p>
                        </div>
                        <div class="flex items-center gap-4 text-xs font-semibold text-neutral-600">
                            <div>Target: <span class="font-mono text-neutral-900">{{ totals.target_qty.toLocaleString('id-ID') }}</span> pcs</div>
                            <div class="h-3 w-px bg-neutral-200"></div>
                            <div>Terkirim: <span class="font-mono text-emerald-600">{{ totals.shipped.toLocaleString('id-ID') }}</span> pcs</div>
                        </div>
                    </div>
                    
                    <!-- Main overall progress bar -->
                    <div class="space-y-2 mb-6">
                        <div class="flex justify-between items-center text-xs">
                            <span class="font-medium text-neutral-700">Persentase Pengiriman Selesai</span>
                            <span class="font-bold text-emerald-600 font-mono">{{ progressPercentages.shipped }}%</span>
                        </div>
                        <Progress :value="progressPercentages.shipped" class="h-2.5 bg-neutral-100" indicator-class="bg-emerald-600" />
                    </div>
                    
                    <!-- Five stages grid -->
                    <div class="grid grid-cols-1 sm:grid-cols-5 gap-4 pt-4 border-t border-neutral-100">
                        <!-- Stage 1: Cutting -->
                        <div class="space-y-1.5">
                            <div class="flex justify-between text-[11px] font-medium text-neutral-500">
                                <span>Cutting</span>
                                <span class="font-mono text-neutral-700">{{ progressPercentages.cutting }}%</span>
                            </div>
                            <Progress :value="progressPercentages.cutting" class="h-1.5 bg-neutral-100" indicator-class="bg-blue-500" />
                            <p class="text-[10px] text-neutral-400 font-mono">{{ totals.cutting.toLocaleString('id-ID') }} pcs</p>
                        </div>
                        <!-- Stage 2: Sewing -->
                        <div class="space-y-1.5">
                            <div class="flex justify-between text-[11px] font-medium text-neutral-500">
                                <span>Sewing</span>
                                <span class="font-mono text-neutral-700">{{ progressPercentages.sewing }}%</span>
                            </div>
                            <Progress :value="progressPercentages.sewing" class="h-1.5 bg-neutral-100" indicator-class="bg-indigo-500" />
                            <p class="text-[10px] text-neutral-400 font-mono">{{ totals.sewing.toLocaleString('id-ID') }} pcs</p>
                        </div>
                        <!-- Stage 3: QC Finish -->
                        <div class="space-y-1.5">
                            <div class="flex justify-between text-[11px] font-medium text-neutral-500">
                                <span>QC Finish</span>
                                <span class="font-mono text-neutral-700">{{ progressPercentages.qc_pass }}%</span>
                            </div>
                            <Progress :value="progressPercentages.qc_pass" class="h-1.5 bg-neutral-100" indicator-class="bg-amber-500" />
                            <p class="text-[10px] text-neutral-400 font-mono">{{ totals.qc_pass.toLocaleString('id-ID') }} pcs</p>
                        </div>
                        <!-- Stage 4: Packing -->
                        <div class="space-y-1.5">
                            <div class="flex justify-between text-[11px] font-medium text-neutral-500">
                                <span>Packing</span>
                                <span class="font-mono text-neutral-700">{{ progressPercentages.packing }}%</span>
                            </div>
                            <Progress :value="progressPercentages.packing" class="h-1.5 bg-neutral-100" indicator-class="bg-purple-500" />
                            <p class="text-[10px] text-neutral-400 font-mono">{{ totals.packing.toLocaleString('id-ID') }} pcs</p>
                        </div>
                        <!-- Stage 5: Pengiriman -->
                        <div class="space-y-1.5">
                            <div class="flex justify-between text-[11px] font-medium text-neutral-500">
                                <span>Pengiriman</span>
                                <span class="font-mono text-neutral-700">{{ progressPercentages.shipped }}%</span>
                            </div>
                            <Progress :value="progressPercentages.shipped" class="h-1.5 bg-neutral-100" indicator-class="bg-rose-500" />
                            <p class="text-[10px] text-neutral-400 font-mono">{{ totals.shipped.toLocaleString('id-ID') }} pcs</p>
                        </div>
                    </div>
                </div>

                <!-- WO Shells Table (Full Width) -->
                <div class="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden mb-6">
                    <div class="bg-neutral-50 border-b border-neutral-200 px-5 py-3.5 flex items-center justify-between">
                        <h2 class="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
                            <Layers2Icon class="w-3.5 h-3.5 text-neutral-500" />
                            WO Shells — Kain Utama ({{ detail.shells?.length || 0 }})
                        </h2>
                        <span class="text-[10px] font-semibold text-neutral-400">Klik baris untuk melihat Sizes &amp; Progress</span>
                    </div>

                    <div v-if="!detail.shells || detail.shells.length === 0" class="text-center py-10 text-neutral-400 text-sm">
                        Tidak ada data shell kain.
                    </div>
                    <div v-else class="overflow-x-auto">
                        <table class="w-full text-left border-collapse text-xs">
                            <thead class="bg-neutral-50/50 border-b border-neutral-200">
                                <tr>
                                    <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Type</th>
                                    <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Deskripsi</th>
                                    <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Provided By</th>
                                    <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Color</th>
                                    <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider text-right">Cons (yd)</th>
                                    <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider text-right">Allow</th>
                                    <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider text-right">Berat/yd</th>
                                    <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider text-center">Sizes</th>
                                    <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-neutral-100">
                                <tr
                                    v-for="shell in detail.shells"
                                    :key="shell.id_wo_shell"
                                    class="hover:bg-neutral-50 cursor-pointer transition-colors group"
                                    @click="selectShell(shell.id_wo_shell)"
                                >
                                    <td class="px-4 py-3.5 font-medium text-neutral-700 capitalize">{{ shell.material_type }}</td>
                                    <td class="px-4 py-3.5 font-semibold text-neutral-800">{{ shell.deskripsi }}</td>
                                    <td class="px-4 py-3.5 font-medium text-neutral-700 capitalize">{{ shell.provided_by }}</td>
                                    <td class="px-4 py-3.5">
                                        <span class="inline-flex items-center gap-1.5 font-medium text-neutral-700">
                                            <span
                                                class="w-2.5 h-2.5 rounded-full border border-neutral-300 flex-shrink-0"
                                                :style="{ backgroundColor: shell.color.toLowerCase() === 'white' ? '#f5f5f5' : shell.color.toLowerCase() === 'black' ? '#1c1c1e' : shell.color.toLowerCase() }"
                                            />
                                            {{ shell.color }}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3.5 font-mono text-neutral-700 text-right">{{ shell.cons }}</td>
                                    <td class="px-4 py-3.5 font-mono text-neutral-700 text-right">{{ shell.allow }}%</td>
                                    <td class="px-4 py-3.5 font-mono text-neutral-700 text-right">{{ shell.berat_1_yd }} kg</td>
                                    <td class="px-4 py-3.5 text-center">
                                        <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-[10px] font-bold">
                                            {{ shell.sizes?.length || 0 }} ukuran
                                        </span>
                                    </td>
                                    <td class="px-4 py-3.5 text-center">
                                        <div class="flex items-center justify-center gap-2">
                                            <button
                                                type="button"
                                                @click.stop="selectShell(shell.id_wo_shell)"
                                                class="text-[10px] font-semibold text-neutral-500 group-hover:text-neutral-800 underline underline-offset-2 transition-colors"
                                            >
                                                Lihat Progress &amp; Sizes →
                                            </button>
                                            <template v-if="hasPermission('MARKER_PLAN_CREATE')">
                                                <span class="text-neutral-300">|</span>
                                                <button
                                                    type="button"
                                                    @click.stop="router.navigate({ 
                                                        to: '/marker-plan/create', 
                                                        search: { 
                                                            poNumber: detail.po_number, 
                                                            woId: detail.id_wo, 
                                                            shellId: shell.id_wo_shell 
                                                        } 
                                                    })"
                                                    class="text-[10px] font-semibold text-emerald-600 hover:text-emerald-800 underline underline-offset-2 transition-colors"
                                                >
                                                    Buat Marker Plan
                                                </button>
                                            </template>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Two-column layout -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

                    <!-- LEFT SIDEBAR — Info Utama -->
                    <div class="space-y-4">
                        <!-- Info Card -->
                        <div class="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                            <div class="bg-neutral-50 border-b border-neutral-200 px-4 py-3">
                                <h2 class="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
                                    <FileTextIcon class="w-3.5 h-3.5 text-neutral-500" />
                                    Informasi Work Order
                                </h2>
                            </div>
                            <div class="p-4 space-y-4">
                                <div class="space-y-1">
                                    <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Buyer</p>
                                    <p class="font-semibold text-neutral-900 text-sm">{{ detail.buyer }}</p>
                                </div>
                                <Separator />
                                <div class="space-y-1">
                                    <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Model / Style</p>
                                    <p class="font-semibold text-neutral-900 text-sm">{{ detail.model }}</p>
                                </div>
                                <Separator />
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="space-y-1">
                                        <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Qty</p>
                                        <p class="font-mono font-bold text-neutral-900 text-sm">{{ detail.qty.toLocaleString('id-ID') }} pcs</p>
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Maklon</p>
                                        <span
                                            :class="[
                                                'inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold',
                                                detail.fob_cmt
                                                    ? 'bg-indigo-100 text-indigo-800'
                                                    : 'bg-orange-100 text-orange-800'
                                            ]"
                                        >
                                            {{ detail.fob_cmt ? 'FOB' : 'CMT' }}
                                        </span>
                                    </div>
                                </div>
                                <Separator />
                                <div class="space-y-1">
                                    <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                                        <CalendarIcon class="w-3 h-3" /> Delivery Date
                                    </p>
                                    <p class="font-semibold text-neutral-900 text-sm">{{ formatDate(detail.delivery) }}</p>
                                </div>
                            </div>
                        </div>

                        <!-- PO Info Card -->
                        <div class="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                            <div class="bg-neutral-50 border-b border-neutral-200 px-4 py-3">
                                <h2 class="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
                                    <HashIcon class="w-3.5 h-3.5 text-neutral-500" />
                                    Referensi PO Client
                                </h2>
                            </div>
                            <div class="p-4 space-y-4">
                                <div class="space-y-1">
                                    <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">PO Number</p>
                                    <p class="font-mono font-bold text-neutral-900 text-sm">{{ detail.po_number }}</p>
                                </div>
                                <Separator />
                                <div class="space-y-1">
                                    <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">PO Item Style</p>
                                    <p class="font-semibold text-neutral-900 text-sm">{{ detail.po_client_item_style }}</p>
                                </div>
                                <Separator />
                                <div class="space-y-1">
                                    <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                                        <CalendarIcon class="w-3 h-3" /> Created At
                                    </p>
                                    <p class="text-neutral-700 text-xs">{{ formatDate(detail.created_at) }}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- RIGHT — Main Content -->
                    <div class="md:col-span-2 space-y-6">

                        <!-- Client Return Card -->
                        <div v-if="detail.retur" class="bg-amber-50/50 rounded-xl border border-amber-200 shadow-sm overflow-hidden mb-6">
                            <div class="bg-amber-50 border-b border-amber-200 px-5 py-3.5 flex items-center justify-between">
                                <h2 class="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-2">
                                    <UndoIcon class="w-3.5 h-3.5 text-amber-700" />
                                    Informasi Pengajuan Retur
                                </h2>
                                <span class="text-[10px] font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                                    Diajukan pada {{ formatDate(detail.retur.created_at) }}
                                </span>
                            </div>
                            <div class="p-5 space-y-4">
                                <div class="space-y-1">
                                    <p class="text-[10px] font-bold text-amber-600/80 uppercase tracking-wider">Deskripsi Retur</p>
                                    <p class="text-sm text-neutral-700 leading-relaxed">
                                        {{ detail.retur.deskripsi || 'Tidak ada deskripsi yang disertakan.' }}
                                    </p>
                                </div>
                                <Separator class="bg-amber-200/50" />
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <FileTextIcon class="w-4 h-4 text-amber-700" />
                                        <span class="text-xs text-neutral-600 font-medium">Dokumen Surat Jalan</span>
                                    </div>
                                    <a
                                        :href="'http://localhost:8080/' + detail.retur.file"
                                        target="_blank"
                                        class="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                                    >
                                        Lihat / Unduh Dokumen
                                        <ArrowUpRightIcon class="w-3.5 h-3.5" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        <!-- Trims Table -->
                        <div class="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                            <div class="bg-neutral-50 border-b border-neutral-200 px-5 py-3.5">
                                <h2 class="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
                                    <ScissorsIcon class="w-3.5 h-3.5 text-neutral-500" />
                                    Trims — Aksesoris ({{ detail.trims?.length || 0 }})
                                </h2>
                            </div>
                            <div v-if="!detail.trims || detail.trims.length === 0" class="text-center py-8 text-neutral-400 text-sm">
                                Tidak ada data trim aksesoris.
                            </div>
                            <div v-else class="overflow-x-auto">
                                <table class="w-full text-left border-collapse text-xs">
                                    <thead class="bg-neutral-50/50 border-b border-neutral-200">
                                        <tr>
                                            <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Item</th>
                                            <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Provided By</th>
                                            <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Code</th>
                                            <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Color</th>
                                            <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider text-right">Cons</th>
                                            <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider text-right">Qty</th>
                                            <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">UOM</th>
                                            <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Position</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-neutral-100">
                                        <tr v-for="trim in detail.trims" :key="trim.id_wo_trim" class="hover:bg-neutral-50/40">
                                            <td class="px-4 py-3 font-semibold text-neutral-800">{{ trim.item }}</td>
                                            <td class="px-4 py-3 font-medium text-neutral-700 capitalize">{{ trim.provided_by }}</td>
                                            <td class="px-4 py-3 font-mono text-neutral-600">{{ trim.code }}</td>
                                            <td class="px-4 py-3 text-neutral-700">{{ trim.color }}</td>
                                            <td class="px-4 py-3 font-mono text-right text-neutral-700">{{ trim.cons }}</td>
                                            <td class="px-4 py-3 font-mono font-medium text-right text-neutral-800">{{ trim.qty }}</td>
                                            <td class="px-4 py-3 text-neutral-600">{{ trim.uom }}</td>
                                            <td class="px-4 py-3 text-neutral-500">{{ trim.position || '—' }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Material Lists Table -->
                        <div class="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                            <div class="bg-neutral-50 border-b border-neutral-200 px-5 py-3.5">
                                <h2 class="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
                                    <ClipboardListIcon class="w-3.5 h-3.5 text-neutral-500" />
                                    Material List ({{ (detail.material_lists || []).reduce((acc: number, ml: any) => acc + (ml.items?.length || 0), 0) }} item)
                                </h2>
                            </div>
                            <div v-if="!detail.material_lists || detail.material_lists.length === 0" class="text-center py-8 text-neutral-400 text-sm">
                                Tidak ada data material list.
                            </div>
                            <div v-else class="overflow-x-auto">
                                <template v-for="ml in detail.material_lists" :key="ml.id_material_list">
                                    <div class="px-4 py-2 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between gap-2">
                                        <div class="flex items-center gap-2">
                                            <span class="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{{ ml.name }}</span>
                                            <span v-if="ml.is_locked" class="text-[9px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">LOCKED</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <button
                                                v-if="!ml.is_locked && hasPermission('WO_UPDATE')"
                                                class="text-[10px] text-white bg-neutral-800 hover:bg-neutral-700 font-medium flex items-center gap-0.5 px-2 py-1 rounded"
                                                @click="openAddItemDialog(ml.id_material_list)"
                                            >
                                                + Tambah Item
                                            </button>
                                            <button
                                                class="text-[10px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5"
                                                @click="router.navigate({ to: '/material-list' })"
                                            >
                                                Lihat di Material List →
                                            </button>
                                        </div>
                                    </div>
                                    <table class="w-full text-left border-collapse text-xs">
                                        <thead class="bg-neutral-50/50 border-b border-neutral-200">
                                            <tr>
                                                <th class="px-4 py-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Item</th>
                                                <th class="px-4 py-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Description</th>
                                                <th class="px-4 py-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Qty WO</th>
                                                <th class="px-4 py-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Qty SJ</th>
                                                <th class="px-4 py-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Qty Received</th>
                                                <th class="px-4 py-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Unit</th>
                                                <th class="px-4 py-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Est. Harga</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-neutral-100">
                                            <tr v-if="!ml.items || ml.items.length === 0">
                                                <td colspan="7" class="px-4 py-3 text-center text-neutral-400">Tidak ada item.</td>
                                            </tr>
                                            <tr
                                                v-for="mli in ml.items"
                                                :key="mli.id_material_list_item"
                                                class="hover:bg-blue-50/40 cursor-pointer"
                                                @click="router.navigate({ to: '/material-list/$id', params: { id: String(mli.id_material_list_item) } })"
                                            >
                                                <td class="px-4 py-2.5 font-medium text-neutral-800">{{ mli.item }}</td>
                                                <td class="px-4 py-2.5 text-neutral-600">{{ mli.description }}</td>
                                                <td class="px-4 py-2.5 text-neutral-700">{{ mli.qty }}</td>
                                                <td class="px-4 py-2.5 text-neutral-700">{{ mli.qty_surat_jalan }}</td>
                                                <td class="px-4 py-2.5 text-neutral-700">{{ mli.qty_received }}</td>
                                                <td class="px-4 py-2.5 text-neutral-600">{{ mli.unit }}</td>
                                                <td class="px-4 py-2.5 text-neutral-600">{{ mli.est_price > 0 ? `Rp ${mli.est_price.toLocaleString('id-ID')}` : '-' }}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </template>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </div>

        <!-- Not Found State -->
        <div v-else class="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
            <div class="bg-neutral-100 p-4 rounded-full border border-neutral-200">
                <FileTextIcon class="w-12 h-12 text-neutral-400" />
            </div>
            <h2 class="text-2xl font-bold text-neutral-900">Work Order Tidak Ditemukan</h2>
            <p class="text-neutral-500">Data Work Order yang Anda cari tidak tersedia.</p>
            <Button @click="router.navigate({ to: '/work-order' })" class="bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm border border-neutral-800">
                Kembali ke Daftar WO
            </Button>
        </div>

        <!-- Dialog Konfirmasi Kirim Laporan -->
        <Dialog :open="isConfirmDialogOpen" @update:open="isConfirmDialogOpen = $event">
            <DialogContent class="sm:max-w-md bg-white border border-neutral-200 shadow-xl rounded-xl p-6">
                <DialogHeader class="space-y-2">
                    <DialogTitle class="text-lg font-bold text-neutral-900 flex items-center gap-2">
                        <ClipboardListIcon class="w-5 h-5 text-[#10756e]" />
                        Konfirmasi Kirim Laporan
                    </DialogTitle>
                    <DialogDescription class="text-xs text-neutral-500">
                        Pastikan data hasil produksi harian berikut sudah sesuai sebelum dikirim ke sistem.
                    </DialogDescription>
                </DialogHeader>

                <div class="mt-4 bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-3 text-xs text-neutral-700">
                    <div class="flex justify-between">
                        <span class="text-neutral-500">Ukuran / Size:</span>
                        <span class="font-bold font-mono">{{ selectedSize?.size }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-neutral-500">Divisi Pengerjaan:</span>
                        <span class="font-bold capitalize">{{ selectedTab === 'qc-finish' ? 'QC Finish' : selectedTab }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-neutral-500">Tanggal Laporan:</span>
                        <span class="font-bold">{{ reportDate }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-neutral-500">Jumlah Qty:</span>
                        <span class="font-bold font-mono text-[#10756e] text-sm">{{ parseToInt(reportQty).toLocaleString('id-ID') }} pcs</span>
                    </div>
                </div>

                <DialogFooter class="flex gap-2 sm:gap-0 mt-6 pt-4 border-t border-neutral-100">
                    <Button
                        type="button"
                        variant="outline"
                        @click="isConfirmDialogOpen = false"
                        class="border-neutral-300 text-neutral-700 text-xs"
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        :disabled="isSubmittingReport"
                        @click="submitReportData"
                        class="bg-[#10756e] hover:bg-[#158f85] text-white border border-[#10756e] text-xs font-semibold"
                    >
                        {{ isSubmittingReport ? 'Menyimpan...' : 'Ya, Kirim Laporan' }}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <!-- Dialog Ajukan Retur -->
        <Dialog :open="isReturDialogOpen" @update:open="isReturDialogOpen = $event">
            <DialogContent class="sm:max-w-md bg-white border border-neutral-200 shadow-xl rounded-xl p-6">
                <DialogHeader class="space-y-2">
                    <DialogTitle class="text-xl font-bold text-neutral-900 flex items-center gap-2">
                        <UndoIcon class="w-5 h-5 text-amber-600" />
                        Ajukan Retur Client
                    </DialogTitle>
                    <DialogDescription class="text-xs text-neutral-500">
                        Unggah dokumen surat jalan dan berikan deskripsi/alasan mengajukan retur untuk Work Order ini.
                    </DialogDescription>
                </DialogHeader>

                <form @submit.prevent="handleSubmitRetur" class="space-y-4 mt-4">
                    <div class="space-y-1.5">
                        <Label for="file" class="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                            Surat Jalan (File) <span class="text-red-500">*</span>
                        </Label>
                        <Input
                            id="file"
                            type="file"
                            accept="image/*,application/pdf"
                            required
                            @change="handleFileChange"
                            class="text-xs file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200 border-neutral-300"
                        />
                        <p class="text-[10px] text-neutral-400">Pilih berkas PDF atau gambar (JPEG, PNG, dsb.). Max 10MB.</p>
                    </div>

                    <div class="space-y-1.5">
                        <Label for="deskripsi" class="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                            Deskripsi / Alasan Retur
                        </Label>
                        <Textarea
                            id="deskripsi"
                            v-model="returDeskripsi"
                            placeholder="Tuliskan alasan pengembalian/retur secara detail..."
                            class="min-h-[100px] text-xs border-neutral-300"
                        />
                    </div>

                    <DialogFooter class="flex gap-2 sm:gap-0 mt-6 pt-4 border-t border-neutral-100">
                        <Button
                            type="button"
                            variant="outline"
                            @click="isReturDialogOpen = false"
                            class="border-neutral-300 text-neutral-700"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            :disabled="isSubmittingRetur"
                            class="bg-neutral-900 hover:bg-neutral-800 text-white"
                        >
                            {{ isSubmittingRetur ? 'Mengirim...' : 'Kirim Pengajuan' }}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

    </div>

    <!-- Add Material List Item Dialog -->
    <Dialog :open="addItemDialogOpen" @update:open="addItemDialogOpen = $event">
        <DialogContent class="max-w-md">
            <DialogHeader>
                <DialogTitle class="flex items-center gap-2">
                    <ClipboardListIcon class="w-4 h-4 text-neutral-500" />
                    Tambah Item Material List
                </DialogTitle>
                <DialogDescription>Isi detail item yang ingin ditambahkan ke material list ini.</DialogDescription>
            </DialogHeader>
            <div class="space-y-3 my-2">
                <div>
                    <Label class="text-xs">Item <span class="text-red-500">*</span></Label>
                    <Input v-model="addItemForm.item" placeholder="Nama item" class="mt-1 text-sm" />
                </div>
                <div>
                    <Label class="text-xs">Deskripsi</Label>
                    <Input v-model="addItemForm.description" placeholder="Opsional" class="mt-1 text-sm" />
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <Label class="text-xs">Qty</Label>
                        <Input v-model="addItemForm.qty" type="number" min="0" placeholder="0" class="mt-1 text-sm" />
                    </div>
                    <div>
                        <Label class="text-xs">Unit <span class="text-red-500">*</span></Label>
                        <Input v-model="addItemForm.unit" placeholder="pcs, meter, kg..." class="mt-1 text-sm" />
                    </div>
                </div>
                <div>
                    <Label class="text-xs">Est. Harga (Rp)</Label>
                    <Input v-model="addItemForm.est_price" type="number" min="0" placeholder="0" class="mt-1 text-sm" />
                </div>
            </div>
            <DialogFooter class="gap-2">
                <Button variant="outline" @click="addItemDialogOpen = false" :disabled="isSubmittingAddItem">Batal</Button>
                <Button @click="submitAddItem" :disabled="isSubmittingAddItem" class="bg-neutral-900 hover:bg-neutral-800 text-white">
                    {{ isSubmittingAddItem ? 'Menyimpan...' : 'Simpan Item' }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
