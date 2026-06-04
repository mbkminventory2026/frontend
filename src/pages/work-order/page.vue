<script setup lang="ts">
import { h, ref, watch, onMounted, computed, reactive } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon, CheckCircleIcon, FileTextIcon, Trash2Icon, PlusCircleIcon, ChevronRightIcon, ChevronLeftIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import {
    getWorkOrders,
    createWorkOrder,
    closeWorkOrder,
    type WorkOrderListItem,
} from '@/api/work-orders/work-orders';
import { getPOClients, getPOClientById, type POClientListItem, type POClientItemResponse } from '@/api/po-clients/po-clients';
import { workOrderSchema } from '@/routes/_authenticated/work-order.index';

import DataTable from '@/components/DataTable.vue';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';

import { useTable } from '@/composables/useTable';
import { formatDate } from '@/lib/formatter';
import { usePermission } from '@/composables/usePermission';

const router = useRouter();
const search = useSearch({ strict: false }) as any;
const { hasPermission } = usePermission();

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

// ─────────────────────────────────────────────────────────────
// WIZARD CREATE DIALOG
// ─────────────────────────────────────────────────────────────
const isWizardOpen = ref(false);
const wizardStep = ref(1);
const isSubmitting = ref(false);

// Step 1: Header Info
const step1 = reactive({
    selectedPOId: null as number | null,
    id_po_client_item: null as number | null,
    buyer: '',
    model: '',
    qty: null as number | null,
    delivery: '',
    fob_cmt: 'false' as 'true' | 'false',
});

// Step 1 — PO & PO Items dropdown
const poList = ref<POClientListItem[]>([]);
const poItemOptions = ref<(POClientItemResponse & { id_po_client_item: number })[]>([]);
const isLoadingPOItems = ref(false);
const maxQty = ref<number | null>(null);
const poDeliveryDate = ref('');

const parseNumber = (val: any): number => {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return val;
    const str = String(val).replace(/,/g, '.').trim();
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
};

const parseInteger = (val: any): number => {
    return Math.round(parseNumber(val));
};

const fetchPOList = async () => {
    try {
        const res = await getPOClients({ limit: 100, offset: 0 });
        poList.value = res.results;
    } catch (e) {
        console.error('Gagal fetch PO list:', e);
    }
};

const onPOSelect = async (poId: number) => {
    step1.selectedPOId = poId;
    step1.id_po_client_item = null;
    poItemOptions.value = [];
    poDeliveryDate.value = '';
    maxQty.value = null;
    if (!poId) return;

    isLoadingPOItems.value = true;
    try {
        const detail = await getPOClientById(poId);
        poDeliveryDate.value = detail.delivery ? detail.delivery.split('T')[0] : '';
        poItemOptions.value = (detail.items || []).map((item: any) => ({
            ...item,
            id_po_client_item: item.id_po_client_item,
        }));
    } catch (e) {
        console.error('Gagal fetch PO items:', e);
    } finally {
        isLoadingPOItems.value = false;
    }
};

// Prefill WO fields when PO client item is selected
watch(() => step1.id_po_client_item, (newVal) => {
    if (!newVal) {
        maxQty.value = null;
        return;
    }
    const selectedItem = poItemOptions.value.find(item => item.id_po_client_item === Number(newVal));
    if (selectedItem) {
        step1.qty = selectedItem.qty;
        maxQty.value = selectedItem.qty;
        if (poDeliveryDate.value) {
            step1.delivery = poDeliveryDate.value;
        }
    }
});

// Step 2: Shells
interface ShellSize { size: string; qty: number; ratio: number; }
interface Shell { fabric: string; color: string; cons: number; allow: number; berat_1_yd: number; sizes: ShellSize[]; }
// NOTE: Shell.cons, Shell.allow, Shell.berat_1_yd → backend: required,gte=0 on int32/float64 means non-zero
// NOTE: ShellSize.ratio → backend: required,gte=0 on int32 means non-zero (>0)

const shells = ref<Shell[]>([]);

const addShell = () => {
    shells.value.push({ fabric: '', color: '', cons: 0, allow: 0, berat_1_yd: 0, sizes: [] });
};
const removeShell = (i: number) => shells.value.splice(i, 1);
const addSize = (shellIdx: number) => {
    const shell = shells.value[shellIdx];
    if (shell) {
        shell.sizes.push({ size: '', qty: 0, ratio: 0 });
    }
};
const removeSize = (shellIdx: number, sizeIdx: number) => {
    const shell = shells.value[shellIdx];
    if (shell) {
        shell.sizes.splice(sizeIdx, 1);
    }
};

// Dropdown options for Sizes
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40'];

const isSizeDisabled = (shellIdx: number, sizeIdx: number, sizeOption: string) => {
    const shell = shells.value[shellIdx];
    if (!shell) return false;
    return shell.sizes.some((sz, idx) => idx !== sizeIdx && sz.size === sizeOption);
};

const getShellTotalQty = (shellIdx: number) => {
    const shell = shells.value[shellIdx];
    if (!shell || !shell.sizes) return 0;
    return shell.sizes.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);
};

// Step 3: Trims & Materials
// NOTE: Trim.allow → backend: required,gte=0 on int32 means non-zero; Trim required min=1 by backend
interface Trim { item: string; description: string; color: string; code: string; cons: number; qty: number; uom: string; position: string; allow: number; }
interface Material { description: string; size: string; color: string; uom: string; }

const trims = ref<Trim[]>([]);
const materials = ref<Material[]>([]);

const addTrim = () => {
    // Default allow to 1 because backend uses `required,gte=0` on int32 (required = non-zero)
    trims.value.push({ item: '', description: '', color: '', code: '', cons: 0, qty: 0, uom: 'PCS', position: '', allow: 1 });
};
const removeTrim = (i: number) => trims.value.splice(i, 1);
const addMaterial = () => {
    materials.value.push({ description: '', size: '', color: '', uom: '' });
};
const removeMaterial = (i: number) => materials.value.splice(i, 1);

// Unique colors from shell inputs (local state)
const shellColors = computed(() => {
    const colors = shells.value
        .map(s => s.color?.trim())
        .filter(Boolean);
    return [...new Set(colors)];
});

// Check if trim color has already been chosen in other trim rows
const hasDuplicateTrimColor = (trimIdx: number) => {
    const trim = trims.value[trimIdx];
    if (!trim || !trim.color) return false;
    return trims.value.some((t, idx) => idx !== trimIdx && t.color === trim.color);
};

const openWizard = () => {
    // Reset all state
    wizardStep.value = 1;
    step1.selectedPOId = null;
    step1.id_po_client_item = null;
    step1.buyer = '';
    step1.model = '';
    step1.qty = null;
    step1.delivery = '';
    step1.fob_cmt = 'false';
    poItemOptions.value = [];
    maxQty.value = null;
    poDeliveryDate.value = '';
    shells.value = [
        { fabric: '', color: '', cons: 0, allow: 0, berat_1_yd: 0, sizes: [{ size: '', qty: 0, ratio: 0 }] }
    ];
    // Pre-add 1 trim since backend requires trims to have min=1 item
    trims.value = [{ item: '', description: '', color: '', code: '', cons: 0, qty: 0, uom: 'PCS', position: '', allow: 1 }];
    materials.value = [];
    isWizardOpen.value = true;
};

const step1Valid = computed(() =>
    step1.id_po_client_item &&
    step1.buyer.trim() &&
    step1.model.trim() &&
    step1.qty && step1.qty > 0 &&
    (!maxQty.value || step1.qty <= maxQty.value) &&
    step1.delivery
);

const step2Valid = computed(() =>
    shells.value.length > 0 &&
    shells.value.every((s, si) =>
        s.fabric.trim() &&
        s.color.trim() &&
        // cons, allow, berat_1_yd: backend uses `required,gte=0` on numeric → must be non-zero (>0)
        s.cons > 0 &&
        s.allow >= 1 &&
        s.berat_1_yd > 0 &&
        s.sizes.length > 0 &&
        // ratio: backend uses `required,gte=0` on int32 → must be non-zero (>=1)
        s.sizes.every(sz => sz.size.trim() && sz.qty > 0 && sz.ratio >= 1) &&
        getShellTotalQty(si) <= (step1.qty || 0)
    )
);

// Trims: backend requires min=1, each trim needs item, color, code, cons>0, qty>0, uom, allow>=1
const step3Valid = computed(() =>
    trims.value.length >= 1 &&
    trims.value.every(t =>
        t.item.trim() &&
        t.color.trim() &&
        t.code.trim() &&
        t.cons > 0 &&
        t.qty > 0 &&
        t.uom.trim() &&
        t.allow >= 1
    ) &&
    // materials are optional (omitempty) but if added, must have size, color, uom
    materials.value.every(m => m.size.trim() && m.color.trim() && m.uom.trim())
);

const handleSubmit = async () => {
    isSubmitting.value = true;
    let payload: any = null;
    try {
        payload = {
            buyer: step1.buyer,
            model: step1.model,
            qty: parseInteger(step1.qty),
            fob_cmt: step1.fob_cmt === 'true',
            delivery: step1.delivery,
            id_po_client_item: parseInteger(step1.id_po_client_item),
            shells: shells.value.map(s => ({
                fabric: s.fabric,
                color: s.color,
                cons: parseNumber(s.cons),
                allow: parseInteger(s.allow),
                berat_1_yd: parseNumber(s.berat_1_yd),
                sizes: s.sizes.map(sz => ({
                    size: sz.size,
                    qty: parseInteger(sz.qty),
                    ratio: parseInteger(sz.ratio),
                })),
            })),
            trims: trims.value.map(t => ({
                item: t.item,
                description: t.description,
                color: t.color,
                code: t.code,
                cons: parseNumber(t.cons),
                qty: parseInteger(t.qty),
                uom: t.uom,
                position: t.position,
                allow: parseInteger(t.allow),
            })),
            material_lists: materials.value.map(m => ({
                description: m.description,
                size: m.size,
                color: m.color,
                uom: m.uom,
            })),
        };

        await createWorkOrder(payload);
        toast.success('Work Order berhasil dibuat!');
        isWizardOpen.value = false;
        await fetchData();
    } catch (error: any) {
        console.error('Gagal membuat Work Order. Payload:', payload, 'Response error:', error.response?.data);
        const errMsg = error.response?.data?.message || 'Gagal membuat Work Order.';
        const details = error.response?.data?.error;
        if (Array.isArray(details)) {
            const fieldErrs = details.map((d: any) => `${d.field}: ${d.message}`).join(', ');
            toast.error(`${errMsg} (${fieldErrs})`);
        } else if (details?.code) {
            toast.error(`${errMsg} (${details.code})`);
        } else {
            toast.error(errMsg);
        }
    } finally {
        isSubmitting.value = false;
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
                        onClick: () => router.navigate({ to: '/work-order/$id', params: { id: String(id) } })
                    }, () => [
                        h(EyeIcon, { class: 'w-4 h-4 mr-1' }),
                        'View'
                    ]),
                    ...(canClose.value && isOpen ? [
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

onMounted(() => {
    fetchData();
    fetchPOList();
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
                <Button @click="openWizard" variant="outline" class="shadow-sm border-neutral-300">
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

        <!-- ── WIZARD DIALOG ─────────────────────────────────── -->
        <Dialog :open="isWizardOpen" @update:open="isWizardOpen = $event">
            <DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col p-0 bg-white border border-neutral-200 shadow-xl rounded-xl">
                <!-- Dialog Header -->
                <DialogHeader class="p-6 pb-4 border-b border-neutral-100">
                    <DialogTitle class="text-lg font-bold text-neutral-900">Tambah Work Order</DialogTitle>
                    <DialogDescription class="text-xs text-neutral-500 mt-1">
                        Isi informasi Work Order baru dalam 3 langkah.
                    </DialogDescription>

                    <!-- Step Indicator -->
                    <div class="flex items-center gap-2 mt-4">
                        <div v-for="step in [1, 2, 3]" :key="step" class="flex items-center gap-1.5">
                            <div :class="[
                                'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all',
                                wizardStep === step
                                    ? 'bg-neutral-900 text-white'
                                    : wizardStep > step
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-neutral-100 text-neutral-400'
                            ]">{{ step }}</div>
                            <span :class="['text-xs font-medium', wizardStep === step ? 'text-neutral-900' : 'text-neutral-400']">
                                {{ step === 1 ? 'Info Dasar' : step === 2 ? 'Shells & Sizes' : 'Trims & Material' }}
                            </span>
                            <ChevronRightIcon v-if="step < 3" class="w-3.5 h-3.5 text-neutral-300" />
                        </div>
                    </div>
                </DialogHeader>

                <!-- ── STEP 1: Info Dasar ─────────────────────── -->
                <div v-if="wizardStep === 1" class="p-6 space-y-5">
                    <!-- Cascading PO Dropdown -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="space-y-1.5">
                            <label class="text-xs font-semibold text-neutral-700">PO Client <span class="text-red-500">*</span></label>
                            <select
                                :value="step1.selectedPOId ?? ''"
                                @change="onPOSelect(Number(($event.target as HTMLSelectElement).value))"
                                class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition"
                            >
                                <option value="">Pilih PO Client...</option>
                                <option v-for="po in poList" :key="po.id_po_client" :value="po.id_po_client">
                                    {{ po.po_number }} — {{ po.mitra_name }}
                                </option>
                            </select>
                        </div>

                        <div class="space-y-1.5">
                            <label class="text-xs font-semibold text-neutral-700">PO Item (Style / Colour) <span class="text-red-500">*</span></label>
                            <select
                                v-model="step1.id_po_client_item"
                                :disabled="!step1.selectedPOId || isLoadingPOItems"
                                class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed"
                            >
                                <option value="">{{ isLoadingPOItems ? 'Memuat item...' : 'Pilih PO Item...' }}</option>
                                <option v-for="item in poItemOptions" :key="item.id_po_client_item" :value="item.id_po_client_item">
                                    {{ item.style }} — {{ item.colour }} ({{ item.qty }} pcs)
                                </option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="space-y-1.5">
                            <label class="text-xs font-semibold text-neutral-700">Buyer <span class="text-red-500">*</span></label>
                            <input v-model="step1.buyer" type="text" placeholder="cth: ADIDAS"
                                class="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition" />
                        </div>
                        <div class="space-y-1.5">
                            <label class="text-xs font-semibold text-neutral-700">Model <span class="text-red-500">*</span></label>
                            <input v-model="step1.model" type="text" placeholder="cth: Running Jacket V2"
                                class="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition" />
                        </div>
                        <div class="space-y-1.5">
                            <label class="text-xs font-semibold text-neutral-700">Qty <span class="text-red-500">*</span></label>
                            <input v-model.number="step1.qty" type="number" min="1" placeholder="cth: 1000"
                                class="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition" />
                            <p v-if="maxQty" class="text-[10px] text-neutral-500 mt-0.5">Maks. Qty PO Item: {{ maxQty }} pcs</p>
                            <p v-if="step1.qty && maxQty && step1.qty > maxQty" class="text-[10px] text-red-500 font-semibold mt-0.5">Qty tidak boleh melebihi {{ maxQty }} pcs!</p>
                        </div>
                        <div class="space-y-1.5">
                            <label class="text-xs font-semibold text-neutral-700">Delivery Date <span class="text-red-500">*</span></label>
                            <input v-model="step1.delivery" type="date"
                                class="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition" />
                        </div>
                    </div>

                    <div class="space-y-1.5">
                        <label class="text-xs font-semibold text-neutral-700">Jenis Maklon <span class="text-red-500">*</span></label>
                        <div class="flex gap-3">
                            <label v-for="opt in [{ label: 'FOB (Free On Board)', value: 'true' }, { label: 'CMT (Cut, Make, Trim)', value: 'false' }]"
                                :key="opt.value"
                                :class="[
                                    'flex-1 flex items-center gap-2.5 border rounded-lg px-4 py-3 cursor-pointer transition',
                                    step1.fob_cmt === opt.value
                                        ? 'border-neutral-900 bg-neutral-50'
                                        : 'border-neutral-200 hover:border-neutral-300'
                                ]">
                                <input type="radio" :value="opt.value" v-model="step1.fob_cmt" class="accent-neutral-900" />
                                <span class="text-sm font-medium text-neutral-700">{{ opt.label }}</span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- ── STEP 2: Shells & Sizes ─────────────────── -->
                <div v-if="wizardStep === 2" class="p-6 space-y-5">
                    <div class="flex items-center justify-between">
                        <p class="text-sm text-neutral-500">Tambahkan kain utama (Shell) beserta distribusi ukurannya.</p>
                        <Button variant="outline" size="sm" class="border-neutral-300 shadow-xs" @click="addShell">
                            <PlusCircleIcon class="w-4 h-4 mr-1.5" /> Tambah Shell
                        </Button>
                    </div>

                    <div v-if="shells.length === 0" class="text-center py-8 border-2 border-dashed border-neutral-200 rounded-xl text-neutral-400 text-sm">
                        Belum ada shell. Klik "Tambah Shell" untuk memulai.
                    </div>

                    <div v-for="(shell, si) in shells" :key="si" class="border border-neutral-200 rounded-xl p-4 space-y-4 bg-neutral-50/40">
                        <!-- Shell Header -->
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-neutral-600 uppercase tracking-wider">Shell #{{ si + 1 }}</span>
                            <button @click="removeShell(si)" type="button" class="text-neutral-400 hover:text-red-500 transition">
                                <Trash2Icon class="w-4 h-4" />
                            </button>
                        </div>

                        <!-- Shell Fields -->
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div class="space-y-1 col-span-2 sm:col-span-1">
                                <label class="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Fabric *</label>
                                <input v-model="shell.fabric" type="text" placeholder="cth: Ripstop Nylon"
                                    class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition" />
                            </div>
                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Color *</label>
                                <input v-model="shell.color" type="text" placeholder="cth: Navy Blue"
                                    class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition" />
                            </div>
                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-neutral-500 uppercase">Cons (yd) *</label>
                                <input v-model.number="shell.cons" type="number" step="0.001" min="0.001" placeholder="1.5"
                                    class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition" />
                            </div>
                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-neutral-500 uppercase">Allow (%) *</label>
                                <input v-model.number="shell.allow" type="number" min="1" placeholder="3"
                                    class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition" />
                            </div>
                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-neutral-500 uppercase">Berat/yd (kg) *</label>
                                <input v-model.number="shell.berat_1_yd" type="number" step="0.001" min="0.001" placeholder="0.8"
                                    class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition" />
                            </div>
                        </div>

                        <!-- Sizes Sub-table -->
                        <div class="space-y-2">
                            <div class="flex items-center justify-between">
                                <span class="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Distribusi Ukuran (Sizes) *</span>
                                <button 
                                    @click="addSize(si)" 
                                    type="button" 
                                    :disabled="!step1.qty || getShellTotalQty(si) >= step1.qty"
                                    class="text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <PlusCircleIcon class="w-3.5 h-3.5" /> Tambah Ukuran
                                </button>
                            </div>

                            <div v-if="shell.sizes.length === 0" class="text-center py-4 border border-dashed border-neutral-200 rounded-lg text-neutral-400 text-xs">
                                Belum ada ukuran.
                            </div>

                            <div v-else class="space-y-2">
                                <div class="border border-neutral-200 rounded-lg overflow-hidden">
                                    <table class="w-full text-xs">
                                        <thead class="bg-neutral-50 border-b border-neutral-200">
                                            <tr>
                                                <th class="px-3 py-2 text-left text-[10px] font-bold text-neutral-500 uppercase">Size</th>
                                                <th class="px-3 py-2 text-left text-[10px] font-bold text-neutral-500 uppercase">Qty (pcs)</th>
                                                <th class="px-3 py-2 text-left text-[10px] font-bold text-neutral-500 uppercase">Ratio</th>
                                                <th class="px-3 py-2 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-neutral-100">
                                            <tr v-for="(size, zi) in shell.sizes" :key="zi" class="bg-white">
                                                <td class="px-3 py-2">
                                                    <select v-model="size.size"
                                                        class="w-full rounded border border-neutral-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-400 bg-white">
                                                        <option value="">Pilih Ukuran...</option>
                                                        <option v-for="opt in SIZE_OPTIONS" :key="opt" :value="opt" :disabled="isSizeDisabled(si, zi, opt)">
                                                            {{ opt }}
                                                        </option>
                                                    </select>
                                                </td>
                                                <td class="px-3 py-2">
                                                    <input v-model.number="size.qty" type="number" min="0" placeholder="200"
                                                        class="w-full rounded border border-neutral-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-400" />
                                                </td>
                                                <td class="px-3 py-2">
                                                    <input v-model.number="size.ratio" type="number" min="1" placeholder="2"
                                                        class="w-full rounded border border-neutral-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-400" />
                                                </td>
                                                <td class="px-3 py-2">
                                                    <button @click="removeSize(si, zi)" type="button" class="text-neutral-300 hover:text-red-400 transition">
                                                        <Trash2Icon class="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div class="flex justify-between items-center bg-neutral-100/70 px-3 py-2 rounded-lg text-xs font-semibold">
                                    <span class="text-neutral-600">Total Qty Sizes:</span>
                                    <span :class="getShellTotalQty(si) > (step1.qty || 0) ? 'text-red-600 font-bold' : 'text-neutral-800'">
                                        {{ getShellTotalQty(si) }} / {{ step1.qty || 0 }} pcs
                                    </span>
                                </div>
                                <p v-if="getShellTotalQty(si) > (step1.qty || 0)" class="text-[10px] text-red-500 font-semibold mt-1">
                                    Total qty sizes ({{ getShellTotalQty(si) }} pcs) tidak boleh melebihi Qty WO ({{ step1.qty }} pcs)!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ── STEP 3: Trims & Materials ──────────────── -->
                <div v-if="wizardStep === 3" class="p-6 space-y-6">
                    <!-- Trims Section -->
                    <div class="space-y-3">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-sm font-bold text-neutral-700">Trims / Aksesoris <span class="text-red-500">*</span></h3>
                                <p class="text-[10px] text-neutral-400 mt-0.5">Minimal 1 trim wajib diisi (syarat backend).</p>
                            </div>
                            <Button variant="outline" size="sm" class="border-neutral-300 shadow-xs" @click="addTrim">
                                <PlusCircleIcon class="w-4 h-4 mr-1.5" /> Tambah Trim
                            </Button>
                        </div>

                        <div v-if="trims.length === 0" class="text-center py-6 border-2 border-dashed border-red-200 rounded-xl text-red-400 text-sm">
                            ⚠️ Minimal 1 trim harus ditambahkan. Klik "Tambah Trim".
                        </div>

                        <div v-for="(trim, ti) in trims" :key="ti" class="border border-neutral-200 rounded-xl p-4 bg-neutral-50/40 space-y-3">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-bold text-neutral-500 uppercase tracking-wider">Trim #{{ ti + 1 }}</span>
                                <button @click="removeTrim(ti)" type="button" class="text-neutral-400 hover:text-red-500 transition">
                                    <Trash2Icon class="w-4 h-4" />
                                </button>
                            </div>
                            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div class="space-y-1 col-span-2 sm:col-span-1">
                                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Item</label>
                                    <input v-model="trim.item" type="text" placeholder="cth: Zipper"
                                        class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Code</label>
                                    <input v-model="trim.code" type="text" placeholder="cth: ZPR-001"
                                        class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Color</label>
                                    <select v-model="trim.color"
                                        class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition">
                                        <option value="">Pilih Warna...</option>
                                        <option v-for="color in shellColors" :key="color" :value="color">
                                            {{ color }}
                                        </option>
                                    </select>
                                    <p v-if="trim.color && hasDuplicateTrimColor(ti)" class="text-[9px] text-amber-600 font-semibold mt-0.5 leading-none">
                                        (Warna ini sudah digunakan di Trim lain)
                                    </p>
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Cons</label>
                                    <input v-model.number="trim.cons" type="number" step="0.001" min="0" placeholder="1.0"
                                        class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Qty</label>
                                    <input v-model.number="trim.qty" type="number" min="0" placeholder="100"
                                        class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[10px] font-bold text-neutral-500 uppercase">UOM</label>
                                    <input v-model="trim.uom" type="text" placeholder="PCS / SET"
                                        class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                                </div>
                                <div class="space-y-1 col-span-2">
                                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Description</label>
                                    <input v-model="trim.description" type="text" placeholder="Deskripsi singkat trim"
                                        class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Allow (%) *</label>
                                    <!-- required by backend: allow int32 binding:"required,gte=0" → non-zero -->
                                    <input v-model.number="trim.allow" type="number" min="1" placeholder="3"
                                        class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Position</label>
                                    <input v-model="trim.position" type="text" placeholder="cth: Front"
                                        class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Materials Section -->
                    <div class="space-y-3 border-t border-neutral-100 pt-5">
                        <div class="flex items-center justify-between">
                            <h3 class="text-sm font-bold text-neutral-700">Material List</h3>
                            <Button variant="outline" size="sm" class="border-neutral-300 shadow-xs" @click="addMaterial">
                                <PlusCircleIcon class="w-4 h-4 mr-1.5" /> Tambah Material
                            </Button>
                        </div>

                        <div v-if="materials.length === 0" class="text-center py-6 border-2 border-dashed border-neutral-200 rounded-xl text-neutral-400 text-sm">
                            Belum ada material. (Opsional)
                        </div>

                        <div v-for="(mat, mi) in materials" :key="mi" class="border border-neutral-200 rounded-xl p-4 bg-neutral-50/40 space-y-3">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-bold text-neutral-500 uppercase tracking-wider">Material #{{ mi + 1 }}</span>
                                <button @click="removeMaterial(mi)" type="button" class="text-neutral-400 hover:text-red-500 transition">
                                    <Trash2Icon class="w-4 h-4" />
                                </button>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="space-y-1 col-span-2">
                                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Description</label>
                                    <input v-model="mat.description" type="text" placeholder="cth: Kain Lining"
                                        class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Size</label>
                                    <input v-model="mat.size" type="text" placeholder="cth: All / M / L"
                                        class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Color</label>
                                    <input v-model="mat.color" type="text" placeholder="cth: Navy"
                                        class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[10px] font-bold text-neutral-500 uppercase">UOM</label>
                                    <input v-model="mat.uom" type="text" placeholder="PCS / M / YD"
                                        class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Dialog Footer — Navigation Buttons -->
                <div class="border-t border-neutral-100 px-6 py-4 flex justify-between items-center bg-neutral-50/60">
                    <Button
                        v-if="wizardStep > 1"
                        variant="outline"
                        class="border-neutral-300"
                        @click="wizardStep--"
                    >
                        <ChevronLeftIcon class="w-4 h-4 mr-1" /> Sebelumnya
                    </Button>
                    <div v-else />

                    <Button
                        v-if="wizardStep < 3"
                        :disabled="(wizardStep === 1 && !step1Valid) || (wizardStep === 2 && !step2Valid)"
                        class="bg-neutral-900 hover:bg-neutral-800 text-white"
                        @click="wizardStep++"
                    >
                        Selanjutnya <ChevronRightIcon class="w-4 h-4 ml-1" />
                    </Button>

                    <Button
                        v-else
                        :disabled="isSubmitting || !step2Valid || !step3Valid"
                        class="bg-emerald-600 hover:bg-emerald-700 text-white"
                        @click="handleSubmit"
                    >
                        {{ isSubmitting ? 'Menyimpan...' : 'Buat Work Order' }}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    </div>
</template>
