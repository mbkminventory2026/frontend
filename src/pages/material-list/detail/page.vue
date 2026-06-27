<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useParams, useRouter } from '@tanstack/vue-router';
import {
    ArrowLeftIcon, PackageIcon, TruckIcon, ClipboardListIcon,
    AlertCircleIcon, CheckCircleIcon, LockIcon, UnlockIcon, TrashIcon,
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { apiClient } from '@/lib/apiClient';
import { createSuratJalanClient, createReceived } from '@/api/material-list/material-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DateInput from '@/components/form/DateInput.vue';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/formatter';
import { usePermission } from '@/composables/usePermission';

const router = useRouter();
const params = useParams({ from: '/_authenticated/material-list/$id' });
const id = computed(() => Number(params.value.id));
const { hasPermission } = usePermission();

// ─── Types ──────────────────────────────────────────────
interface MLIDetail {
    id_material_list_item: number;
    id_material_list: number;
    item: string;
    description: string;
    qty: number;
    unit: string;
    est_price: number;
    created_at: string;
    qty_surat_jalan: number;
    qty_received: number;
    ml_name: string;
    ml_is_locked: boolean;
    id_wo: number;
    buyer: string;
    model: string;
}
interface HistoryEntry { id: number; tanggal: string; qty: number; keterangan: string; created_at: string; }
interface History { surat_jalan: HistoryEntry[]; received: HistoryEntry[]; }

// ─── State ──────────────────────────────────────────────
const detail = ref<MLIDetail | null>(null);
const history = ref<History>({ surat_jalan: [], received: [] });
const isLoading = ref(true);

const fetchDetail = async () => {
    isLoading.value = true;
    try {
        const [detailRes, histRes] = await Promise.all([
            apiClient.get(`/api/v1/material-list-items/${id.value}`),
            apiClient.get(`/api/v1/material-list-items/${id.value}/history`),
        ]);
        detail.value = detailRes.data as MLIDetail;
        history.value = histRes.data as History;
    } catch {
        toast.error('Gagal memuat detail item.');
    } finally {
        isLoading.value = false;
    }
};

onMounted(fetchDetail);

// ─── Computed ────────────────────────────────────────────
const qtyWo = computed(() => detail.value?.qty ?? 0);
const qtySJ = computed(() => detail.value?.qty_surat_jalan ?? 0);
const qtyRecv = computed(() => detail.value?.qty_received ?? 0);
const remainingForSJC = computed(() => Math.max(0, qtyWo.value - qtySJ.value));
const remainingToReceive = computed(() => Math.max(0, qtySJ.value - qtyRecv.value));
const sjcFull = computed(() => qtySJ.value >= qtyWo.value && qtyWo.value > 0);
const progressSJ = computed(() => qtyWo.value > 0 ? Math.min(100, Math.round((qtySJ.value / qtyWo.value) * 100)) : 0);
const progressRecv = computed(() => qtyWo.value > 0 ? Math.min(100, Math.round((qtyRecv.value / qtyWo.value) * 100)) : 0);

const canCreate = computed(() => hasPermission('INVENTORY_RECEIVE'));
const canDelete = computed(() => hasPermission('INVENTORY_RECEIVE'));

// ─── SJC Form ───────────────────────────────────────────
const sjcTanggal = ref('');
const sjcQty = ref('');
const sjcKeterangan = ref('');
const isSubmittingSJC = ref(false);

const sjcWarning = computed(() => null);

const submitSJC = async () => {
    if (!detail.value) return;
    const qty = parseInt(sjcQty.value);
    if (!sjcTanggal.value || isNaN(qty) || qty <= 0) { toast.error('Tanggal dan qty wajib diisi.'); return; }
    isSubmittingSJC.value = true;
    try {
        await createSuratJalanClient({ tanggal: sjcTanggal.value, qty, keterangan: sjcKeterangan.value, id_material_list_item: detail.value.id_material_list_item });
        toast.success('Surat Jalan Client berhasil dibuat.');
        sjcTanggal.value = ''; sjcQty.value = ''; sjcKeterangan.value = '';
        await fetchDetail();
    } catch { toast.error('Gagal membuat Surat Jalan Client.'); }
    finally { isSubmittingSJC.value = false; }
};

// ─── Received Form ───────────────────────────────────────
const recvTanggal = ref('');
const recvQty = ref('');
const recvKeterangan = ref('');
const isSubmittingRecv = ref(false);
const isConfirmOpen = ref(false);

const recvQtyNum = computed(() => parseInt(recvQty.value) || 0);
const recvWarning = computed(() => null);

const openConfirm = () => {
    if (!recvTanggal.value || recvQtyNum.value <= 0) { toast.error('Tanggal dan qty wajib diisi.'); return; }
    isConfirmOpen.value = true;
};

const confirmReceived = async () => {
    if (!detail.value) return;
    isSubmittingRecv.value = true;
    try {
        await createReceived({ tanggal: recvTanggal.value, qty: recvQtyNum.value, keterangan: recvKeterangan.value, id_material_list_item: detail.value.id_material_list_item });
        toast.success('Penerimaan berhasil dicatat.');
        isConfirmOpen.value = false;
        recvTanggal.value = ''; recvQty.value = ''; recvKeterangan.value = '';
        await fetchDetail();
    } catch { toast.error('Gagal mencatat penerimaan.'); }
    finally { isSubmittingRecv.value = false; }
};

// ─── Delete ──────────────────────────────────────────────
const deleteTarget = ref<{ type: 'sjc' | 'recv'; id: number; qty: number } | null>(null);
const isDeleting = ref(false);

const confirmDelete = (type: 'sjc' | 'recv', entry: HistoryEntry) => {
    deleteTarget.value = { type, id: entry.id, qty: entry.qty };
};

const executeDelete = async () => {
    if (!deleteTarget.value) return;
    isDeleting.value = true;
    try {
        const url = deleteTarget.value.type === 'sjc'
            ? `/api/v1/surat-jalan-clients/${deleteTarget.value.id}`
            : `/api/v1/received/${deleteTarget.value.id}`;
        await apiClient.delete(url);
        toast.success('Data berhasil dihapus.');
        deleteTarget.value = null;
        await fetchDetail();
    } catch { toast.error('Gagal menghapus data.'); }
    finally { isDeleting.value = false; }
};
</script>

<template>
    <div class="container mx-auto py-6 max-w-3xl space-y-5">
        <Button variant="ghost" size="sm" class="gap-1.5 -ml-2" @click="router.history.back()">
            <ArrowLeftIcon class="w-4 h-4" /> Kembali
        </Button>

        <div v-if="isLoading" class="flex items-center justify-center py-20">
            <Spinner class="w-8 h-8" />
        </div>

        <template v-else-if="detail">
            <!-- Header card -->
            <div class="rounded-xl border border-neutral-200 bg-white shadow-sm p-5">
                <div class="flex items-start justify-between gap-3 mb-3">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <ClipboardListIcon class="w-4 h-4 text-neutral-400" />
                            <span class="text-xs text-neutral-500">{{ detail.ml_name }}</span>
                            <span v-if="detail.ml_is_locked" class="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 border border-amber-400 text-amber-600 rounded font-medium">
                                <LockIcon class="w-2.5 h-2.5" /> Locked
                            </span>
                            <span v-else class="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 border border-neutral-300 text-neutral-500 rounded font-medium">
                                <UnlockIcon class="w-2.5 h-2.5" /> Draft
                            </span>
                        </div>
                        <h1 class="text-2xl font-bold text-neutral-900">{{ detail.item }}</h1>
                        <p v-if="detail.description" class="text-sm text-neutral-500 mt-0.5">{{ detail.description }}</p>
                        <p class="text-xs text-neutral-400 mt-1">
                            <button class="text-blue-600 hover:underline" @click="router.navigate({ to: '/work-order/$id', params: { id: String(detail!.id_wo) } })">
                                WO #{{ detail.id_wo }}
                            </button>
                            &middot; {{ detail.buyer }} &middot; {{ detail.model }}
                        </p>
                    </div>
                    <div class="text-right shrink-0">
                        <p class="text-2xl font-bold">{{ detail.qty }}</p>
                        <p class="text-xs text-neutral-500">{{ detail.unit }}</p>
                        <p v-if="detail.est_price > 0" class="text-xs text-neutral-400 mt-1">Rp {{ detail.est_price.toLocaleString('id-ID') }}</p>
                    </div>
                </div>
                <Separator class="my-3" />
                <div class="space-y-2.5">
                    <div>
                        <div class="flex justify-between text-xs text-neutral-600 mb-1">
                            <span class="flex items-center gap-1"><TruckIcon class="w-3 h-3 text-blue-500" /> Surat Jalan</span>
                            <span class="font-semibold">{{ qtySJ }} / {{ qtyWo }} {{ detail.unit }} ({{ progressSJ }}%)</span>
                        </div>
                        <Progress :model-value="progressSJ" class="h-2" />
                    </div>
                    <div>
                        <div class="flex justify-between text-xs text-neutral-600 mb-1">
                            <span class="flex items-center gap-1"><PackageIcon class="w-3 h-3 text-green-500" /> Received</span>
                            <span class="font-semibold">{{ qtyRecv }} / {{ qtyWo }} {{ detail.unit }} ({{ progressRecv }}%)</span>
                        </div>
                        <Progress :model-value="progressRecv" class="h-2" />
                    </div>
                </div>
            </div>

            <!-- ── STEP 1: Surat Jalan Client ── -->
            <div class="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                <div class="px-5 py-3.5 bg-neutral-50 border-b border-neutral-100 flex items-center gap-2">
                    <div class="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold shrink-0">1</div>
                    <h2 class="text-sm font-bold text-neutral-700 flex items-center gap-1.5">
                        <TruckIcon class="w-4 h-4 text-blue-500" /> Surat Jalan Client
                    </h2>
                </div>

                <!-- History table -->
                <div v-if="history.surat_jalan.length > 0" class="overflow-x-auto border-b border-neutral-100">
                    <table class="w-full text-xs text-left">
                        <thead class="bg-neutral-50/60">
                            <tr>
                                <th class="px-4 py-2 font-bold text-neutral-500 uppercase tracking-wider">Tanggal</th>
                                <th class="px-4 py-2 font-bold text-neutral-500 uppercase tracking-wider text-right">Qty</th>
                                <th class="px-4 py-2 font-bold text-neutral-500 uppercase tracking-wider">Keterangan</th>
                                <th v-if="canDelete" class="px-4 py-2"></th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-neutral-100">
                            <tr v-for="entry in history.surat_jalan" :key="entry.id" class="hover:bg-neutral-50/50">
                                <td class="px-4 py-2.5">{{ formatDate(entry.tanggal) }}</td>
                                <td class="px-4 py-2.5 text-right font-semibold text-blue-700">{{ entry.qty }} {{ detail.unit }}</td>
                                <td class="px-4 py-2.5 text-neutral-500">{{ entry.keterangan || '—' }}</td>
                                <td v-if="canDelete" class="px-4 py-2.5">
                                    <Button size="sm" variant="ghost" class="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50" @click="confirmDelete('sjc', entry)">
                                        <TrashIcon class="w-3 h-3" />
                                    </Button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else class="px-5 py-3 text-xs text-neutral-400 border-b border-neutral-100">Belum ada surat jalan.</div>

                <!-- SJC Form -->
                <div class="p-5">
                    <!-- SJC sudah memenuhi qty WO -->
                    <div v-if="sjcFull" class="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                        <CheckCircleIcon class="w-4 h-4 shrink-0" />
                        Surat Jalan sudah memenuhi qty WO ({{ qtySJ }} / {{ qtyWo }} {{ detail?.unit }}).
                    </div>

                    <!-- Form tambah SJC -->
                    <div v-else-if="canCreate" class="space-y-3">
                        <div class="flex items-center justify-between text-xs">
                            <span class="text-neutral-600 font-medium">Sisa yang bisa di-SJ</span>
                            <span class="font-bold text-blue-700 text-sm">{{ remainingForSJC }} {{ detail?.unit }}</span>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <Label class="text-xs">Tanggal <span class="text-red-500">*</span></Label>
                                <DateInput v-model="sjcTanggal" class="mt-1 text-sm" />
                            </div>
                            <div>
                                <Label class="text-xs">Qty <span class="text-red-500">*</span> <span class="text-neutral-400">(maks {{ remainingForSJC }})</span></Label>
                                <Input v-model="sjcQty" type="number" min="1" :max="remainingForSJC" placeholder="0" class="mt-1 text-sm" />
                            </div>
                        </div>
                        <div v-if="sjcWarning" class="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2.5 py-2">
                            <AlertCircleIcon class="w-3.5 h-3.5 mt-0.5 shrink-0" />{{ sjcWarning }}
                        </div>
                        <div>
                            <Label class="text-xs">Keterangan</Label>
                            <Textarea v-model="sjcKeterangan" placeholder="Opsional" class="mt-1 text-sm resize-none" rows="2" />
                        </div>
                        <Button @click="submitSJC" :disabled="isSubmittingSJC" size="sm" class="w-full">
                            {{ isSubmittingSJC ? 'Menyimpan...' : 'Simpan Surat Jalan' }}
                        </Button>
                    </div>

                    <div v-else class="text-xs text-neutral-400">Tidak ada izin untuk membuat SJC.</div>
                </div>
            </div>

            <!-- ── STEP 2: Received ── -->
            <div class="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                <div class="px-5 py-3.5 bg-neutral-50 border-b border-neutral-100 flex items-center gap-2">
                    <div class="flex items-center justify-center w-5 h-5 rounded-full bg-green-600 text-white text-[10px] font-bold shrink-0">2</div>
                    <h2 class="text-sm font-bold text-neutral-700 flex items-center gap-1.5">
                        <PackageIcon class="w-4 h-4 text-green-500" /> Received
                    </h2>
                </div>

                <!-- History table -->
                <div v-if="history.received.length > 0" class="overflow-x-auto border-b border-neutral-100">
                    <table class="w-full text-xs text-left">
                        <thead class="bg-neutral-50/60">
                            <tr>
                                <th class="px-4 py-2 font-bold text-neutral-500 uppercase tracking-wider">Tanggal</th>
                                <th class="px-4 py-2 font-bold text-neutral-500 uppercase tracking-wider text-right">Qty</th>
                                <th class="px-4 py-2 font-bold text-neutral-500 uppercase tracking-wider">Keterangan</th>
                                <th v-if="canDelete" class="px-4 py-2"></th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-neutral-100">
                            <tr v-for="entry in history.received" :key="entry.id" class="hover:bg-neutral-50/50">
                                <td class="px-4 py-2.5">{{ formatDate(entry.tanggal) }}</td>
                                <td class="px-4 py-2.5 text-right font-semibold text-green-700">{{ entry.qty }} {{ detail.unit }}</td>
                                <td class="px-4 py-2.5 text-neutral-500">{{ entry.keterangan || '—' }}</td>
                                <td v-if="canDelete" class="px-4 py-2.5">
                                    <Button size="sm" variant="ghost" class="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50" @click="confirmDelete('recv', entry)">
                                        <TrashIcon class="w-3 h-3" />
                                    </Button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Conditional received section -->
                <div class="p-5">
                    <!-- No SJC yet -->
                    <div v-if="qtySJ === 0" class="flex items-center gap-2 text-sm text-neutral-400 py-2">
                        <AlertCircleIcon class="w-4 h-4 shrink-0" />
                        Belum ada Surat Jalan. Buat SJC terlebih dahulu sebelum mencatat penerimaan.
                    </div>

                    <!-- All received -->
                    <div v-else-if="remainingToReceive === 0" class="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                        <CheckCircleIcon class="w-4 h-4 shrink-0" />
                        Semua material sudah diterima ({{ qtyRecv }} / {{ qtySJ }} {{ detail.unit }}).
                    </div>

                    <!-- Can receive -->
                    <div v-else-if="canCreate" class="space-y-3">
                        <div class="flex items-center justify-between text-xs">
                            <span class="text-neutral-600 font-medium">Sisa belum diterima</span>
                            <span class="font-bold text-green-700 text-sm">{{ remainingToReceive }} {{ detail.unit }}</span>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <Label class="text-xs">Tanggal <span class="text-red-500">*</span></Label>
                                <DateInput v-model="recvTanggal" class="mt-1 text-sm" />
                            </div>
                            <div>
                                <Label class="text-xs">Qty <span class="text-red-500">*</span> <span class="text-neutral-400">(maks {{ remainingToReceive }})</span></Label>
                                <Input v-model="recvQty" type="number" min="1" :max="remainingToReceive" placeholder="0" class="mt-1 text-sm" />
                            </div>
                        </div>
                        <div v-if="recvWarning" class="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2.5 py-2">
                            <AlertCircleIcon class="w-3.5 h-3.5 mt-0.5 shrink-0" />{{ recvWarning }}
                        </div>
                        <div>
                            <Label class="text-xs">Keterangan</Label>
                            <Textarea v-model="recvKeterangan" placeholder="Opsional" class="mt-1 text-sm resize-none" rows="2" />
                        </div>
                        <Button @click="openConfirm" variant="outline" size="sm" class="w-full border-green-600 text-green-700 hover:bg-green-50">
                            Catat Penerimaan
                        </Button>
                    </div>

                    <div v-else-if="remainingToReceive > 0" class="text-xs text-neutral-400">
                        Sisa belum diterima: {{ remainingToReceive }} {{ detail.unit }}. Tidak ada izin untuk mencatat.
                    </div>
                </div>
            </div>
        </template>

        <div v-else class="text-center py-20 text-neutral-400">Item tidak ditemukan.</div>
    </div>

    <!-- Received Confirmation Dialog -->
    <Dialog :open="isConfirmOpen" @update:open="isConfirmOpen = $event">
        <DialogContent class="max-w-sm">
            <DialogHeader>
                <DialogTitle class="flex items-center gap-2">
                    <CheckCircleIcon class="w-5 h-5 text-green-600" /> Konfirmasi Penerimaan
                </DialogTitle>
                <DialogDescription>Pastikan data sudah benar sebelum disimpan.</DialogDescription>
            </DialogHeader>
            <div v-if="detail" class="rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-2 text-sm my-2">
                <div class="flex justify-between"><span class="text-neutral-500">Item</span><span class="font-semibold">{{ detail.item }}</span></div>
                <div class="flex justify-between"><span class="text-neutral-500">Tanggal</span><span>{{ formatDate(recvTanggal) }}</span></div>
                <div class="flex justify-between"><span class="text-neutral-500">Qty Diterima</span><span class="font-bold text-lg text-green-700">{{ recvQty }} {{ detail.unit }}</span></div>
                <div v-if="recvKeterangan" class="flex justify-between"><span class="text-neutral-500">Keterangan</span><span class="text-right max-w-[60%]">{{ recvKeterangan }}</span></div>
                <Separator />
                <div class="flex justify-between text-xs text-neutral-500">
                    <span>Sisa setelah ini</span>
                    <span class="font-semibold">{{ remainingToReceive - recvQtyNum }} {{ detail.unit }}</span>
                </div>
                <div v-if="recvWarning" class="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2.5 py-2">
                    <AlertCircleIcon class="w-3.5 h-3.5 mt-0.5 shrink-0" />{{ recvWarning }}
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

    <!-- Delete Confirmation Dialog -->
    <Dialog :open="!!deleteTarget" @update:open="v => { if (!v) deleteTarget = null }">
        <DialogContent class="max-w-sm">
            <DialogHeader>
                <DialogTitle class="flex items-center gap-2 text-red-600">
                    <TrashIcon class="w-5 h-5" /> Hapus Data
                </DialogTitle>
                <DialogDescription>
                    Hapus entri {{ deleteTarget?.type === 'sjc' ? 'Surat Jalan' : 'Received' }} qty
                    <strong>{{ deleteTarget?.qty }} {{ detail?.unit }}</strong>?
                    Data historis akan hilang permanen.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter class="gap-2 mt-2">
                <Button variant="outline" @click="deleteTarget = null" :disabled="isDeleting">Batal</Button>
                <Button @click="executeDelete" :disabled="isDeleting" variant="destructive">
                    {{ isDeleting ? 'Menghapus...' : 'Hapus' }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
