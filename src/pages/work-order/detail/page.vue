<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useParams, useRouter } from '@tanstack/vue-router';
import {
    ArrowLeftIcon,
    FileTextIcon,
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
    submitWorkOrderReturn,
    type WorkOrderDetailResponse,
    type WorkOrderShell
} from '@/api/work-orders/work-orders';
import { getProductionSummary } from '@/api/production/production';
import type { ProductionAggregateResponse } from '@/schemas/production/production';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { formatDate } from '@/lib/formatter';
import WOShellSizeSheet from './WOShellSizeSheet.vue';

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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const router = useRouter();
const { hasPermission } = usePermission();
const authStore = useAuthStore();
const params = useParams({ from: '/_authenticated/work-order/$id' });
const id = computed(() => params.value.id);

const detail = ref<WorkOrderDetailResponse | null>(null);
const isLoading = ref(true);
const productionSummary = ref<ProductionAggregateResponse[]>([]);

// Sheet state untuk sizes
const isSheetOpen = ref(false);
const selectedShell = ref<WorkOrderShell | null>(null);

// Dialog state untuk retur
const isReturDialogOpen = ref(false);
const returFile = ref<File | null>(null);
const returDeskripsi = ref('');
const isSubmittingRetur = ref(false);

const isClient = computed(() => authStore.isMitra);
const canClose = computed(() => {
    return hasPermission('WO_CLOSE');
});

const isWOOpen = computed(() => detail.value?.status?.toLowerCase() === 'open');
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

const openShellSizes = (shell: WorkOrderShell) => {
    selectedShell.value = shell;
    isSheetOpen.value = true;
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
                                    isWOOpen
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
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
                    <span class="text-[10px] font-semibold text-neutral-400">Klik baris untuk melihat Sizes</span>
                </div>

                <div v-if="!detail.shells || detail.shells.length === 0" class="text-center py-10 text-neutral-400 text-sm">
                    Tidak ada data shell kain.
                </div>
                <div v-else class="overflow-x-auto">
                    <table class="w-full text-left border-collapse text-xs">
                        <thead class="bg-neutral-50/50 border-b border-neutral-200">
                            <tr>
                                <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Fabric</th>
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
                                @click="openShellSizes(shell)"
                            >
                                <td class="px-4 py-3.5 font-semibold text-neutral-800">{{ shell.fabric }}</td>
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
                                            @click.stop="openShellSizes(shell)"
                                            class="text-[10px] font-semibold text-neutral-500 hover:text-neutral-800 underline underline-offset-2 transition-colors"
                                        >
                                            Lihat Sizes
                                        </button>
                                        <span v-if="hasPermission('MARKER_PLAN_CREATE')" class="text-neutral-300">|</span>
                                        <button
                                            v-if="hasPermission('MARKER_PLAN_CREATE')"
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
                                Material List ({{ detail.material_lists?.length || 0 }})
                            </h2>
                        </div>
                        <div v-if="!detail.material_lists || detail.material_lists.length === 0" class="text-center py-8 text-neutral-400 text-sm">
                            Tidak ada data material list.
                        </div>
                        <div v-else class="overflow-x-auto">
                            <table class="w-full text-left border-collapse text-xs">
                                <thead class="bg-neutral-50/50 border-b border-neutral-200">
                                    <tr>
                                        <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Description</th>
                                        <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Size</th>
                                        <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Color</th>
                                        <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">UOM</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-neutral-100">
                                    <tr v-for="mat in detail.material_lists" :key="mat.id_material_list" class="hover:bg-neutral-50/40">
                                        <td class="px-4 py-3 font-medium text-neutral-800">{{ mat.description }}</td>
                                        <td class="px-4 py-3 text-neutral-600">{{ mat.size }}</td>
                                        <td class="px-4 py-3 text-neutral-700">{{ mat.color }}</td>
                                        <td class="px-4 py-3 text-neutral-600">{{ mat.uom }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
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

        <!-- Shell Size Sheet -->
        <WOShellSizeSheet
            :is-open="isSheetOpen"
            :shell="selectedShell"
            :production-summary="productionSummary"
            @update:is-open="isSheetOpen = $event"
            @report-submitted="fetchDetail"
        />

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
</template>
