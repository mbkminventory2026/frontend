<script setup lang="ts">
import { ref, computed } from 'vue';
import { toast } from 'vue-sonner';
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardListIcon, PackageIcon, TruckIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-vue-next';
import { formatDate } from '@/lib/formatter';
import type { MaterialListItem } from '@/api/work-orders/work-orders';
import { createSuratJalanClient, createReceived } from '@/api/material-list/material-list';

const props = defineProps<{
    isOpen: boolean;
    item: MaterialListItem | null;
    mlName: string;
    buyer: string;
    model: string;
}>();

const emit = defineEmits<{
    (e: 'update:isOpen', value: boolean): void;
    (e: 'refreshed'): void;
}>();

// ─── SJC Form ──────────────────────────────────────────
const sjcTanggal = ref('');
const sjcQty = ref('');
const sjcKeterangan = ref('');
const isSubmittingSJC = ref(false);

const resetSJCForm = () => {
    sjcTanggal.value = '';
    sjcQty.value = '';
    sjcKeterangan.value = '';
};

const submitSJC = async () => {
    if (!props.item) return;
    const qty = parseInt(sjcQty.value);
    if (!sjcTanggal.value || isNaN(qty) || qty <= 0) {
        toast.error('Tanggal dan qty wajib diisi.');
        return;
    }
    isSubmittingSJC.value = true;
    try {
        await createSuratJalanClient({
            tanggal: sjcTanggal.value,
            qty,
            keterangan: sjcKeterangan.value,
            id_material_list_item: props.item.id_material_list_item,
        });
        toast.success('Surat Jalan Client berhasil dibuat.');
        resetSJCForm();
        emit('refreshed');
    } catch {
        toast.error('Gagal membuat Surat Jalan Client.');
    } finally {
        isSubmittingSJC.value = false;
    }
};

// ─── Received Form ─────────────────────────────────────
const recvTanggal = ref('');
const recvQty = ref('');
const recvKeterangan = ref('');
const isSubmittingRecv = ref(false);
const isConfirmOpen = ref(false);

const resetRecvForm = () => {
    recvTanggal.value = '';
    recvQty.value = '';
    recvKeterangan.value = '';
};

const openConfirm = () => {
    if (!props.item) return;
    const qty = parseInt(recvQty.value);
    if (!recvTanggal.value || isNaN(qty) || qty <= 0) {
        toast.error('Tanggal dan qty wajib diisi.');
        return;
    }
    isConfirmOpen.value = true;
};

const confirmReceived = async () => {
    if (!props.item) return;
    const qty = parseInt(recvQty.value);
    isSubmittingRecv.value = true;
    try {
        await createReceived({
            tanggal: recvTanggal.value,
            qty,
            keterangan: recvKeterangan.value,
            id_material_list_item: props.item.id_material_list_item,
        });
        toast.success('Penerimaan berhasil dicatat.');
        isConfirmOpen.value = false;
        resetRecvForm();
        emit('refreshed');
    } catch {
        toast.error('Gagal mencatat penerimaan.');
    } finally {
        isSubmittingRecv.value = false;
    }
};

// ─── Computed progress ─────────────────────────────────
const qtyWo = computed(() => props.item?.qty ?? 0);
const qtySJ = computed(() => props.item?.qty_surat_jalan ?? 0);
const qtyRecv = computed(() => props.item?.qty_received ?? 0);

const progressSJ = computed(() => qtyWo.value > 0 ? Math.min(100, Math.round((qtySJ.value / qtyWo.value) * 100)) : 0);
const progressRecv = computed(() => qtyWo.value > 0 ? Math.min(100, Math.round((qtyRecv.value / qtyWo.value) * 100)) : 0);

const recvQtyNum = computed(() => parseInt(recvQty.value) || 0);
const recvWarning = computed(() => {
    if (!props.item) return null;
    const afterRecv = qtyRecv.value + recvQtyNum.value;
    if (afterRecv > qtySJ.value) return `Qty received (${afterRecv}) melebihi qty surat jalan (${qtySJ.value}).`;
    if (afterRecv > qtyWo.value) return `Qty received (${afterRecv}) melebihi qty WO (${qtyWo.value}).`;
    return null;
});
</script>

<template>
    <Sheet :open="isOpen" @update:open="emit('update:isOpen', $event)">
        <SheetContent class="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader class="mb-4">
                <SheetTitle class="flex items-center gap-2 text-base">
                    <ClipboardListIcon class="w-4 h-4 text-neutral-500" />
                    Detail Material List Item
                </SheetTitle>
                <SheetDescription v-if="item" class="text-xs text-neutral-500">
                    {{ buyer }} — {{ model }} &middot; {{ mlName }}
                </SheetDescription>
            </SheetHeader>

            <div v-if="!item" class="flex items-center justify-center h-40 text-neutral-400 text-sm">
                Pilih item terlebih dahulu.
            </div>

            <template v-else>
                <!-- Detail -->
                <div class="rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-2 text-sm mb-4">
                    <div class="flex justify-between">
                        <span class="text-neutral-500 font-medium">Item</span>
                        <span class="font-semibold text-neutral-900">{{ item.item }}</span>
                    </div>
                    <div v-if="item.description" class="flex justify-between">
                        <span class="text-neutral-500 font-medium">Deskripsi</span>
                        <span class="text-neutral-700 text-right max-w-[60%]">{{ item.description }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-neutral-500 font-medium">Qty WO</span>
                        <span class="font-semibold">{{ item.qty }} {{ item.unit }}</span>
                    </div>
                    <div v-if="item.est_price > 0" class="flex justify-between">
                        <span class="text-neutral-500 font-medium">Est. Harga</span>
                        <span>Rp {{ item.est_price.toLocaleString('id-ID') }}</span>
                    </div>
                </div>

                <!-- Progress -->
                <div class="space-y-3 mb-4">
                    <div>
                        <div class="flex justify-between text-xs text-neutral-600 mb-1">
                            <span class="flex items-center gap-1"><TruckIcon class="w-3 h-3" /> Surat Jalan</span>
                            <span class="font-semibold">{{ qtySJ }} / {{ qtyWo }} {{ item.unit }} ({{ progressSJ }}%)</span>
                        </div>
                        <Progress :model-value="progressSJ" class="h-2 bg-blue-100" />
                    </div>
                    <div>
                        <div class="flex justify-between text-xs text-neutral-600 mb-1">
                            <span class="flex items-center gap-1"><PackageIcon class="w-3 h-3" /> Received</span>
                            <span class="font-semibold">{{ qtyRecv }} / {{ qtyWo }} {{ item.unit }} ({{ progressRecv }}%)</span>
                        </div>
                        <Progress :model-value="progressRecv" class="h-2 bg-green-100" />
                    </div>
                </div>

                <Separator class="mb-4" />

                <!-- SJC Form -->
                <div class="mb-5">
                    <h3 class="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <TruckIcon class="w-3.5 h-3.5" /> Tambah Surat Jalan Client
                    </h3>
                    <div class="space-y-3">
                        <div>
                            <Label class="text-xs">Tanggal <span class="text-red-500">*</span></Label>
                            <Input v-model="sjcTanggal" type="date" class="mt-1 text-sm" />
                        </div>
                        <div>
                            <Label class="text-xs">Qty <span class="text-red-500">*</span></Label>
                            <Input v-model="sjcQty" type="number" min="1" placeholder="0" class="mt-1 text-sm" />
                        </div>
                        <div>
                            <Label class="text-xs">Keterangan</Label>
                            <Textarea v-model="sjcKeterangan" placeholder="Opsional" class="mt-1 text-sm resize-none" rows="2" />
                        </div>
                        <Button
                            @click="submitSJC"
                            :disabled="isSubmittingSJC"
                            size="sm"
                            class="w-full"
                        >
                            {{ isSubmittingSJC ? 'Menyimpan...' : 'Simpan SJC' }}
                        </Button>
                    </div>
                </div>

                <Separator class="mb-4" />

                <!-- Received Form -->
                <div>
                    <h3 class="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <PackageIcon class="w-3.5 h-3.5" /> Tambah Received
                    </h3>
                    <div class="space-y-3">
                        <div>
                            <Label class="text-xs">Tanggal <span class="text-red-500">*</span></Label>
                            <Input v-model="recvTanggal" type="date" class="mt-1 text-sm" />
                        </div>
                        <div>
                            <Label class="text-xs">Qty <span class="text-red-500">*</span></Label>
                            <Input v-model="recvQty" type="number" min="1" placeholder="0" class="mt-1 text-sm" />
                        </div>
                        <div v-if="recvWarning" class="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2.5 py-2">
                            <AlertCircleIcon class="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            {{ recvWarning }}
                        </div>
                        <div>
                            <Label class="text-xs">Keterangan</Label>
                            <Textarea v-model="recvKeterangan" placeholder="Opsional" class="mt-1 text-sm resize-none" rows="2" />
                        </div>
                        <Button
                            @click="openConfirm"
                            size="sm"
                            variant="outline"
                            class="w-full border-green-600 text-green-700 hover:bg-green-50"
                        >
                            Catat Penerimaan
                        </Button>
                    </div>
                </div>
            </template>
        </SheetContent>
    </Sheet>

    <!-- Confirmation Dialog -->
    <Dialog :open="isConfirmOpen" @update:open="isConfirmOpen = $event">
        <DialogContent class="max-w-sm">
            <DialogHeader>
                <DialogTitle class="flex items-center gap-2">
                    <CheckCircleIcon class="w-5 h-5 text-green-600" />
                    Konfirmasi Penerimaan
                </DialogTitle>
                <DialogDescription>
                    Pastikan data penerimaan sudah benar sebelum disimpan.
                </DialogDescription>
            </DialogHeader>

            <div v-if="item" class="rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-2 text-sm my-2">
                <div class="flex justify-between">
                    <span class="text-neutral-500">Item</span>
                    <span class="font-semibold text-neutral-900">{{ item.item }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-neutral-500">Tanggal</span>
                    <span>{{ formatDate(recvTanggal) }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-neutral-500">Qty Diterima</span>
                    <span class="font-bold text-lg text-green-700">{{ recvQty }} {{ item.unit }}</span>
                </div>
                <div v-if="recvKeterangan" class="flex justify-between">
                    <span class="text-neutral-500">Keterangan</span>
                    <span class="text-neutral-700">{{ recvKeterangan }}</span>
                </div>
                <Separator />
                <div class="flex justify-between text-xs text-neutral-500">
                    <span>Total received setelah ini</span>
                    <span class="font-semibold">{{ qtyRecv + recvQtyNum }} / {{ qtyWo }} {{ item.unit }}</span>
                </div>
                <div v-if="recvWarning" class="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2.5 py-2">
                    <AlertCircleIcon class="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    {{ recvWarning }}
                </div>
            </div>

            <DialogFooter class="gap-2">
                <Button variant="outline" @click="isConfirmOpen = false" :disabled="isSubmittingRecv">Batal</Button>
                <Button @click="confirmReceived" :disabled="isSubmittingRecv" class="bg-green-600 hover:bg-green-700 text-white">
                    {{ isSubmittingRecv ? 'Menyimpan...' : 'Ya, Simpan' }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
