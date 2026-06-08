<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useParams, useRouter } from '@tanstack/vue-router';
import { 
    FileTextIcon,
    Hash, 
    Calendar,
    Info,
    Mail,
    Phone,
    DollarSign,
    UserIcon,
    ArrowLeftIcon,
    PencilIcon,
    ImageIcon,
    PaperclipIcon,
    FactoryIcon
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { getPOClientById, type POClientDetailResponse } from '@/api/po-clients/po-clients';
import { getWorkOrderById, clientCloseWorkOrder, submitWorkOrderReturn } from '@/api/work-orders/work-orders';
import { getProductionSummary } from '@/api/production/production';
import ProductionProgressBar from '@/components/dashboard/ProductionProgressBar.vue';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDate, formatNumber } from '@/lib/formatter';

import { usePermission } from '@/composables/usePermission';
import { useAuthStore } from '@/store/authStore';

const router = useRouter();
const { hasPermission } = usePermission();
const authStore = useAuthStore();
const params = useParams({ from: '/_authenticated/po-client/$id' });
const id = computed(() => params.value.id);

const isClient = computed(() => authStore.isMitra || authStore.roleName?.toUpperCase() === 'CLIENT');

const canCreateOrEdit = computed(() => {
    return hasPermission('PO_CLIENT_CREATE') || hasPermission('PO_CLIENT_UPDATE');
});

const detail = ref<POClientDetailResponse | null>(null);
const isLoading = ref(true);

const selectedItemForProgress = ref<any>(null);
const woDetail = ref<any>(null);
const productionSummary = ref<any[]>([]);
const isLoadingWO = ref(false);
const selectedShellId = ref<string>('0');
const selectedShellSizeId = ref<string>('0');
const itemsProgressMap = ref<Record<number, { shipped: number; target: number }>>({});

// Return Dialog state
const isReturnDialogOpen = ref(false);
const returnDescription = ref('');
const selectedReturnFile = ref<File | null>(null);
const returnFileRef = ref<HTMLInputElement | null>(null);
const isSubmittingReturn = ref(false);
const returnWoId = ref<number | null>(null);



const fetchWOProgress = async () => {
    if (!selectedItemForProgress.value || !selectedItemForProgress.value.id_wo) {
        woDetail.value = null;
        productionSummary.value = [];
        return;
    }
    isLoadingWO.value = true;
    try {
        const woId = selectedItemForProgress.value.id_wo;
        woDetail.value = await getWorkOrderById(woId);
        const res = await getProductionSummary({ id_wo: woId, limit: 100 });
        productionSummary.value = res.items || [];
    } catch (e) {
        console.error("Gagal fetch progress WO:", e);
        toast.error("Gagal memuat detail progress produksi.");
    } finally {
        isLoadingWO.value = false;
    }
};

const fetchItemsProgress = async () => {
    if (!detail.value || !detail.value.items) return;
    for (const item of detail.value.items) {
        if (item.id_wo) {
            try {
                const res = await getProductionSummary({ id_wo: item.id_wo, limit: 100 });
                let target = 0;
                let shipped = 0;
                if (res && res.items) {
                    res.items.forEach((p: any) => {
                        target += p.target_qty || 0;
                        shipped += p.production?.shipped || 0;
                    });
                }
                itemsProgressMap.value[item.id_wo] = { shipped, target };
            } catch (e) {
                console.error(`Gagal fetch progress untuk WO ${item.id_wo}:`, e);
            }
        }
    }
};

const fetchDetail = async () => {
    isLoading.value = true;
    try {
        const data = await getPOClientById(id.value);
        detail.value = data;
        
        if (detail.value && detail.value.items && detail.value.items.length > 0) {
            selectedItemForProgress.value = detail.value.items[0];
            await fetchWOProgress();
            await fetchItemsProgress();
        }
    } catch (e) {
        console.error("Gagal fetch PO Client detail:", e);
    } finally {
        isLoading.value = false;
    }
};

const formatPrice = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR', minimumFractionDigits: 0
    }).format(val);
};

const grandTotal = computed(() => {
    if (!detail.value || !detail.value.items) return 0;
    return detail.value.items.reduce((acc, curr) => acc + (curr.qty * curr.price), 0);
});

const totalQty = computed(() => {
    if (!detail.value || !detail.value.items) return 0;
    return detail.value.items.reduce((acc, curr) => acc + curr.qty, 0);
});

const shellOptions = computed(() => {
    if (!woDetail.value || !woDetail.value.shells) return [];
    return woDetail.value.shells.map((s: any) => ({
        label: `${s.fabric} - ${s.color}`,
        value: String(s.id_wo_shell)
    }));
});

const shellSizeOptions = computed(() => {
    if (!woDetail.value || selectedShellId.value === '0') return [];
    const shell = woDetail.value.shells.find((s: any) => String(s.id_wo_shell) === selectedShellId.value);
    if (!shell || !shell.sizes) return [];
    return shell.sizes.map((sz: any) => ({
        label: `Size ${sz.size}`,
        value: String(sz.id_wo_shell_size)
    }));
});

const progressProps = computed(() => {
    if (!woDetail.value) return { target: 0, cutting: 0, sewing: 0, qcPass: 0, packing: 0, shipped: 0 };
    
    if (selectedShellId.value === '0') {
        let target = 0;
        let cutting = 0;
        let sewing = 0;
        let qcPass = 0;
        let packing = 0;
        let shipped = 0;
        productionSummary.value.forEach((item: any) => {
            target += item.target_qty || 0;
            if (item.production) {
                cutting += item.production.cutting || 0;
                sewing += item.production.sewing || 0;
                qcPass += item.production.qc_pass || 0;
                packing += item.production.packing || 0;
                shipped += item.production.shipped || 0;
            }
        });
        return { target, cutting, sewing, qcPass, packing, shipped };
    }

    if (selectedShellSizeId.value === '0') {
        const shell = woDetail.value.shells.find((s: any) => String(s.id_wo_shell) === selectedShellId.value);
        if (!shell) return { target: 0, cutting: 0, sewing: 0, qcPass: 0, packing: 0, shipped: 0 };
        
        const sizeIds = shell.sizes.map((sz: any) => sz.id_wo_shell_size);
        let target = 0;
        let cutting = 0;
        let sewing = 0;
        let qcPass = 0;
        let packing = 0;
        let shipped = 0;
        
        productionSummary.value.forEach((item: any) => {
            if (sizeIds.includes(item.id_wo_shell_size)) {
                target += item.target_qty || 0;
                if (item.production) {
                    cutting += item.production.cutting || 0;
                    sewing += item.production.sewing || 0;
                    qcPass += item.production.qc_pass || 0;
                    packing += item.production.packing || 0;
                    shipped += item.production.shipped || 0;
                }
            }
        });
        return { target, cutting, sewing, qcPass, packing, shipped };
    }

    const summary = productionSummary.value.find((item: any) => String(item.id_wo_shell_size) === selectedShellSizeId.value);
    if (!summary) return { target: 0, cutting: 0, sewing: 0, qcPass: 0, packing: 0, shipped: 0 };
    return {
        target: summary.target_qty || 0,
        cutting: summary.production?.cutting || 0,
        sewing: summary.production?.sewing || 0,
        qcPass: summary.production?.qc_pass || 0,
        packing: summary.production?.packing || 0,
        shipped: summary.production?.shipped || 0
    };
});

const shellSizesProgressList = computed(() => {
    if (!woDetail.value || selectedShellId.value === '0') return [];
    const shell = woDetail.value.shells.find((s: any) => String(s.id_wo_shell) === selectedShellId.value);
    if (!shell) return [];
    return shell.sizes.map((sz: any) => {
        const summary = productionSummary.value.find((s: any) => s.id_wo_shell_size === sz.id_wo_shell_size);
        const target = sz.qty;
        const shipped = summary?.production?.shipped || 0;
        const cutting = summary?.production?.cutting || 0;
        const sewing = summary?.production?.sewing || 0;
        const qc = summary?.production?.qc_pass || 0;
        const packing = summary?.production?.packing || 0;
        
        const sum = cutting + sewing + qc + packing + shipped;
        const pct = target > 0 ? parseFloat(Math.min((sum / (5 * target)) * 100, 100).toFixed(1)) : 0;
        const shippedPct = target > 0 ? parseFloat(Math.min((shipped / target) * 100, 100).toFixed(1)) : 0;

        return {
            id_wo_shell_size: sz.id_wo_shell_size,
            size: sz.size,
            target,
            shipped,
            pct,
            shippedPct,
            status: summary?.status || 'open'
        };
    });
});

const isItemEligibleForActions = (item: any) => {
    if (!item.id_wo) return false;
    const progress = itemsProgressMap.value[item.id_wo];
    return progress && progress.shipped >= progress.target && progress.target > 0;
};

const handleCloseWO = async (woId: number) => {
    if (!confirm("Apakah Anda yakin ingin menandai Work Order ini selesai? Status dokumen akan dikunci.")) return;
    try {
        await clientCloseWorkOrder(woId);
        toast.success("Work Order berhasil ditandai selesai.");
        await fetchDetail();
    } catch (e: any) {
        toast.error(e.response?.data?.message || "Gagal menutup Work Order.");
    }
};

const openReturnDialog = (woId: number) => {
    returnWoId.value = woId;
    returnDescription.value = '';
    selectedReturnFile.value = null;
    if (returnFileRef.value) {
        returnFileRef.value.value = '';
    }
    isReturnDialogOpen.value = true;
};

const closeReturnDialog = () => {
    isReturnDialogOpen.value = false;
    returnWoId.value = null;
};

const handleReturnFileChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        selectedReturnFile.value = target.files[0] || null;
    } else {
        selectedReturnFile.value = null;
    }
};

const submitReturn = async () => {
    if (!returnWoId.value || !selectedReturnFile.value) {
        toast.error("Deskripsi dan berkas bukti wajib diisi.");
        return;
    }
    isSubmittingReturn.value = true;
    try {
        const formData = new FormData();
        formData.append("file", selectedReturnFile.value);
        formData.append("deskripsi", returnDescription.value);
        await submitWorkOrderReturn(returnWoId.value, formData);
        toast.success("Pengajuan retur berhasil dikirim.");
        closeReturnDialog();
        await fetchDetail();
    } catch (e: any) {
        toast.error(e.response?.data?.message || "Gagal mengirim pengajuan retur.");
    } finally {
        isSubmittingReturn.value = false;
    }
};



const handleSelectItemChange = (itemId: number) => {
    if (!detail.value || !detail.value.items) return;
    const found = detail.value.items.find((item: any) => item.id_po_client_item === itemId);
    if (found) {
        selectedItemForProgress.value = found;
        fetchWOProgress();
    }
};

onMounted(() => {
    fetchDetail();
});
</script>

<template>
    <div class="container mx-auto py-8 max-w-5xl">
        <div v-if="isLoading" class="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <Spinner class="size-8" />
            <p class="text-neutral-500 animate-pulse text-sm">Memuat dokumen PO Client...</p>
        </div>

        <div v-else-if="detail">
            <!-- Header Section -->
            <div class="flex flex-col md:flex-row gap-6 items-center mb-8 border-b pb-6 border-neutral-200">
                <div class="bg-neutral-100 p-4 rounded-2xl border border-neutral-200 shadow-sm">
                    <FileTextIcon class="w-12 h-12 text-neutral-700" />
                </div>
                
                <div class="flex-1 space-y-1 text-center md:text-left">
                    <div class="flex items-center justify-center md:justify-start gap-2">
                        <h1 class="text-3xl font-bold tracking-tight text-neutral-900">{{ detail.po_number }}</h1>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200">
                            Purchase Order Client
                        </span>
                    </div>
                    <div class="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-neutral-500">
                        <span class="flex items-center gap-1.5 font-medium">
                            Mitra: <span class="text-neutral-800">{{ detail.mitra_name }}</span>
                        </span>
                        <span>•</span>
                        <span class="flex items-center gap-1.5">
                            Tanggal: {{ formatDate(detail.tanggal) }}
                        </span>
                    </div>
                </div>

                <div class="flex gap-2 w-full md:w-auto">
                    <Button @click="router.history.back()" variant="outline" class="flex-1 md:flex-none border-neutral-300">
                        <ArrowLeftIcon class="w-4 h-4 mr-2" /> Kembali
                    </Button>
                    <Button 
                        v-if="canCreateOrEdit" 
                        @click="router.navigate({ to: '/po-client/edit/$id', params: { id: String(detail.id_po_client) } })" 
                        variant="edit"
                        class="flex-1 md:flex-none flex items-center gap-2"
                    >
                        <PencilIcon class="w-4 h-4" /> Edit PO
                    </Button>
                </div>
            </div>

            <!-- Content Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Main Info and Nested Tables -->
                <div class="md:col-span-2 space-y-6">
                    <!-- PO Header Info Card -->
                    <Card class="overflow-hidden border border-neutral-200 shadow-sm bg-white">
                        <CardHeader class="bg-neutral-50/50 border-b border-neutral-200 pb-4">
                            <CardTitle class="text-sm font-bold flex items-center gap-2 text-neutral-900 uppercase tracking-wider">
                                <Info class="w-4 h-4 text-neutral-600" />
                                Header Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="pt-6">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                                <div class="space-y-1">
                                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">PO Number</p>
                                    <p class="text-lg font-bold text-neutral-950">{{ detail.po_number }}</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Season</p>
                                    <p class="text-lg font-medium text-neutral-900">{{ detail.season || '-' }}</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tanggal Order</p>
                                    <p class="font-medium text-neutral-900">{{ formatDate(detail.tanggal) }}</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Delivery Date</p>
                                    <p class="font-medium text-neutral-900">{{ formatDate(detail.delivery) }}</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Payment Term</p>
                                    <p class="font-medium text-neutral-900">{{ detail.payment_term || '-' }}</p>
                                </div>
                                <div class="space-y-1" v-if="detail.file">
                                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Attached File</p>
                                    
                                    <!-- PDF base64 format -->
                                    <div v-if="detail.file.startsWith('data:application/pdf;base64,')" class="flex items-center gap-2 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-250">
                                        <a :href="detail.file" download="attached_po_document.pdf" class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100/80 border border-red-200/60 rounded-lg shadow-xs transition-all">
                                            <FileTextIcon class="w-4 h-4 text-red-600 animate-pulse" /> Download PDF Document
                                        </a>
                                    </div>
                                    
                                    <!-- Image base64 format -->
                                    <div v-else-if="detail.file.startsWith('data:image/')" class="mt-2 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-250">
                                        <a :href="detail.file" download="attached_po_image.png" class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/60 rounded-lg shadow-xs transition-all mb-1">
                                            <ImageIcon class="w-4 h-4 text-blue-600" /> Download Attachment Image
                                        </a>
                                        <div class="relative group max-w-[280px] rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50 shadow-sm transition-all hover:shadow-md">
                                            <img :src="detail.file" alt="Attached PO Document" class="w-full h-auto object-cover max-h-[180px] group-hover:scale-[1.02] transition-all duration-300" />
                                        </div>
                                    </div>
                                    
                                    <!-- Generic Fallback generic file string -->
                                    <div v-else class="flex items-center gap-2 mt-1.5">
                                        <a :href="detail.file" download class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg shadow-xs transition-all">
                                            <PaperclipIcon class="w-3.5 h-3.5 text-neutral-500" /> Download File
                                        </a>
                                        <span class="text-xs text-neutral-500 truncate max-w-[200px]">{{ detail.file }}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <!-- Nested Items List Card -->
                    <Card class="overflow-hidden border border-neutral-200 shadow-sm bg-white">
                        <CardHeader class="bg-neutral-50/50 border-b border-neutral-200 pb-4">
                            <CardTitle class="text-sm font-bold flex items-center gap-2 text-neutral-900 uppercase tracking-wider">
                                <DollarSign class="w-4 h-4 text-neutral-600" />
                                Ordered Items ({{ detail.items?.length || 0 }})
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="p-0 border-t border-neutral-200">
                            <div class="overflow-x-auto">
                                <table class="w-full text-left border-collapse text-xs">
                                    <thead class="bg-neutral-50/50 text-neutral-600 font-semibold border-b border-neutral-200">
                                        <tr>
                                            <th class="p-4 w-[20%]">Style / Model</th>
                                            <th class="p-4 w-[15%]">Colour</th>
                                            <th class="p-4 text-center w-[10%]">Qty</th>
                                            <th class="p-4 text-right w-[15%]">Unit Price</th>
                                            <th class="p-4 text-right w-[15%]">Total Price</th>
                                            <th class="p-4 text-center w-[25%]">Status / Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="item in detail.items" :key="item.id_po_client_item" class="border-b border-neutral-200 last:border-0 hover:bg-neutral-50/20 text-neutral-900">
                                            <td class="p-4 font-semibold">
                                                <div>{{ item.style }}</div>
                                                <div class="text-[10px] text-neutral-500 font-normal mt-0.5" v-if="item.description">
                                                    {{ item.description }}
                                                </div>
                                            </td>
                                            <td class="p-4">{{ item.colour }}</td>
                                            <td class="p-4 text-center font-mono font-medium">{{ item.qty }}</td>
                                            <td class="p-4 text-right font-mono">{{ formatPrice(item.price) }}</td>
                                            <td class="p-4 text-right font-mono font-semibold">{{ formatPrice(item.qty * item.price) }}</td>
                                            <td class="p-4 text-center">
                                                <!-- If WO not configured yet -->
                                                <span v-if="!item.id_wo" class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">
                                                    Menunggu Konfigurasi WO
                                                </span>
                                                <div v-else class="flex flex-col items-center gap-1">
                                                    <!-- Status badges -->
                                                    <div class="flex items-center gap-1.5 justify-center">
                                                        <span v-if="item.wo_status === 'closed'" class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800 border border-green-200">
                                                            Selesai (Closed)
                                                        </span>
                                                        <span v-else-if="item.wo_status === 'client_closed'" class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                                            Menunggu Verifikasi Admin
                                                        </span>
                                                        <span v-else class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                                            Produksi (Open)
                                                        </span>

                                                        <span v-if="item.has_retur" class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-800 border border-orange-200 animate-pulse">
                                                            Retur Diajukan
                                                        </span>
                                                    </div>

                                                    <!-- Progress percentage -->
                                                    <div v-if="item.id_wo" class="w-36 mt-1 text-left">
                                                        <!-- <ProductionProgressBar 
                                                            :target="itemsProgressMap[item.id_wo]?.target ?? 0" 
                                                            :cutting="0" 
                                                            :sewing="0" 
                                                            :qc-pass="0" 
                                                            :packing="0" 
                                                            :shipped="itemsProgressMap[item.id_wo]?.shipped ?? 0" 
                                                            :show-overall-only="true" 
                                                        /> -->
                                                    </div>

                                                    <!-- Actions (only when WO is open, is 100% shipped, and user is client or has client close permission) -->
                                                    <div v-if="isClient && ['open', 'pending', 'approved'].includes((item.wo_status || '').toLowerCase()) && isItemEligibleForActions(item)" class="flex gap-1 mt-1">
                                                        <Button 
                                                            size="sm" 
                                                            variant="default"
                                                            class="h-6 text-[10px] px-1.5 bg-green-600 hover:bg-green-700 text-white font-bold"
                                                            @click="item.id_wo && handleCloseWO(item.id_wo)"
                                                        >
                                                            Selesai
                                                        </Button>
                                                        <Button 
                                                            v-if="!item.has_retur"
                                                            size="sm" 
                                                            variant="destructive"
                                                            class="h-6 text-[10px] px-1.5 font-bold"
                                                            @click="item.id_wo && openReturnDialog(item.id_wo)"
                                                        >
                                                            Retur
                                                        </Button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        <!-- Subtotals -->
                                        <tr class="bg-neutral-50/55 border-t-2 border-neutral-200 font-semibold text-neutral-950">
                                            <td colspan="2" class="p-4 text-right text-xs uppercase tracking-wider border-r border-neutral-200">Grand Totals:</td>
                                            <td class="p-4 text-center font-mono border-r border-neutral-200">{{ totalQty }} Items</td>
                                            <td class="border-r border-neutral-200"></td>
                                            <td class="p-4 text-right font-mono text-sm font-bold border-r border-neutral-200">{{ formatPrice(grandTotal) }}</td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    <!-- Detailed Production Progress Dashboard -->
                    <Card v-if="selectedItemForProgress" class="overflow-hidden border border-neutral-200 shadow-sm bg-white">
                        <CardHeader class="bg-neutral-50/50 border-b border-neutral-200 pb-4">
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <CardTitle class="text-sm font-bold flex items-center gap-2 text-neutral-900 uppercase tracking-wider">
                                    <FactoryIcon class="w-4 h-4 text-neutral-600" />
                                    Production Monitoring
                                </CardTitle>
                                <!-- PO Item Selector -->
                                <div class="flex items-center gap-2">
                                    <span class="text-xs text-neutral-500 font-semibold">Pilih Item PO:</span>
                                    <select 
                                        :value="selectedItemForProgress?.id_po_client_item"
                                        @change="e => {
                                            const itemId = Number((e.target as HTMLSelectElement).value);
                                            handleSelectItemChange(itemId);
                                        }"
                                        class="text-xs p-1.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white font-medium"
                                    >
                                        <option 
                                            v-for="item in detail?.items" 
                                            :key="item.id_po_client_item" 
                                            :value="item.id_po_client_item"
                                        >
                                            {{ item.style }} ({{ item.colour }})
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent class="p-6">
                            <div v-if="isLoadingWO" class="flex flex-col items-center justify-center py-12 gap-3">
                                <Spinner class="size-6 text-neutral-500" />
                                <p class="text-xs text-neutral-400">Memuat progres produksi...</p>
                            </div>
                            <div v-else-if="!woDetail" class="flex flex-col items-center justify-center py-12 text-center space-y-2">
                                <Info class="w-8 h-8 text-neutral-300" />
                                <p class="text-sm font-bold text-neutral-700">Progres Belum Tersedia</p>
                                <p class="text-xs text-neutral-500 max-w-sm">
                                    Draft Work Order untuk item ini belum dikonfigurasi oleh Admin Produksi.
                                </p>
                            </div>
                            <div v-else class="space-y-6">
                                <!-- Filter Dropdowns -->
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div class="space-y-1">
                                        <label class="text-xs font-bold text-neutral-500 uppercase tracking-wider">Filter Work Order Shell</label>
                                        <select 
                                            v-model="selectedShellId"
                                            @change="selectedShellSizeId = '0'"
                                            class="w-full text-xs p-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white font-medium shadow-sm"
                                        >
                                            <option value="0">Semua Fabric & Color (Global)</option>
                                            <option v-for="opt in shellOptions" :key="opt.value" :value="opt.value">
                                                {{ opt.label }}
                                            </option>
                                        </select>
                                    </div>
                                    <div class="space-y-1">
                                        <label class="text-xs font-bold text-neutral-500 uppercase tracking-wider">Filter Shell Size</label>
                                        <select 
                                            v-model="selectedShellSizeId"
                                            :disabled="selectedShellId === '0'"
                                            class="w-full text-xs p-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white font-medium shadow-sm disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed"
                                        >
                                            <option value="0">Semua Ukuran (Shell Global)</option>
                                            <option v-for="opt in shellSizeOptions" :key="opt.value" :value="opt.value">
                                                {{ opt.label }}
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Progress Output -->
                                <div class="pt-4 border-t border-neutral-100">
                                    <!-- Case 1: Overall Summary (No shell selected OR shell + size selected) -->
                                    <div v-if="selectedShellId === '0' || selectedShellSizeId !== '0'">
                                        <ProductionProgressBar 
                                            :target="progressProps.target"
                                            :cutting="progressProps.cutting"
                                            :sewing="progressProps.sewing"
                                            :qc-pass="progressProps.qcPass"
                                            :packing="progressProps.packing"
                                            :shipped="progressProps.shipped"
                                            :show-overall-only="selectedShellId === '0'"
                                        />
                                    </div>

                                    <!-- Case 2: Shell Selected, size NOT selected -> Show sizes list progress -->
                                    <div v-else class="space-y-4">
                                        <div class="flex items-center justify-between">
                                            <h5 class="text-xs font-bold uppercase tracking-wider text-neutral-500">Progress tiap Ukuran (Shell Sizes)</h5>
                                            <span class="text-xs text-neutral-400 font-medium">Klik filter ukuran di atas untuk melihat rincian per divisi</span>
                                        </div>
                                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div 
                                                v-for="sz in shellSizesProgressList" 
                                                :key="sz.id_wo_shell_size"
                                                @click="selectedShellSizeId = String(sz.id_wo_shell_size)"
                                                class="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 cursor-pointer shadow-xs transition-all hover:border-neutral-300"
                                            >
                                                <div class="flex items-center justify-between mb-2">
                                                    <span class="text-sm font-bold text-neutral-800">Size {{ sz.size }}</span>
                                                    <span class="text-xs font-bold text-neutral-500">
                                                        {{ formatNumber(sz.shipped) }} / {{ formatNumber(sz.target) }} <span class="text-[10px] font-normal">pcs</span>
                                                    </span>
                                                </div>
                                                <div class="space-y-1.5">
                                                    <div class="flex items-center justify-between text-[10px] text-neutral-500">
                                                        <span>Shipped Progress</span>
                                                        <span class="font-bold">{{ sz.shippedPct }}%</span>
                                                    </div>
                                                    <div class="h-2 bg-neutral-200 rounded-full overflow-hidden">
                                                        <div 
                                                            class="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                                                            :style="{ width: `${sz.shippedPct}%` }"
                                                        ></div>
                                                    </div>
                                                    <div class="flex items-center justify-between text-[10px] text-neutral-400 pt-1 border-t border-neutral-100">
                                                        <span>Weighted Completion</span>
                                                        <span class="font-semibold">{{ sz.pct }}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <!-- Sidebar / PIC Info and metadata -->
                <div class="space-y-6">
                    <!-- Penanggung Jawab CARD -->
                    <Card class="border border-neutral-200 shadow-sm bg-white">
                        <CardHeader class="bg-neutral-50/50 border-b border-neutral-200 pb-4">
                            <CardTitle class="text-xs font-bold text-neutral-950 uppercase tracking-wider flex items-center gap-2">
                                <UserIcon class="w-4 h-4 text-neutral-600" />
                                Penanggung Jawab (PIC)
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="pt-6 space-y-6">
                            <div v-for="(pic, idx) in detail.penanggung_jawab" :key="idx" class="space-y-3 bg-neutral-50/50 p-3 rounded-lg border border-neutral-200">
                                <div class="space-y-1">
                                    <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Nama Lengkap</p>
                                    <p class="text-sm font-bold text-neutral-900">{{ pic.nama }}</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">No. Telepon</p>
                                    <div class="flex items-center gap-1.5 text-xs text-neutral-700">
                                        <Phone class="w-3.5 h-3.5 text-neutral-400" />
                                        <span>{{ pic.no_telp }}</span>
                                    </div>
                                </div>
                                <div class="space-y-1" v-if="pic.email">
                                    <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Email</p>
                                    <div class="flex items-center gap-1.5 text-xs text-neutral-700">
                                        <Mail class="w-3.5 h-3.5 text-neutral-400" />
                                        <span>{{ pic.email }}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <!-- Metadata Card -->
                    <Card class="border border-neutral-200 shadow-sm bg-white">
                        <CardHeader class="bg-neutral-50/50 border-b border-neutral-200 pb-4">
                            <CardTitle class="text-xs font-bold text-neutral-900 uppercase tracking-wider">Document Metadata</CardTitle>
                        </CardHeader>
                        <CardContent class="pt-6 space-y-4 text-xs text-neutral-700">
                            <div class="flex items-center justify-between">
                                <span class="text-neutral-500 flex items-center gap-2">
                                    <Calendar class="w-3.5 h-3.5 text-neutral-400" /> Created At
                                </span>
                                <span class="font-medium text-neutral-900">{{ formatDate(detail.created_at) }}</span>
                            </div>
                            <Separator />
                            <div class="flex items-center justify-between">
                                <span class="text-neutral-500 flex items-center gap-2">
                                    <Hash class="w-3.5 h-3.5 text-neutral-400" /> Document ID
                                </span>
                                <span class="font-mono text-neutral-900">#{{ detail.id_po_client }}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>

        <div v-else class="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
            <div class="bg-neutral-100 p-4 rounded-full border border-neutral-200">
                <FileTextIcon class="w-12 h-12 text-neutral-400" />
            </div>
            <h2 class="text-2xl font-bold text-neutral-900">Dokumen Tidak Ditemukan</h2>
            <p class="text-neutral-500">Maaf, data dokumen Purchase Order yang Anda cari tidak tersedia.</p>
            <Button @click="router.navigate({ to: '/po-client' })" class="bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm border border-neutral-800">
                Kembali ke Daftar PO
            </Button>
        </div>

        <!-- Return Request Dialog -->
        <div v-if="isReturnDialogOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div class="bg-white rounded-2xl border border-neutral-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div class="p-6 border-b border-neutral-100 bg-neutral-50/50">
                    <h3 class="text-lg font-bold text-neutral-900">Ajukan Pengembalian (Retur)</h3>
                    <p class="text-xs text-neutral-500 mt-1">Silakan isi formulir pengembalian barang reject di bawah ini.</p>
                </div>
                <form @submit.prevent="submitReturn">
                    <div class="p-6 space-y-4">
                        <div class="space-y-1.5">
                            <label class="text-xs font-bold uppercase tracking-wider text-neutral-500">Deskripsi Alasan Retur</label>
                            <textarea 
                                v-model="returnDescription"
                                required
                                rows="4" 
                                placeholder="Jelaskan alasan pengembalian barang reject dengan detail (contoh: reject jahitan lengan, noda kain)..."
                                class="w-full text-sm p-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-neutral-900"
                            ></textarea>
                        </div>
                        <div class="space-y-1.5">
                            <label class="text-xs font-bold uppercase tracking-wider text-neutral-500">Unggah Berkas Bukti (PDF / Image)</label>
                            <div class="relative border border-dashed border-neutral-300 rounded-lg p-4 bg-neutral-50/30 text-center hover:bg-neutral-50 transition-all cursor-pointer">
                                <input 
                                    type="file" 
                                    ref="returnFileRef"
                                    required
                                    accept="image/*,application/pdf"
                                    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    @change="handleReturnFileChange"
                                />
                                <div class="space-y-1">
                                    <PaperclipIcon class="w-8 h-8 text-neutral-400 mx-auto" />
                                    <p class="text-xs font-semibold text-neutral-700">
                                        {{ selectedReturnFile ? selectedReturnFile.name : 'Pilih Berkas atau Tarik Kemari' }}
                                    </p>
                                    <p class="text-[10px] text-neutral-400">PDF, JPG, PNG hingga 5MB</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="p-6 border-t border-neutral-100 bg-neutral-50/50 flex justify-end gap-3">
                        <Button type="button" variant="outline" @click="closeReturnDialog" :disabled="isSubmittingReturn">
                            Batal
                        </Button>
                        <Button type="submit" :disabled="isSubmittingReturn" class="bg-neutral-900 hover:bg-neutral-800 text-white font-bold">
                            {{ isSubmittingReturn ? 'Mengirim...' : 'Kirim Pengajuan' }}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>
