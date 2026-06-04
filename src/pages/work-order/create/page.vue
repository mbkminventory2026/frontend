<script setup lang="ts">
import { ref, watch, onMounted, computed, reactive } from 'vue';
import { useRouter } from '@tanstack/vue-router';
import {
  Wrench,
  ArrowLeftIcon,
  PlusCircleIcon,
  Trash2Icon,
  ChevronRightIcon,
  ChevronLeftIcon
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { createWorkOrder } from '@/api/work-orders/work-orders';
import { getPOClients, getPOClientById, type POClientListItem, type POClientItemResponse } from '@/api/po-clients/po-clients';
import { usePermission } from '@/composables/usePermission';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const router = useRouter();
const { hasPermission } = usePermission();

// ─── Permission Guard ──────────────────────────────────
onMounted(() => {
  if (!hasPermission('WO_CREATE')) {
    toast.error('Anda tidak memiliki akses untuk melakukan action ini.');
    router.history.back();
    return;
  }
  fetchPOList();
});

// ─── Wizard State ──────────────────────────────────────
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

const shells = ref<Shell[]>([
  { fabric: '', color: '', cons: 0, allow: 0, berat_1_yd: 0, sizes: [{ size: '', qty: 0, ratio: 0 }] }
]);

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
interface Trim { item: string; description: string; color: string; code: string; cons: number; qty: number; uom: string; position: string; allow: number; }
interface Material { description: string; size: string; color: string; uom: string; }

const trims = ref<Trim[]>([
  { item: '', description: '', color: '', code: '', cons: 0, qty: 0, uom: 'PCS', position: '', allow: 1 }
]);
const materials = ref<Material[]>([]);

const addTrim = () => {
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

// ─── Validations ──────────────────────────────────────────
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
    s.cons > 0 &&
    s.allow >= 1 &&
    s.berat_1_yd > 0 &&
    s.sizes.length > 0 &&
    s.sizes.every(sz => sz.size.trim() && sz.qty > 0 && sz.ratio >= 1) &&
    getShellTotalQty(si) <= (step1.qty || 0)
  )
);

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
    router.navigate({ to: '/work-order' });
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
</script>

<template>
  <div class="container mx-auto py-8 max-w-3xl">
    <!-- No Permission State -->
    <div v-if="!hasPermission('WO_CREATE')" class="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div class="bg-muted p-4 rounded-full">
        <span class="text-muted-foreground">🔒</span>
      </div>
      <h2 class="text-2xl font-bold">Akses Ditolak</h2>
      <p class="text-muted-foreground">Anda tidak memiliki permission untuk melakukan action ini.</p>
      <Button @click="router.history.back()">Kembali</Button>
    </div>

    <!-- Form Content -->
    <div v-else>
      <!-- Header -->
      <div class="flex items-center gap-4 mb-8">
        <Button @click="router.history.back()" variant="ghost" size="sm" class="px-2">
          <ArrowLeftIcon class="w-4 h-4" />
        </Button>
        <div class="flex-1">
          <h1 class="text-3xl font-bold tracking-tight">Tambah Work Order</h1>
          <p class="text-muted-foreground text-sm mt-1">Isi informasi Work Order baru dalam 3 langkah.</p>
        </div>
      </div>

      <!-- Card Container for Wizard -->
      <Card class="border-none shadow-md">
        <!-- Dialog-like Header in Card -->
        <CardHeader class="bg-muted/30 pb-4 border-b border-neutral-100">
          <CardTitle class="flex items-center gap-2">
            <Wrench class="w-5 h-5 text-primary" />
            <span>Form Work Order</span>
          </CardTitle>

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
        </CardHeader>

        <CardContent class="p-0">
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
          <div class="border-t border-neutral-100 px-6 py-4 flex justify-between items-center bg-neutral-50/60 rounded-b-xl">
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
        </CardContent>
      </Card>
    </div>
  </div>
</template>
