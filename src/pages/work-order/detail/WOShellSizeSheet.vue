<script setup lang="ts">
import { ref, computed } from 'vue';
import { Layers2Icon, ClipboardListIcon } from 'lucide-vue-next';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { parseToInt } from '@/lib/number';
import { toast } from 'vue-sonner';

import type { WorkOrderShell, WorkOrderShellSize } from '@/api/work-orders/work-orders';
import { createFactoryReport } from '@/api/production/production';
import type { ProductionAggregateResponse } from '@/schemas/production/production';

const props = defineProps<{
    isOpen: boolean;
    shell: WorkOrderShell | null;
    productionSummary: ProductionAggregateResponse[];
}>();

const emit = defineEmits<{
    (e: 'update:isOpen', value: boolean): void;
    (e: 'report-submitted'): void;
}>();

const totalQty = (shell: WorkOrderShell) =>
    shell.sizes.reduce((acc, s) => acc + s.qty, 0);

// Report state
const isReportDialogOpen = ref(false);
const selectedSize = ref<WorkOrderShellSize | null>(null);
const reportDate = ref('');
const reportQty = ref<string>('');
const reportDivision = ref('cutting');
const isSubmittingReport = ref(false);

const selectedProductionItem = computed(() => {
    if (!props.productionSummary || !selectedSize.value) return null;
    return props.productionSummary.find(
        (item) => item.id_wo_shell_size === selectedSize.value?.id_wo_shell_size
    ) || null;
});

const maxQty = computed(() => {
    const item = selectedProductionItem.value;
    if (!item) return null;
    
    switch (reportDivision.value) {
        case 'cutting':
            return item.target_qty;
        case 'sewing':
            return item.production?.cutting ?? 0;
        case 'qc-finish':
            return item.production?.sewing ?? 0;
        case 'packing':
            return item.production?.qc_pass ?? 0;
        case 'pengiriman':
            return item.production?.packing ?? 0;
        default:
            return null;
    }
});

const prevDivisionLabel = computed(() => {
    switch (reportDivision.value) {
        case 'cutting':
            return 'Target Work Order';
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

const openReportDialog = (size: WorkOrderShellSize) => {
    selectedSize.value = size;
    reportQty.value = '';
    reportDate.value = new Date().toISOString().split('T')[0] || '';
    reportDivision.value = 'cutting';
    isReportDialogOpen.value = true;
};

const submitReport = async () => {
    if (!selectedSize.value) return;
    if (!reportDate.value) {
        toast.error('Harap isi Tanggal laporan.');
        return;
    }
    const qtyVal = parseToInt(reportQty.value);
    if (reportQty.value === '' || qtyVal <= 0) {
        toast.error('Jumlah QTY harus lebih dari 0.');
        return;
    }

    if (maxQty.value !== null && qtyVal > maxQty.value) {
        toast.error(
            `QTY tidak boleh melebihi output ${prevDivisionLabel.value}: ${maxQty.value.toLocaleString('id-ID')} pcs.`
        );
        return;
    }

    isSubmittingReport.value = true;
    try {
        await createFactoryReport(reportDivision.value, {
            id_wo_shell_size: selectedSize.value.id_wo_shell_size,
            qty: qtyVal,
            tanggal: reportDate.value,
        });
        toast.success('Laporan produksi berhasil ditambahkan!');
        isReportDialogOpen.value = false;
        emit('report-submitted');
    } catch (error: any) {
        const msg = error?.response?.data?.message || 'Gagal menambahkan laporan produksi.';
        toast.error(msg);
    } finally {
        isSubmittingReport.value = false;
    }
};
</script>

<template>
    <Sheet :open="props.isOpen" @update:open="emit('update:isOpen', $event)">
        <SheetContent side="right" class="w-full sm:max-w-lg flex flex-col p-0 gap-0">
            <SheetHeader class="px-6 pt-6 pb-4 border-b border-neutral-200 bg-neutral-50/60">
                <div class="flex items-center gap-3">
                    <div class="bg-white border border-neutral-200 rounded-lg p-2 shadow-xs">
                        <Layers2Icon class="w-5 h-5 text-neutral-600" />
                    </div>
                    <div>
                        <SheetTitle class="text-base font-bold text-neutral-900">
                            {{ shell?.fabric || 'Shell' }} — {{ shell?.color || '' }}
                        </SheetTitle>
                        <SheetDescription class="text-xs text-neutral-500 mt-0.5">
                            Distribusi ukuran &amp; rasio untuk shell kain ini
                        </SheetDescription>
                    </div>
                </div>
            </SheetHeader>

            <!-- Shell Meta Info -->
            <div class="px-6 py-4 grid grid-cols-3 gap-4 border-b border-neutral-100 bg-white">
                <div>
                    <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Consumption</p>
                    <p class="font-mono font-semibold text-neutral-800 text-sm mt-0.5">{{ shell?.cons }} yd</p>
                </div>
                <div>
                    <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Allowance</p>
                    <p class="font-mono font-semibold text-neutral-800 text-sm mt-0.5">{{ shell?.allow }}%</p>
                </div>
                <div>
                    <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Berat / Yd</p>
                    <p class="font-mono font-semibold text-neutral-800 text-sm mt-0.5">{{ shell?.berat_1_yd }} kg</p>
                </div>
            </div>

            <!-- Sizes Table -->
            <div class="flex-1 overflow-y-auto px-6 py-4">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                        Size Chart
                    </h3>
                    <span v-if="shell" class="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full">
                        Total: {{ totalQty(shell).toLocaleString('id-ID') }} pcs
                    </span>
                </div>

                <div v-if="!shell?.sizes || shell.sizes.length === 0"
                    class="text-center py-12 text-neutral-400 text-sm">
                    Tidak ada data ukuran.
                </div>

                <div v-else class="border border-neutral-200 rounded-xl overflow-hidden">
                    <table class="w-full text-left border-collapse text-sm">
                        <thead class="bg-neutral-50 border-b border-neutral-200">
                            <tr>
                                <th class="px-4 py-2.5 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Size</th>
                                <th class="px-4 py-2.5 text-[11px] font-bold text-neutral-500 uppercase tracking-wider text-right">Qty (pcs)</th>
                                <th class="px-4 py-2.5 text-[11px] font-bold text-neutral-500 uppercase tracking-wider text-right">Ratio</th>
                                <th class="px-4 py-2.5 text-[11px] font-bold text-neutral-500 uppercase tracking-wider text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-neutral-100">
                            <tr
                                v-for="size in shell.sizes"
                                :key="size.id_wo_shell_size"
                                class="hover:bg-neutral-50/60 transition-colors"
                            >
                                <td class="px-4 py-3 font-semibold text-neutral-900">
                                    <span class="inline-flex items-center px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 text-xs font-bold">
                                        {{ size.size }}
                                    </span>
                                </td>
                                <td class="px-4 py-3 font-mono font-medium text-neutral-800 text-right">
                                    {{ size.qty.toLocaleString('id-ID') }}
                                </td>
                                <td class="px-4 py-3 font-mono text-neutral-500 text-right">
                                    {{ size.ratio }}
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        class="h-7 px-2.5 text-[10px] font-semibold text-[#10756e] border-[#10756e] hover:bg-[#10756e]/10 transition-colors rounded"
                                        @click="openReportDialog(size)"
                                    >
                                        + Lapor
                                    </Button>
                                </td>
                            </tr>
                        </tbody>
                        <!-- Footer Total -->
                        <tfoot class="bg-neutral-50 border-t-2 border-neutral-200">
                            <tr>
                                <td class="px-4 py-2.5 text-xs font-bold text-neutral-600 uppercase tracking-wider">Total</td>
                                <td class="px-4 py-2.5 font-mono font-bold text-neutral-900 text-right text-sm">
                                    {{ shell ? totalQty(shell).toLocaleString('id-ID') : 0 }}
                                </td>
                                <td class="px-4 py-2.5 font-mono text-neutral-400 text-right text-xs">
                                    —
                                </td>
                                <td class="px-4 py-2.5 text-center text-xs font-mono text-neutral-400">
                                    —
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </SheetContent>
    </Sheet>

    <!-- Dialog for Adding Production Report -->
    <Dialog :open="isReportDialogOpen" @update:open="isReportDialogOpen = $event">
        <DialogContent class="sm:max-w-md bg-white border border-neutral-200 shadow-xl rounded-xl p-6">
            <DialogHeader class="space-y-1.5">
                <DialogTitle class="text-lg font-bold text-neutral-900 flex items-center gap-2">
                    <ClipboardListIcon class="w-5 h-5 text-[#10756e]" />
                    Tambah Laporan Produksi
                </DialogTitle>
                <DialogDescription class="text-xs text-neutral-500">
                    Input hasil produksi harian untuk ukuran <strong class="text-neutral-700">{{ selectedSize?.size }}</strong>.
                </DialogDescription>
            </DialogHeader>

            <div class="mt-4 space-y-4">
                <!-- Division Select -->
                <div class="space-y-1.5">
                    <Label class="text-xs font-semibold text-neutral-700">Divisi Pengerjaan <span class="text-red-500">*</span></Label>
                    <select
                        v-model="reportDivision"
                        class="w-full h-9 rounded-md border border-neutral-200 bg-white pl-3 pr-9 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 appearance-none cursor-pointer"
                    >
                        <option value="cutting">Cutting (Potong Kain)</option>
                        <option value="sewing">Sewing (Jahit)</option>
                        <option value="qc-finish">QC Finish (Cek Kualitas)</option>
                        <option value="packing">Packing (Kemas)</option>
                        <option value="pengiriman">Pengiriman (Kirim)</option>
                    </select>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <!-- Date Input -->
                    <div class="space-y-1.5">
                        <Label class="text-xs font-semibold text-neutral-700">Tanggal Laporan <span class="text-red-500">*</span></Label>
                        <Input
                            v-model="reportDate"
                            type="date"
                            class="h-9 text-sm border-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-800 bg-white"
                        />
                    </div>

                    <!-- Qty Input -->
                    <div class="space-y-1.5">
                        <Label class="text-xs font-semibold text-neutral-700">Jumlah Qty (pcs) <span class="text-red-500">*</span></Label>
                        <Input
                            v-model="reportQty"
                            type="text"
                            placeholder="Qty pcs"
                            class="h-9 text-sm border-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-800 bg-white animate-none"
                        />
                    </div>
                </div>

                <!-- Max Qty Helper -->
                <div v-if="maxQty !== null" class="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xs text-neutral-600">
                    Batas Maksimal QTY: <strong class="text-[#10756e] font-mono text-sm">{{ maxQty.toLocaleString('id-ID') }}</strong> pcs
                    <span class="block text-[10px] text-neutral-400 mt-0.5">Berdasarkan {{ prevDivisionLabel }}.</span>
                </div>
            </div>

            <div class="mt-6 flex justify-end gap-3 border-t border-neutral-100 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    class="h-9 text-xs border-neutral-300 text-neutral-600 hover:bg-neutral-50"
                    @click="isReportDialogOpen = false"
                >
                    Batal
                </Button>
                <Button
                    type="button"
                    size="sm"
                    class="h-9 text-xs bg-[#10756e] text-white hover:bg-[#1a9188] border border-[#10756e]"
                    :disabled="isSubmittingReport"
                    @click="submitReport"
                >
                    {{ isSubmittingReport ? 'Menyimpan...' : 'Kirim Laporan' }}
                </Button>
            </div>
        </DialogContent>
    </Dialog>
</template>
