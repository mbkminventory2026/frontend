<script setup lang="ts">
import { ref, watch, onMounted, computed, reactive, nextTick } from 'vue';
import { useRouter } from '@tanstack/vue-router';
import {
  Wrench,
  ArrowLeftIcon,
  PlusCircleIcon,
  Trash2Icon,
  ChevronRightIcon,
  ChevronLeftIcon,
  CopyIcon
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { onClickOutside } from '@vueuse/core';

import { createWorkOrder } from '@/api/work-orders/work-orders';
import { getPOClients, getPOClientById, type POClientListItem, type POClientItemResponse } from '@/api/po-clients/po-clients';
import { getMitra } from '@/api/mitra/mitra';
import { type MitraResponseItem } from '@/schemas/mitra/response';
import { usePermission } from '@/composables/usePermission';
import { createWarna, getWarna } from '@/api/warna/warna';
import { createSize, getSize } from '@/api/size/size';
import type { WarnaResponseItem } from '@/schemas/warna/response';
import type { SizeResponseItem } from '@/schemas/size/response';

import { parseToFloat, parseToInt } from '@/lib/number';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SearchableSelect } from '@/components/ui/searchable-select';

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
  fetchColorOptions();
  fetchSizeOptions();
  fetchBuyerList();
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
  qty: null as any,
  delivery: '',
  fob_cmt: 'false' as 'true' | 'false',
});

// Step 1 — PO & PO Items dropdown
const poList = ref<POClientListItem[]>([]);
const poItemOptions = ref<(POClientItemResponse & { id_po_client_item: number })[]>([]);
const isLoadingPOItems = ref(false);
const maxQty = ref<number | null>(null);
const poDeliveryDate = ref('');
const colorOptions = ref<WarnaResponseItem[]>([]);
const sizeOptions = ref<SizeResponseItem[]>([]);

const colorSelectOptions = computed(() =>
  colorOptions.value.map(w => ({ value: w.nama_warna, label: w.nama_warna }))
);
const sizeSelectOptions = computed(() =>
  sizeOptions.value.map(s => ({ value: String(s.id_size), label: s.nama_size }))
);

const fetchColorOptions = async () => {
  try {
    const res = await getWarna({ limit: 1000, offset: 0 });
    colorOptions.value = res.results || [];
  } catch (e) {
    console.error('Gagal fetch data warna:', e);
  }
};

const fetchSizeOptions = async () => {
  try {
    const res = await getSize({ limit: 1000, offset: 0 });
    sizeOptions.value = res.results || [];
  } catch (e) {
    console.error('Gagal fetch data size:', e);
  }
};

const parseNumber = parseToFloat;
const parseInteger = parseToInt;
const canQuickCreateWarna = computed(() => hasPermission('MASTER_WARNA_CREATE'));
const canQuickCreateSize = computed(() => hasPermission('MASTER_SIZE_CREATE'));

const fetchPOList = async () => {
  try {
    const res = await getPOClients({ limit: 100, offset: 0 });
    poList.value = res.results;
  } catch (e) {
    console.error('Gagal fetch PO list:', e);
  }
};

const buyerList = ref<MitraResponseItem[]>([]);
const isLoadingBuyers = ref(false);

const fetchBuyerList = async () => {
  isLoadingBuyers.value = true;
  try {
    const res = await getMitra({ limit: 1000 });
    buyerList.value = (res.results || []).filter(
      (m: any) => m.tipe_perusahaan?.toUpperCase() === 'CLIENT'
    );
  } catch (e) {
    console.error('Gagal fetch buyer list:', e);
  } finally {
    isLoadingBuyers.value = false;
  }
};

const filteredPoList = computed(() => {
  if (!step1.buyer) return [];
  return poList.value.filter(po => po.mitra_name === step1.buyer);
});

const onBuyerChange = () => {
  step1.selectedPOId = null;
  step1.id_po_client_item = null;
  poItemOptions.value = [];
  poDeliveryDate.value = '';
  maxQty.value = null;
};

// Searchable Buyer Select State & Logic
const isBuyerDropdownOpen = ref(false);
const buyerSearchQuery = ref('');
const buyerDropdownRef = ref<HTMLElement | null>(null);
const buyerSearchInput = ref<HTMLInputElement | null>(null);

onClickOutside(buyerDropdownRef, () => {
  isBuyerDropdownOpen.value = false;
});

const filteredBuyers = computed(() => {
  const q = buyerSearchQuery.value.toLowerCase().trim();
  if (!q) return buyerList.value;
  return buyerList.value.filter(b => b.nama_perusahaan.toLowerCase().includes(q));
});

const selectBuyer = (buyerName: string) => {
  step1.buyer = buyerName;
  onBuyerChange();
  isBuyerDropdownOpen.value = false;
  buyerSearchQuery.value = '';
};

watch(isBuyerDropdownOpen, async (newVal) => {
  if (newVal) {
    await nextTick();
    buyerSearchInput.value?.focus();
  }
});

const onPOSelect = async (poId: number) => {
  step1.selectedPOId = poId;
  step1.id_po_client_item = null;
  poItemOptions.value = [];
  poDeliveryDate.value = '';
  maxQty.value = null;
  if (!poId) {
    return;
  }

  isLoadingPOItems.value = true;
  try {
    const detail = await getPOClientById(poId);
    poDeliveryDate.value = detail.delivery ? detail.delivery.split('T')[0] : '';
    step1.buyer = detail.mitra_name || '';
    
    // PERBAIKAN: Filter item garmen yang BELUM memiliki id_wo (id_wo null atau undefined)
    const availableItems = (detail.items || []).filter((item: any) => !item.id_wo);
    
    poItemOptions.value = availableItems.map((item: any) => ({
      ...item,
      id_po_client_item: item.id_po_client_item,
    }));

    // Beri info jika semua item dari PO tersebut sudah diproses
    if (detail.items?.length > 0 && availableItems.length === 0) {
      toast.info('Semua item garmen di dalam PO ini sudah dikonfigurasi ke Work Order.');
    }
  } catch (e) {
    console.error('Gagal fetch PO items:', e);
    toast.error('Gagal mengambil daftar item PO Client.');
  } finally {
    isLoadingPOItems.value = false;
  }
};

// Prefill WO fields when PO client item is selected
watch(() => step1.id_po_client_item, (newVal) => {
  if (!newVal) {
    maxQty.value = null;
    step1.qty = null;
    step1.model = '';
    return;
  }
  const selectedItem = poItemOptions.value.find(item => item.id_po_client_item === Number(newVal));
  if (selectedItem) {
    maxQty.value = selectedItem.qty;
    step1.model = selectedItem.style || '';
    step1.qty = selectedItem.qty;
    if (poDeliveryDate.value) {
      step1.delivery = poDeliveryDate.value;
    }
  }
});

// Step 2: Shells
interface ShellSize { id_size: number | null; size: string; ratio: any; }
interface Shell { material_type: string; deskripsi: string; color: string; cons: any; allow: any; qty_per_ratio: any; berat_1_yd: any; sizes: ShellSize[]; }
interface ColorDialogTarget { kind: 'shell' | 'trim'; index: number; }
interface SizeDialogTarget { shellIndex: number; sizeIndex: number; }

const shells = ref<Shell[]>([
  { material_type: 'fabric', deskripsi: '', color: '', cons: 0, allow: 2, qty_per_ratio: 0, berat_1_yd: 0, sizes: [{ id_size: null, size: '', ratio: 1 }] }
]);

const addShell = () => {
  shells.value.push({ material_type: 'fabric', deskripsi: '', color: '', cons: 0, allow: 2, qty_per_ratio: 0, berat_1_yd: 0, sizes: [] });
};
const removeShell = (i: number) => shells.value.splice(i, 1);
const duplicateShell = (i: number) => {
  const s = shells.value[i];
  if (s) {
    shells.value.splice(i + 1, 0, { ...s, sizes: s.sizes.map(sz => ({ ...sz })) });
    toast.success('Shell berhasil diduplikasi.');
  }
};
const addSize = (shellIdx: number) => {
  const shell = shells.value[shellIdx];
  if (shell) {
    shell.sizes.push({ id_size: null, size: '', ratio: 1 });
  }
};
const removeSize = (shellIdx: number, sizeIdx: number) => {
  const shell = shells.value[shellIdx];
  if (shell) {
    shell.sizes.splice(sizeIdx, 1);
  }
};

const onSizeSelect = (shellIdx: number, sizeIdx: number, idSizeValue: string) => {
  const shell = shells.value[shellIdx];
  const size = shell?.sizes[sizeIdx];
  if (!size) return;

  const idSize = Number(idSizeValue);
  const selected = sizeOptions.value.find((option) => option.id_size === idSize);

  size.id_size = selected?.id_size ?? null;
  size.size = selected?.nama_size ?? '';
};

const quickWarnaDialogOpen = ref(false);
const quickSizeDialogOpen = ref(false);
const isCreatingWarna = ref(false);
const isCreatingSize = ref(false);
const quickWarnaTarget = ref<ColorDialogTarget | null>(null);
const quickSizeTarget = ref<SizeDialogTarget | null>(null);
const quickWarnaForm = reactive({
  nama_warna: '',
  kode_hex: '',
});
const quickSizeForm = reactive({
  nama_size: '',
});

const resetQuickWarnaForm = () => {
  quickWarnaForm.nama_warna = '';
  quickWarnaForm.kode_hex = '';
};

const resetQuickSizeForm = () => {
  quickSizeForm.nama_size = '';
};

const openQuickWarnaDialog = (target: ColorDialogTarget) => {
  quickWarnaTarget.value = target;
  resetQuickWarnaForm();
  quickWarnaDialogOpen.value = true;
};

const openQuickSizeDialog = (shellIndex: number, sizeIndex: number) => {
  quickSizeTarget.value = { shellIndex, sizeIndex };
  resetQuickSizeForm();
  quickSizeDialogOpen.value = true;
};

const extractApiErrorMessage = (error: any, fallback: string) => {
  return error?.response?.data?.message || error?.response?.data?.error || fallback;
};

const submitQuickWarna = async () => {
  if (!quickWarnaForm.nama_warna.trim()) {
    toast.error('Nama warna wajib diisi.');
    return;
  }

  isCreatingWarna.value = true;
  try {
    const response = await createWarna({
      nama_warna: quickWarnaForm.nama_warna.trim(),
      kode_hex: quickWarnaForm.kode_hex.trim() || undefined,
    });
    const created = response.data as WarnaResponseItem;
    await fetchColorOptions();

    if (quickWarnaTarget.value) {
      if (quickWarnaTarget.value.kind === 'shell') {
        const targetShell = shells.value[quickWarnaTarget.value.index];
        if (targetShell) {
          targetShell.color = created.nama_warna;
        }
      } else {
        const targetTrim = trims.value[quickWarnaTarget.value.index];
        if (targetTrim) {
          targetTrim.color = created.nama_warna;
        }
      }
    }

    toast.success('Warna berhasil ditambahkan.');
    quickWarnaDialogOpen.value = false;
    quickWarnaTarget.value = null;
  } catch (error: any) {
    toast.error(extractApiErrorMessage(error, 'Gagal menambahkan warna.'));
  } finally {
    isCreatingWarna.value = false;
  }
};

const submitQuickSize = async () => {
  if (!quickSizeForm.nama_size.trim()) {
    toast.error('Nama size wajib diisi.');
    return;
  }

  isCreatingSize.value = true;
  try {
    const response = await createSize({
      nama_size: quickSizeForm.nama_size.trim(),
    });
    const created = response.data as SizeResponseItem;
    await fetchSizeOptions();

    if (quickSizeTarget.value) {
      const targetShell = shells.value[quickSizeTarget.value.shellIndex];
      const targetSize = targetShell?.sizes[quickSizeTarget.value.sizeIndex];
      if (targetSize) {
        targetSize.id_size = created.id_size;
        targetSize.size = created.nama_size;
      }
    }

    toast.success('Size berhasil ditambahkan.');
    quickSizeDialogOpen.value = false;
    quickSizeTarget.value = null;
  } catch (error: any) {
    toast.error(extractApiErrorMessage(error, 'Gagal menambahkan size.'));
  } finally {
    isCreatingSize.value = false;
  }
};

const getSizeCalculatedQty = (shell: Shell, size: ShellSize) => {
  const qtyPerRatio = parseInteger(shell.qty_per_ratio) || 0;
  const ratio = parseToFloat(size.ratio) || 0;
  return Math.round(qtyPerRatio * ratio);
};

const handleRatioChange = (shellIdx: number, sizeIdx: number, val: string) => {
  const shell = shells.value[shellIdx];
  if (shell && shell.sizes[sizeIdx]) {
    shell.sizes[sizeIdx]!.ratio = val.replace(/,/g, '.');
  }
};

const getShellTotalQty = (shellIdx: number) => {
  const shell = shells.value[shellIdx];
  if (!shell || !shell.sizes) return 0;
  return shell.sizes.reduce((acc, sz) => acc + getSizeCalculatedQty(shell, sz), 0);
};

const getShellTotalCons = (shellIdx: number) => {
  const shell = shells.value[shellIdx];
  if (!shell) return 0;
  const total = (parseNumber(shell.cons) || 0) * getShellTotalQty(shellIdx);
  const allow = parseNumber(shell.allow) || 0;
  return total + total * (allow / 100);
};

// Sync step1.qty with the sum of all shell sizes' quantity
const calculatedTotalQty = computed(() => {
  return shells.value.reduce((acc, _, si) => acc + getShellTotalQty(si), 0);
});


// Step 3: Trims & Materials
interface Trim { item: string; description: string; color: string; code: string; cons: number; qty: number; uom: string; position: string; allow: number; provided_by: string; }
type MaterialSource = { type: 'shell'; index: number } | { type: 'trim'; index: number } | null;
interface Material { item: string; description: string; qty: any; unit: string; est_price: any; source: MaterialSource; }

const trims = ref<Trim[]>([
  { item: '', description: '', color: '', code: '', cons: 0, qty: 0, uom: 'PCS', position: '', allow: 2, provided_by: 'client' }
]);
const materials = ref<Material[]>([]);

const getTrimTotal = (trim: Trim) => {
  const cons = parseNumber(trim.cons) || 0;
  const qty = parseInteger(trim.qty) || 0;
  return cons * qty;
};

const getTrimTotalCons = (trim: Trim) => {
  const total = getTrimTotal(trim);
  const allow = parseNumber(trim.allow) || 0;
  return total + total * (allow / 100);
};

const addTrim = () => {
  trims.value.push({ item: '', description: '', color: '', code: '', cons: 0, qty: 0, uom: 'PCS', position: '', allow: 2, provided_by: 'client' });
};
const removeTrim = (i: number) => trims.value.splice(i, 1);

const duplicateTrim = (i: number) => {
  const t = trims.value[i];
  if (t) {
    trims.value.splice(i + 1, 0, { ...t });
    toast.success('Trim berhasil diduplikasi.');
  }
};

const addMaterial = () => {
  materials.value.push({ item: '', description: '', qty: 0, unit: '', est_price: 0, source: null });
};

// Indices already used in other material rows (prevent duplicate linking)
const usedShellIndices = computed(() =>
  materials.value.map(m => m.source?.type === 'shell' ? m.source.index : -1).filter(i => i >= 0)
);
const usedTrimIndices = computed(() =>
  materials.value.map(m => m.source?.type === 'trim' ? m.source.index : -1).filter(i => i >= 0)
);

// Pilih source (shell/trim) → prefill item, unit, qty
const onMaterialSourceChange = (mi: number, val: string) => {
  const mat = materials.value[mi];
  if (!mat) return;
  if (!val) {
    mat.source = null;
    mat.item = '';
    mat.unit = '';
    mat.qty = 0;
    return;
  }
  const [type, idxStr] = val.split(':');
  const idx = parseInt(idxStr || '0');
  if (type === 'shell') {
    const s = shells.value[idx];
    mat.source = { type: 'shell', index: idx };
    mat.item = s?.deskripsi || '';
    mat.unit = 'yds';
    mat.qty = getShellTotalQty(idx);
  } else if (type === 'trim') {
    const t = trims.value[idx];
    mat.source = { type: 'trim', index: idx };
    mat.item = t?.item || '';
    mat.unit = t?.uom || '';
    mat.qty = parseInteger(t?.qty) || 0;
  }
};

// Auto-generate material items dari semua shell dan trim yang belum ditautkan
const autoGenerateMaterials = () => {
  const newItems: typeof materials.value = [];
  shells.value.forEach((s, si) => {
    if (!usedShellIndices.value.includes(si)) {
      newItems.push({
        item: s.deskripsi,
        description: '',
        qty: getShellTotalQty(si),
        unit: 'yds',
        est_price: 0,
        source: { type: 'shell', index: si },
      });
    }
  });
  trims.value.forEach((t, ti) => {
    if (t.item.trim() && !usedTrimIndices.value.includes(ti)) {
      newItems.push({
        item: t.item,
        description: t.description || '',
        qty: parseInteger(t.qty) || 0,
        unit: t.uom || 'PCS',
        est_price: 0,
        source: { type: 'trim', index: ti },
      });
    }
  });
  if (newItems.length === 0) {
    toast.info('Semua Shell dan Trim sudah ditautkan ke Material List.');
    return;
  }
  materials.value.push(...newItems);
  toast.success(`${newItems.length} item material ditambahkan otomatis.`);
};

const removeMaterial = (i: number) => materials.value.splice(i, 1);


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
  step1.qty && parseInteger(step1.qty) > 0 &&
  step1.delivery
);

const step2Valid = computed(() =>
  shells.value.length > 0 &&
  shells.value.every((s) =>
    s.material_type.trim() &&
    s.deskripsi.trim() &&
    s.color.trim() &&
    parseNumber(s.cons) > 0 &&
    parseInteger(s.allow) >= 1 &&
    parseInteger(s.qty_per_ratio) > 0 &&
    parseNumber(s.berat_1_yd) >= 0 &&
    s.sizes.length > 0 &&
    s.sizes.every(sz => !!sz.id_size && parseToFloat(sz.ratio) > 0)
  ) &&
  calculatedTotalQty.value <= (parseInteger(step1.qty) || 0)
);

const step3Valid = computed(() =>
  trims.value.length >= 1 &&
  trims.value.every(t =>
    t.item.trim() &&
    parseNumber(t.cons) > 0 &&
    parseInteger(t.qty) > 0 &&
    t.uom.trim() &&
    parseInteger(t.allow) >= 1 &&
    t.provided_by.trim()
  ) &&
  // materials are optional (omitempty) but if added, must have item and unit
  materials.value.every(m => m.item.trim() && m.unit.trim())
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
        material_type: s.material_type,
        deskripsi: s.deskripsi,
        provided_by: 'permatatex',
        color: s.color,
        cons: parseNumber(s.cons),
        allow: parseInteger(s.allow),
        berat_1_yd: parseNumber(s.berat_1_yd),
        sizes: s.sizes.map(sz => ({
          id_size: sz.id_size,
          size: sz.size,
          qty: getSizeCalculatedQty(s, sz),
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
        provided_by: t.provided_by,
      })),
      material_list_items: materials.value.map(m => ({
        item: m.item,
        description: m.description,
        qty: parseInteger(m.qty),
        unit: m.unit,
        est_price: parseNumber(m.est_price),
        shell_index: m.source?.type === 'shell' ? m.source.index : undefined,
        trim_index: m.source?.type === 'trim' ? m.source.index : undefined,
      })),
    };

    await createWorkOrder(payload);
    toast.success('Work Order berhasil dibuat!');
    router.navigate({ to: '/work-order' });
  } catch (error: any) {
      console.error('Gagal membuat Work Order. Payload:', payload, 'Response error:', error.response?.data);
      
      const backendError = error.response?.data?.error;
      const backendMessage = error.response?.data?.message;

      // PERBAIKAN: Jika backend mengirimkan pesan konflik berbentuk string langsung
      if (typeof backendError === 'string') {
        toast.error(backendError);
      } else if (backendMessage) {
        toast.error(backendMessage);
      } else if (Array.isArray(backendError)) {
        // Jika terjadi error skema array validator dari Gin
        const fieldErrs = backendError.map((d: any) => `${d.field}: ${d.message}`).join(', ');
        toast.error(`Gagal membuat Work Order: (${fieldErrs})`);
      } else {
        toast.error('Gagal membuat Work Order. Silakan cek koneksi jaringan Anda.');
      }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="container mx-auto py-8 max-w-7xl">
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
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="space-y-1.5 relative" ref="buyerDropdownRef">
                <label class="text-xs font-semibold text-neutral-700">Buyer <span class="text-red-500">*</span></label>
                
                <!-- Trigger Button -->
                <button
                  type="button"
                  @click="isBuyerDropdownOpen = !isBuyerDropdownOpen"
                  class="w-full flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition text-left h-[38px]"
                  :class="{'border-neutral-400 ring-2 ring-neutral-900/20': isBuyerDropdownOpen}"
                >
                  <span>{{ step1.buyer || 'Pilih Buyer...' }}</span>
                  <svg class="w-4 h-4 text-neutral-500 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <!-- Dropdown Panel -->
                <div
                  v-if="isBuyerDropdownOpen"
                  class="absolute z-50 left-0 right-0 mt-1 rounded-lg border border-neutral-200 bg-white shadow-lg overflow-hidden flex flex-col max-h-60"
                >
                  <!-- Search Input -->
                  <div class="p-2 border-b border-neutral-100 bg-neutral-50/50">
                    <input
                      ref="buyerSearchInput"
                      v-model="buyerSearchQuery"
                      type="text"
                      placeholder="Cari buyer..."
                      class="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900/40 focus:border-neutral-400"
                      @keydown.esc="isBuyerDropdownOpen = false"
                    />
                  </div>

                  <!-- Options List -->
                  <div class="overflow-y-auto py-1">
                    <div v-if="filteredBuyers.length === 0" class="px-3 py-2 text-sm text-neutral-400 text-center">
                      Tidak ada buyer ditemukan
                    </div>
                    <button
                      v-else
                      v-for="buyer in filteredBuyers"
                      :key="buyer.id_mitra"
                      type="button"
                      @click="selectBuyer(buyer.nama_perusahaan)"
                      class="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none focus:bg-neutral-100 transition flex items-center justify-between"
                      :class="{'bg-neutral-50 font-semibold': step1.buyer === buyer.nama_perusahaan}"
                    >
                      <span>{{ buyer.nama_perusahaan }}</span>
                      <svg v-if="step1.buyer === buyer.nama_perusahaan" class="w-3.5 h-3.5 text-neutral-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-neutral-700">PO Client <span class="text-red-500">*</span></label>
                <select
                  :value="step1.selectedPOId ?? ''"
                  :disabled="!step1.buyer"
                  @change="onPOSelect(Number(($event.target as HTMLSelectElement).value))"
                  class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed"
                >
                  <option value="">Pilih PO Client...</option>
                  <option v-for="po in filteredPoList" :key="po.id_po_client" :value="po.id_po_client">
                    {{ po.po_number }}
                  </option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-neutral-700">PO Item (Style) <span class="text-red-500">*</span></label>
                <select
                  v-model="step1.id_po_client_item"
                  :disabled="!step1.selectedPOId || isLoadingPOItems"
                  class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {{ isLoadingPOItems ? 'Memuat item...' : (step1.selectedPOId && poItemOptions.length === 0) ? 'Tidak ada item garmen tersedia (Semua sudah memiliki WO)' : 'Pilih PO Item...' }}
                  </option>
                  <option v-for="item in poItemOptions" :key="item.id_po_client_item" :value="item.id_po_client_item">
                    {{ item.style }}{{ item.description ? ` - ${item.description}` : '' }} ({{ item.qty }} pcs)
                  </option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-neutral-700">Model <span class="text-red-500">*</span></label>
                <input v-model="step1.model" type="text" placeholder="cth: Running Jacket V2"
                  class="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-neutral-700">Qty <span class="text-red-500">*</span></label>
                <input
                  v-model="step1.qty"
                  type="text"
                  readonly
                  class="w-full rounded-lg border border-neutral-200 bg-neutral-50 cursor-not-allowed text-neutral-500 px-3 py-2 text-sm focus:outline-none"
                />
                <p class="text-[10px] text-neutral-500 mt-0.5">
                  Kuantitas terkunci sesuai dengan jumlah PO Client Item.
                </p>
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
                <div class="flex items-center gap-2">
                  <button @click="duplicateShell(si)" type="button" class="text-neutral-400 hover:text-neutral-700 transition" title="Duplikasi Shell">
                    <CopyIcon class="w-4 h-4" />
                  </button>
                  <button @click="removeShell(si)" type="button" class="text-neutral-400 hover:text-red-600 transition" title="Hapus Shell">
                    <Trash2Icon class="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              <!-- Shell Fields -->
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Material Type *</label>
                  <select v-model="shell.material_type"
                    class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition cursor-pointer h-9">
                    <option value="fabric">Fabric</option>
                    <option value="interlining">Interlining</option>
                  </select>
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Deskripsi *</label>
                  <input v-model="shell.deskripsi" type="text" placeholder="cth: Ripstop Nylon, 2016F"
                    class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-neutral-500 uppercase">Cons (yd) *</label>
                  <input v-model="shell.cons" @input="shell.cons = ($event.target as HTMLInputElement).value.replace(/,/g, '.')" @focus="($event.target as HTMLInputElement).select()" type="text" placeholder="1.5"
                    class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Color *</label>
                  <div class="flex items-center gap-2 min-w-0">
                    <SearchableSelect
                      v-model="shell.color"
                      :options="colorSelectOptions"
                      placeholder="Pilih warna"
                      class="flex-1 min-w-0"
                    />
                    <Button
                      v-if="canQuickCreateWarna"
                      type="button"
                      variant="outline"
                      size="sm"
                      class="shrink-0 border-neutral-300 px-2"
                      @click="openQuickWarnaDialog({ kind: 'shell', index: si })"
                    >
                      <PlusCircleIcon class="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-neutral-500 uppercase">Allow (%) *</label>
                  <input v-model="shell.allow" @focus="($event.target as HTMLInputElement).select()" type="text" placeholder="2"
                    class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-neutral-500 uppercase">Qty / Ratio *</label>
                  <input v-model="shell.qty_per_ratio" @focus="($event.target as HTMLInputElement).select()" type="text" placeholder="cth: 42"
                    class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-neutral-500 uppercase">Berat/Yard (Kg) *</label>
                  <input v-model="shell.berat_1_yd" @input="shell.berat_1_yd = ($event.target as HTMLInputElement).value.replace(/,/g, '.')" @focus="($event.target as HTMLInputElement).select()" type="text" placeholder="cth: 0.25"
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
                    class="text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 transition"
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
                          <th class="px-3 py-2 text-left text-[10px] font-bold text-neutral-500 uppercase">Ratio</th>
                          <th class="px-3 py-2 text-left text-[10px] font-bold text-neutral-500 uppercase">Total Qty</th>
                          <th class="px-3 py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-neutral-100">
                        <tr v-for="(size, zi) in shell.sizes" :key="zi" class="bg-white">
                          <td class="px-3 py-2">
                            <div class="flex items-center gap-2 min-w-0">
                              <SearchableSelect
                                :model-value="size.id_size ? String(size.id_size) : ''"
                                :options="sizeSelectOptions"
                                placeholder="Pilih size"
                                class="flex-1 min-w-0"
                                @update:model-value="onSizeSelect(si, zi, $event)"
                              />
                              <button
                                v-if="canQuickCreateSize"
                                @click="openQuickSizeDialog(si, zi)"
                                type="button"
                                class="shrink-0 text-neutral-400 hover:text-neutral-800 transition"
                                title="Tambah size"
                              >
                                <PlusCircleIcon class="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td class="px-3 py-2">
                            <input :value="size.ratio" @input="handleRatioChange(si, zi, ($event.target as HTMLInputElement).value)" @focus="($event.target as HTMLInputElement).select()" type="text" placeholder="1"
                              class="w-full rounded border border-neutral-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-400" />
                          </td>
                          <td class="px-3 py-2 font-medium text-neutral-700">
                            {{ getSizeCalculatedQty(shell, size) }} pcs
                          </td>
                          <td class="px-3 py-2">
                            <button @click="removeSize(si, zi)" type="button" class="hover:text-red-600 transition">
                              <Trash2Icon class="w-3.5 h-3.5 text-red-500" />
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div class="flex justify-between items-center bg-neutral-100/70 px-3 py-2 rounded-lg text-xs font-semibold">
                    <span class="text-neutral-600">Total QTY Sizes:</span>
                    <span class="text-neutral-800">{{ getShellTotalQty(si) }} pcs</span>
                  </div>
                  <div class="flex justify-between items-center bg-neutral-100/70 px-3 py-2 rounded-lg text-xs font-semibold">
                    <span class="text-neutral-600">Total Cons:</span>
                    <span class="text-neutral-800 font-mono">{{ getShellTotalCons(si).toLocaleString('id-ID', { maximumFractionDigits: 4 }) }} yd</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Global Summary for Step 2 -->
            <div class="border border-neutral-200 rounded-xl p-4 bg-neutral-50/80 flex flex-col gap-2 shadow-xs">
              <div class="flex justify-between items-center text-sm font-semibold">
                <span class="text-neutral-600">Total Akumulasi Seluruh Shell:</span>
                <span :class="['text-base font-bold', calculatedTotalQty > (parseInteger(step1.qty) || 0) ? 'text-red-600' : 'text-neutral-900']">
                  {{ calculatedTotalQty }} / {{ step1.qty || 0 }} pcs
                </span>
              </div>
              <p v-if="calculatedTotalQty > (parseInteger(step1.qty) || 0)" class="text-xs text-red-600 font-medium">
                ⚠️ Jumlah akumulasi ukuran shell ({{ calculatedTotalQty }} pcs) tidak boleh melebihi kuantitas PO Client Item ({{ step1.qty }} pcs).
              </p>
            </div>
          </div>

          <!-- ── STEP 3: Trims & Materials ──────────────── -->
          <div v-if="wizardStep === 3" class="p-6 space-y-6">
            <!-- Trims Section -->
            <div class="space-y-3">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 class="text-sm font-bold text-neutral-700">Trims / Aksesoris <span class="text-red-500">*</span></h3>
                  <p class="text-[10px] text-neutral-400 mt-0.5">Minimal 1 trim wajib diisi (syarat backend).</p>
                </div>
                <div class="flex items-center gap-2 flex-wrap">
                  <Button variant="outline" size="sm" class="border-neutral-300 shadow-xs text-xs" @click="addTrim">
                    <PlusCircleIcon class="w-4 h-4 mr-1.5" /> Tambah Trim
                  </Button>
                </div>
              </div>

              <div v-if="trims.length === 0" class="text-center py-6 border-2 border-dashed border-red-200 rounded-xl text-red-400 text-sm">
                ⚠️ Minimal 1 trim harus ditambahkan. Klik "Tambah Trim".
              </div>

              <div v-for="(trim, ti) in trims" :key="ti" class="border border-neutral-200 rounded-xl p-4 bg-neutral-50/40 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-neutral-500 uppercase tracking-wider">Trim #{{ ti + 1 }}</span>
                  <div class="flex items-center gap-2">
                    <button @click="duplicateTrim(ti)" type="button" class="text-neutral-400 hover:text-neutral-700 transition" title="Duplikasi Trim">
                      <CopyIcon class="w-4 h-4" />
                    </button>
                    <button @click="removeTrim(ti)" type="button" class="hover:text-red-600 transition" title="Hapus Trim">
                      <Trash2Icon class="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  <!-- Item -->
                  <div class="space-y-1">
                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Item *</label>
                    <input v-model="trim.item" type="text" placeholder="cth: Zipper"
                      class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                  </div>
                  <!-- Desc -->
                  <div class="space-y-1">
                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Desc</label>
                    <input v-model="trim.description" type="text" placeholder="Deskripsi singkat"
                      class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                  </div>
                  <!-- Color -->
                  <div class="space-y-1">
                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Color</label>
                    <div class="flex items-center gap-2 min-w-0">
                      <SearchableSelect
                        v-model="trim.color"
                        :options="colorSelectOptions"
                        placeholder="Pilih warna"
                        class="flex-1 min-w-0"
                      />
                      <Button
                        v-if="canQuickCreateWarna"
                        type="button"
                        variant="outline"
                        size="sm"
                        class="shrink-0 border-neutral-300 px-2"
                        @click="openQuickWarnaDialog({ kind: 'trim', index: ti })"
                      >
                        <PlusCircleIcon class="w-4 h-4" />
                      </Button>
                    </div>
                    <p v-if="trim.color && hasDuplicateTrimColor(ti)" class="text-[9px] text-amber-600 font-semibold mt-0.5 leading-none">
                      (Warna sudah digunakan di Trim lain)
                    </p>
                  </div>
                  <!-- Code -->
                  <div class="space-y-1">
                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Code</label>
                    <input v-model="trim.code" type="text" placeholder="cth: ZPR-001"
                      class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                  </div>
                  <!-- Cons -->
                  <div class="space-y-1">
                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Cons *</label>
                    <input v-model="trim.cons" @focus="($event.target as HTMLInputElement).select()" type="text" placeholder="1.0"
                      class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                  </div>
                  <!-- QTY -->
                  <div class="space-y-1">
                    <label class="text-[10px] font-bold text-neutral-500 uppercase">QTY *</label>
                    <input v-model="trim.qty" @focus="($event.target as HTMLInputElement).select()" type="text" placeholder="100"
                      class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                  </div>
                  <!-- Total (Cons × QTY) -->
                  <div class="space-y-1">
                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Total</label>
                    <div class="h-9 flex items-center rounded-lg border border-neutral-100 bg-neutral-50 px-3 text-sm font-mono font-semibold text-neutral-700">
                      {{ getTrimTotal(trim).toLocaleString('id-ID', { maximumFractionDigits: 4 }) }}
                    </div>
                  </div>
                  <!-- Allow -->
                  <div class="space-y-1">
                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Allow (%) *</label>
                    <input v-model="trim.allow" @focus="($event.target as HTMLInputElement).select()" type="text" placeholder="2"
                      class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                  </div>
                  <!-- Total Cons (Total + Total × Allow%) -->
                  <div class="space-y-1">
                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Total Cons</label>
                    <div class="h-9 flex items-center rounded-lg border border-neutral-100 bg-neutral-50 px-3 text-sm font-mono font-semibold text-neutral-700">
                      {{ getTrimTotalCons(trim).toLocaleString('id-ID', { maximumFractionDigits: 4 }) }}
                    </div>
                  </div>
                  <!-- UOM -->
                  <div class="space-y-1">
                    <label class="text-[10px] font-bold text-neutral-500 uppercase">UOM *</label>
                    <input v-model="trim.uom" type="text" placeholder="PCS / SET"
                      class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                  </div>
                  <!-- Position -->
                  <div class="space-y-1">
                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Position</label>
                    <input v-model="trim.position" type="text" placeholder="cth: Front"
                      class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                  </div>
                  <!-- Provided By -->
                  <div class="space-y-1">
                    <label class="text-[10px] font-bold text-neutral-500 uppercase">By *</label>
                    <select v-model="trim.provided_by"
                      class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition cursor-pointer h-9">
                      <option value="client">Client</option>
                      <option value="permata">Permatatex</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Materials Section -->
            <div class="space-y-3 border-t border-neutral-100 pt-5">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-bold text-neutral-700">Material List <span class="text-neutral-400 font-normal">(Opsional)</span></h3>
                  <p class="text-[10px] text-neutral-400 mt-0.5">
                    Shell diisi: {{ usedShellIndices.length }}/{{ shells.length }} &nbsp;·&nbsp;
                    Trim diisi: {{ usedTrimIndices.length }}/{{ trims.length }}
                  </p>
                </div>
                <div class="flex gap-2">
                  <Button variant="outline" size="sm" class="border-emerald-300 text-emerald-700 hover:bg-emerald-50 shadow-xs" @click="autoGenerateMaterials">
                    <PlusCircleIcon class="w-4 h-4 mr-1.5" /> Auto-Generate
                  </Button>
                  <Button variant="outline" size="sm" class="border-neutral-300 shadow-xs" @click="addMaterial">
                    <PlusCircleIcon class="w-4 h-4 mr-1.5" /> Tambah Manual
                  </Button>
                </div>
              </div>

              <div v-if="materials.length === 0" class="text-center py-6 border-2 border-dashed border-neutral-200 rounded-xl text-neutral-400 text-sm">
                Klik <strong>Auto-Generate</strong> untuk mengisi otomatis dari Shell &amp; Trim, atau tambah manual.
              </div>

              <div v-for="(mat, mi) in materials" :key="mi" class="border border-neutral-200 rounded-xl p-4 bg-neutral-50/40 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-neutral-500 uppercase tracking-wider">Material #{{ mi + 1 }}</span>
                  <button @click="removeMaterial(mi)" type="button" class="hover:text-red-600 transition">
                    <Trash2Icon class="w-4 h-4 text-red-500" />
                  </button>
                </div>

                <!-- Source picker -->
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-neutral-500 uppercase">Tautkan ke Shell / Trim (Opsional)</label>
                  <select
                    :value="mat.source ? `${mat.source.type}:${mat.source.index}` : ''"
                    @change="onMaterialSourceChange(mi, ($event.target as HTMLSelectElement).value)"
                    class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition"
                  >
                    <option value="">-- Tidak ditautkan / Isi manual --</option>
                    <optgroup label="Shell (Kain)">
                      <option
                        v-for="(s, si) in shells" :key="`shell:${si}`" :value="`shell:${si}`"
                        :disabled="usedShellIndices.includes(si) && mat.source?.index !== si"
                      >
                        Shell #{{ si + 1 }} — {{ s.deskripsi }} ({{ s.color }}){{ usedShellIndices.includes(si) && mat.source?.index !== si ? ' ✓ sudah dipakai' : '' }}
                      </option>
                    </optgroup>
                    <optgroup label="Trim / Aksesoris">
                      <option
                        v-for="(t, ti) in trims" :key="`trim:${ti}`" :value="`trim:${ti}`"
                        :disabled="usedTrimIndices.includes(ti) && mat.source?.index !== ti"
                      >
                        Trim #{{ ti + 1 }} — {{ t.item }} ({{ t.color }}){{ usedTrimIndices.includes(ti) && mat.source?.index !== ti ? ' ✓ sudah dipakai' : '' }}
                      </option>
                    </optgroup>
                  </select>
                  <p v-if="mat.source" class="text-[10px] text-emerald-600 font-semibold">
                    ✓ Ditautkan ke {{ mat.source.type === 'shell' ? 'Shell' : 'Trim' }} #{{ mat.source.index + 1 }}
                    — item & unit diisi otomatis
                  </p>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div class="space-y-1 col-span-2">
                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Item / Nama Material *</label>
                    <input v-model="mat.item" type="text" placeholder="cth: Kain Lining"
                      class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                  </div>
                  <div class="space-y-1 col-span-2">
                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Description</label>
                    <input v-model="mat.description" type="text" placeholder="Deskripsi singkat"
                      class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Qty</label>
                    <input v-model="mat.qty" type="number" min="0" placeholder="0"
                      class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Unit *</label>
                    <input v-model="mat.unit" type="text" placeholder="PCS / YD / M"
                      class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                  </div>
                  <div class="space-y-1 col-span-2">
                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Est. Harga (Rp)</label>
                    <input v-model="mat.est_price" type="number" min="0" placeholder="0"
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

  <Dialog v-model:open="quickWarnaDialogOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Tambah Warna</DialogTitle>
        <DialogDescription>
          Tambahkan master warna baru tanpa keluar dari form Work Order.
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-4 py-2">
        <div class="space-y-1">
          <label class="text-sm font-medium text-neutral-700">Nama Warna</label>
          <input
            v-model="quickWarnaForm.nama_warna"
            type="text"
            placeholder="cth: Navy Blue"
            class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition"
          />
        </div>
        <div class="space-y-1">
          <label class="text-sm font-medium text-neutral-700">Kode Hex <span class="text-neutral-400">(opsional)</span></label>
          <input
            v-model="quickWarnaForm.kode_hex"
            type="text"
            placeholder="cth: #1E3A8A"
            class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" @click="quickWarnaDialogOpen = false">Batal</Button>
        <Button type="button" :disabled="isCreatingWarna" @click="submitQuickWarna">
          {{ isCreatingWarna ? 'Menyimpan...' : 'Simpan Warna' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <Dialog v-model:open="quickSizeDialogOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Tambah Size</DialogTitle>
        <DialogDescription>
          Tambahkan master size baru tanpa keluar dari form Work Order.
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-4 py-2">
        <div class="space-y-1">
          <label class="text-sm font-medium text-neutral-700">Nama Size</label>
          <input
            v-model="quickSizeForm.nama_size"
            type="text"
            placeholder="cth: XL / 32 / FREE SIZE"
            class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" @click="quickSizeDialogOpen = false">Batal</Button>
        <Button type="button" :disabled="isCreatingSize" @click="submitQuickSize">
          {{ isCreatingSize ? 'Menyimpan...' : 'Simpan Size' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
