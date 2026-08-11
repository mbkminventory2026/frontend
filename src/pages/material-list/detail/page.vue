<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useParams, useRouter } from '@tanstack/vue-router';
import {
    ArrowLeftIcon, PackageIcon, TruckIcon, ClipboardListIcon,
    AlertCircleIcon, CheckCircleIcon, LockIcon, UnlockIcon, TrashIcon,
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { apiClient } from '@/lib/apiClient';
import { createSuratJalanClient, createReceived, getMaterialListItems, updateMaterialListItem, type UpdateMaterialListItemPayload } from '@/api/material-list/material-list';
import { getWorkOrderById, type WorkOrderDetailResponse } from '@/api/work-orders/work-orders';
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
    id_wo_shell: number | null;
    id_wo_trim: number | null;
    category: 'FABRIC' | 'SEWING' | 'PACKING' | null;
    cons_per_pc: number | null;
    qty_wo_scope: 'WHOLE_WO' | 'SIZE' | 'COLOR' | 'COLOR_SIZE' | null;
    id_qty_wo_shell: number | null;
    id_qty_wo_size: number | null;
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
const workOrder = ref<WorkOrderDetailResponse | null>(null);
const isEditOpen = ref(false);
const isSubmittingEdit = ref(false);
const stageTouched = ref(new Set<string>());
const editConsModified = ref(false);
const sourceIdsLoaded = ref(false);
const editForm = ref({ item: '', description: '', qty: 0, unit: '', est_price: 0, id_wo_shell: null as number | null, id_wo_trim: null as number | null, category: '' as MLIDetail['category'] | '', cons_per_pc: '', qty_wo_scope: '' as MLIDetail['qty_wo_scope'] | '', id_qty_wo_shell: null as number | null, id_qty_wo_size: null as number | null });

const fetchDetail = async () => {
    isLoading.value = true;
    try {
        const [detailRes, histRes] = await Promise.all([
            apiClient.get(`/api/v1/material-list-items/${id.value}`),
            apiClient.get(`/api/v1/material-list-items/${id.value}/history`),
        ]);
        const itemDetail = detailRes.data as MLIDetail;
        const materialList = await getMaterialListItems(itemDetail.id_material_list);
        const sourceItem = (materialList?.items as Array<{ id_material_list_item: number; id_wo_shell?: number | null; id_wo_trim?: number | null }> | undefined)
            ?.find(value => value.id_material_list_item === itemDetail.id_material_list_item);
        sourceIdsLoaded.value = sourceItem !== undefined;
        detail.value = { ...itemDetail, id_wo_shell: sourceItem?.id_wo_shell ?? null, id_wo_trim: sourceItem?.id_wo_trim ?? null };
        history.value = histRes.data as History;
        workOrder.value = await getWorkOrderById(itemDetail.id_wo);
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
const canEdit = computed(() => hasPermission('MATERIAL_LIST_UPDATE') && !detail.value?.ml_is_locked);
const applicabilityShellLabel = computed(() => {
    const shellId = detail.value?.id_qty_wo_shell;
    if (!shellId) return null;
    const shell = workOrder.value?.shells.find(value => value.id_wo_shell === shellId);
    return shell ? `${shell.color} (Shell #${shell.id_wo_shell})` : `Shell #${shellId}`;
});
const editApplicabilitySizes = computed(() => {
    if (editForm.value.qty_wo_scope === 'COLOR_SIZE' && editForm.value.id_qty_wo_shell) return workOrder.value?.shells.find(shell => shell.id_wo_shell === editForm.value.id_qty_wo_shell)?.sizes ?? [];
    return workOrder.value?.shells.flatMap(shell => shell.sizes) ?? [];
});
const openEdit = () => {
    if (!detail.value) return;
    const value = detail.value;
    editForm.value = { item: value.item, description: value.description, qty: value.qty, unit: value.unit, est_price: value.est_price, id_wo_shell: value.id_wo_shell, id_wo_trim: value.id_wo_trim, category: value.category ?? '', cons_per_pc: value.cons_per_pc === null ? '' : String(value.cons_per_pc), qty_wo_scope: value.qty_wo_scope ?? '', id_qty_wo_shell: value.id_qty_wo_shell, id_qty_wo_size: value.id_qty_wo_size };
    stageTouched.value = new Set(); editConsModified.value = false; isEditOpen.value = true;
};
const touchStage = (key: string) => stageTouched.value.add(key);
watch(() => editForm.value.id_qty_wo_shell, () => {
    if (editForm.value.qty_wo_scope === 'COLOR_SIZE' && !editApplicabilitySizes.value.some(size => size.id_size === editForm.value.id_qty_wo_size)) editForm.value.id_qty_wo_size = null;
});
watch(() => editForm.value.qty_wo_scope, (scope) => {
    if (scope === 'WHOLE_WO') { editForm.value.id_qty_wo_shell = null; editForm.value.id_qty_wo_size = null; }
    if (scope === 'SIZE') editForm.value.id_qty_wo_shell = null;
    if (scope === 'COLOR') editForm.value.id_qty_wo_size = null;
});
watch(() => [editForm.value.id_wo_shell, editForm.value.id_wo_trim], () => {
    if (editConsModified.value || editForm.value.cons_per_pc !== '') return;
    const trim = workOrder.value?.trims.find(value => value.id_wo_trim === editForm.value.id_wo_trim);
    const shell = workOrder.value?.shells.find(value => value.id_wo_shell === editForm.value.id_wo_shell);
    const consumption = trim?.cons ?? shell?.cons;
    if (consumption !== undefined && consumption !== null) {
        editForm.value.cons_per_pc = String(consumption);
        touchStage('cons');
    }
});
const submitEdit = async () => {
    if (!detail.value) return;
    const form = editForm.value; const cons = form.cons_per_pc === '' ? null : Number(form.cons_per_pc);
    if (!form.item || !form.unit) { toast.error('Item dan unit wajib diisi.'); return; }
    if (!Number.isFinite(cons ?? 0) || (cons !== null && cons < 0)) { toast.error('CONS./PC tidak boleh negatif.'); return; }
    if (stageTouched.value.has('scope')) {
        if (!form.qty_wo_scope) { toast.error('Pilih berlaku untuk QTY WO.'); return; }
        if (form.qty_wo_scope === 'SIZE' && !form.id_qty_wo_size) { toast.error('Pilih size QTY WO.'); return; }
        if (form.qty_wo_scope === 'COLOR' && !form.id_qty_wo_shell) { toast.error('Pilih warna QTY WO.'); return; }
        if (form.qty_wo_scope === 'COLOR_SIZE' && (!form.id_qty_wo_shell || !form.id_qty_wo_size)) { toast.error('Pilih warna dan size QTY WO.'); return; }
    }
    const payload: UpdateMaterialListItemPayload = { item: form.item, description: form.description, qty: Number(form.qty) || 0, unit: form.unit, est_price: Number(form.est_price) || 0 };
    if (sourceIdsLoaded.value) { payload.id_wo_shell = form.id_wo_shell; payload.id_wo_trim = form.id_wo_trim; }
    if (stageTouched.value.has('category')) payload.category = form.category || null;
    if (stageTouched.value.has('cons')) payload.cons_per_pc = cons;
    if (stageTouched.value.has('scope')) { payload.qty_wo_scope = form.qty_wo_scope || null; payload.id_qty_wo_shell = form.qty_wo_scope === 'COLOR' || form.qty_wo_scope === 'COLOR_SIZE' ? form.id_qty_wo_shell : null; payload.id_qty_wo_size = form.qty_wo_scope === 'SIZE' || form.qty_wo_scope === 'COLOR_SIZE' ? form.id_qty_wo_size : null; }
    isSubmittingEdit.value = true;
    try { await updateMaterialListItem(detail.value.id_material_list_item, payload); toast.success('Item material list diperbarui.'); isEditOpen.value = false; await fetchDetail(); }
    catch (error: unknown) { const response = (error as { response?: { data?: { message?: string } } }).response; toast.error(response?.data?.message || 'Gagal memperbarui item.'); }
    finally { isSubmittingEdit.value = false; }
};

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
                        <Button v-if="canEdit" variant="outline" size="sm" class="mt-2" @click="openEdit">Edit Item</Button>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs text-neutral-600">
                    <span>Kategori: <strong>{{ detail.category ?? 'Belum ditentukan' }}</strong></span>
                    <span>CONS./PC: <strong>{{ detail.cons_per_pc ?? '—' }}</strong></span>
                    <span>Berlaku QTY WO: <strong>{{ detail.qty_wo_scope ?? 'Belum ditentukan' }}</strong></span>
                    <span v-if="applicabilityShellLabel">Warna QTY WO: <strong>{{ applicabilityShellLabel }}</strong></span>
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
    <Dialog :open="isEditOpen" @update:open="isEditOpen = $event">
        <DialogContent class="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Edit Item Material List</DialogTitle><DialogDescription>Sumber Material dan Berlaku untuk QTY WO adalah konsep terpisah.</DialogDescription></DialogHeader>
            <div class="space-y-3 py-2">
                <div class="grid grid-cols-2 gap-3"><div><Label class="text-xs">Item *</Label><Input v-model="editForm.item" class="mt-1" /></div><div><Label class="text-xs">Unit *</Label><Input v-model="editForm.unit" class="mt-1" /></div></div>
                <div><Label class="text-xs">Deskripsi</Label><Input v-model="editForm.description" class="mt-1" /></div>
                <div class="grid grid-cols-2 gap-3"><div><Label class="text-xs">Qty</Label><Input v-model="editForm.qty" type="number" min="0" class="mt-1" /></div><div><Label class="text-xs">Est. Harga</Label><Input v-model="editForm.est_price" type="number" min="0" class="mt-1" /></div></div>
                <div class="border-t pt-3 space-y-2"><p class="text-xs font-semibold">Sumber Material</p><div class="grid grid-cols-2 gap-3"><div><Label class="text-xs">Shell sumber</Label><select v-model="editForm.id_wo_shell" class="mt-1 h-9 w-full rounded-md border px-2 text-sm"><option :value="null">Tidak dipilih</option><option v-for="shell in workOrder?.shells ?? []" :key="shell.id_wo_shell" :value="shell.id_wo_shell">{{ shell.color }} — {{ shell.deskripsi }}</option></select></div><div><Label class="text-xs">Trim sumber</Label><select v-model="editForm.id_wo_trim" class="mt-1 h-9 w-full rounded-md border px-2 text-sm"><option :value="null">Tidak dipilih</option><option v-for="trim in workOrder?.trims ?? []" :key="trim.id_wo_trim" :value="trim.id_wo_trim">{{ trim.item }} — {{ trim.color }}</option></select></div></div></div>
                <div class="border-t pt-3 space-y-3"><div><Label class="text-xs">Kategori</Label><select v-model="editForm.category" class="mt-1 h-9 w-full rounded-md border px-2 text-sm" @change="touchStage('category')"><option value="">Belum ditentukan</option><option value="FABRIC">FABRIC</option><option value="SEWING">SEWING</option><option value="PACKING">PACKING</option></select></div><div><Label class="text-xs">CONS./PC</Label><Input v-model="editForm.cons_per_pc" type="number" min="0" step="0.001" class="mt-1" @input="editConsModified = true; touchStage('cons')" /></div><div><Label class="text-xs">Berlaku untuk QTY WO</Label><select v-model="editForm.qty_wo_scope" class="mt-1 h-9 w-full rounded-md border px-2 text-sm" @change="touchStage('scope')"><option value="">Belum ditentukan</option><option value="WHOLE_WO">Seluruh WO</option><option value="SIZE">Size</option><option value="COLOR">Warna</option><option value="COLOR_SIZE">Warna + Size</option></select></div><div v-if="editForm.qty_wo_scope === 'COLOR' || editForm.qty_wo_scope === 'COLOR_SIZE'"><Label class="text-xs">Warna QTY WO *</Label><select v-model="editForm.id_qty_wo_shell" class="mt-1 h-9 w-full rounded-md border px-2 text-sm" @change="touchStage('scope')"><option :value="null">Pilih warna shell</option><option v-for="shell in workOrder?.shells ?? []" :key="shell.id_wo_shell" :value="shell.id_wo_shell">{{ shell.color }} (Shell #{{ shell.id_wo_shell }})</option></select></div><div v-if="editForm.qty_wo_scope === 'SIZE' || editForm.qty_wo_scope === 'COLOR_SIZE'"><Label class="text-xs">Size QTY WO *</Label><select v-model="editForm.id_qty_wo_size" class="mt-1 h-9 w-full rounded-md border px-2 text-sm" :disabled="editForm.qty_wo_scope === 'COLOR_SIZE' && !editForm.id_qty_wo_shell" @change="touchStage('scope')"><option :value="null">Pilih size</option><option v-for="size in editApplicabilitySizes" :key="size.id_wo_shell_size" :value="size.id_size">{{ size.size }}</option></select></div></div>
            </div>
            <DialogFooter><Button variant="outline" @click="isEditOpen = false" :disabled="isSubmittingEdit">Batal</Button><Button @click="submitEdit" :disabled="isSubmittingEdit">{{ isSubmittingEdit ? 'Menyimpan...' : 'Simpan' }}</Button></DialogFooter>
        </DialogContent>
    </Dialog>

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
