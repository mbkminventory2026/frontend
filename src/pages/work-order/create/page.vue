<script setup lang="ts">
import { ref, watch, onMounted, computed, reactive } from 'vue';
import { useRouter } from '@tanstack/vue-router';
import {
  Wrench,
  ArrowLeftIcon,
  PlusCircleIcon,
  Trash2Icon,
  ChevronRightIcon,
  ChevronLeftIcon,
  SparklesIcon,
  CopyIcon
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { createWorkOrder } from '@/api/work-orders/work-orders';
import { getPOClients, getPOClientById, type POClientListItem, type POClientItemResponse } from '@/api/po-clients/po-clients';
import { usePermission } from '@/composables/usePermission';
import { getWarna } from '@/api/warna/warna';

import { parseToFloat, parseToInt } from '@/lib/number';

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
  fetchColorOptions();
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
const colorOptions = ref<any[]>([]);

const fetchColorOptions = async () => {
  try {
    const res = await getWarna({ limit: 1000, offset: 0 });
    colorOptions.value = res.results || [];
  } catch (e) {
    console.error('Gagal fetch data warna:', e);
  }
};

const parseNumber = parseToFloat;
const parseInteger = parseToInt;

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
  if (!poId) {
    step1.buyer = '';
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
interface ShellSize { size: string; qty: any; ratio: any; }
interface Shell { material_type: string; deskripsi: string; provided_by: string; color: string; cons: any; allow: any; berat_1_yd: any; sizes: ShellSize[]; }

const shells = ref<Shell[]>([
  { material_type: 'fabric', deskripsi: '', provided_by: 'permatatex', color: '', cons: 0, allow: 0, berat_1_yd: 0, sizes: [{ size: '', qty: 0, ratio: 1 }] }
]);

const addShell = () => {
  shells.value.push({ material_type: 'fabric', deskripsi: '', provided_by: 'permatatex', color: '', cons: 0, allow: 0, berat_1_yd: 0, sizes: [] });
};
const removeShell = (i: number) => shells.value.splice(i, 1);
const addSize = (shellIdx: number) => {
  const shell = shells.value[shellIdx];
  if (shell) {
    shell.sizes.push({ size: '', qty: 0, ratio: 1 });
  }
};
const removeSize = (shellIdx: number, sizeIdx: number) => {
  const shell = shells.value[shellIdx];
  if (shell) {
    shell.sizes.splice(sizeIdx, 1);
  }
};

const handleQtyChange = (shellIdx: number, sizeIdx: number, val: string) => {
  const shell = shells.value[shellIdx];
  if (shell && shell.sizes[sizeIdx]) {
    const size = shell.sizes[sizeIdx];
    size.qty = val;
  }
};

const handleRatioChange = (shellIdx: number, sizeIdx: number, val: string) => {
  const shell = shells.value[shellIdx];
  if (shell && shell.sizes[sizeIdx]) {
    const size = shell.sizes[sizeIdx];
    const sanitizedVal = val.replace(/,/g, '.');
    size.ratio = sanitizedVal;
  }
};

const getSizeCalculatedQty = (size: ShellSize) => {
  const qty = parseInteger(size.qty) || 0;
  const ratio = parseToFloat(size.ratio) || 0;
  return Math.round(qty * ratio);
};

const getShellTotalQty = (shellIdx: number) => {
  const shell = shells.value[shellIdx];
  if (!shell || !shell.sizes) return 0;
  return shell.sizes.reduce((acc, curr) => acc + getSizeCalculatedQty(curr), 0);
};

// Sync step1.qty with the sum of all shell sizes' quantity
const calculatedTotalQty = computed(() => {
  return shells.value.reduce((acc, _, si) => acc + getShellTotalQty(si), 0);
});


// Step 3: Trims & Materials
interface Trim { item: string; description: string; color: string; code: string; cons: number; qty: number; uom: string; position: string; allow: number; provided_by: string; }
interface Material { description: string; size: string; color: string; uom: string; }

const trims = ref<Trim[]>([
  { item: '', description: '', color: '', code: '', cons: 0, qty: 0, uom: 'PCS', position: '', allow: 1, provided_by: 'permata' }
]);
const materials = ref<Material[]>([]);

const addTrim = () => {
  trims.value.push({ item: '', description: '', color: '', code: '', cons: 0, qty: 0, uom: 'PCS', position: '', allow: 1, provided_by: 'permata' });
};
const removeTrim = (i: number) => trims.value.splice(i, 1);

const duplicateTrim = (i: number) => {
  const t = trims.value[i];
  if (t) {
    trims.value.splice(i + 1, 0, { ...t });
    toast.success('Trim berhasil diduplikasi.');
  }
};

const generateThreadsFromColors = () => {
  const colors = Array.from(new Set(shells.value.map(s => s.color.trim()).filter(Boolean)));
  if (colors.length === 0) {
    toast.error('Tidak ada warna kain di Shell yang bisa dijadikan rujukan.');
    return;
  }
  
  let addedCount = 0;
  colors.forEach(color => {
    const exists = trims.value.some(t => t.item.toLowerCase() === 'thread' && t.color.toLowerCase() === color.toLowerCase());
    if (!exists) {
      const totalColorQty = shells.value
        .filter(s => s.color.toLowerCase() === color.toLowerCase() && s.material_type === 'fabric')
        .reduce((sum, s) => {
          return sum + s.sizes.reduce((szSum, sz) => szSum + getSizeCalculatedQty(sz), 0);
        }, 0);

      trims.value.push({
        item: 'Thread',
        description: `Thread ${color}`,
        color: color,
        code: `THR-${color.toUpperCase().replace(/\s+/g, '-')}`,
        cons: 0.1,
        qty: totalColorQty || 1000,
        uom: 'CON',
        position: 'Sewing',
        allow: 3,
        provided_by: 'permata'
      });
      addedCount++;
    }
  });

  if (addedCount > 0) {
    toast.success(`Berhasil menambahkan ${addedCount} Thread berdasarkan warna shell.`);
  } else {
    toast.info('Semua Thread untuk warna shell yang ada sudah diinput.');
  }
};

const generateLabelsFromSizes = () => {
  const sizesList: { size: string; qty: number }[] = [];
  shells.value.forEach(s => {
    s.sizes.forEach(sz => {
      if (sz.size.trim()) {
        const sizeName = sz.size.trim();
        const calculatedQty = getSizeCalculatedQty(sz);
        const existing = sizesList.find(item => item.size.toLowerCase() === sizeName.toLowerCase());
        if (existing) {
          existing.qty += calculatedQty;
        } else {
          sizesList.push({ size: sizeName, qty: calculatedQty });
        }
      }
    });
  });

  if (sizesList.length === 0) {
    toast.error('Tidak ada ukuran di Shell yang bisa dijadikan rujukan.');
    return;
  }

  let addedCount = 0;
  sizesList.forEach(item => {
    const labelDesc = `Main Size Label - ${item.size}`;
    const exists = trims.value.some(t => t.description === labelDesc);
    if (!exists) {
      trims.value.push({
        item: 'Main Size Label',
        description: labelDesc,
        color: '',
        code: '',
        cons: 1,
        qty: item.qty,
        uom: 'PCS',
        position: 'Labeling',
        allow: 3,
        provided_by: 'permata'
      });
      addedCount++;
    }
  });

  if (addedCount > 0) {
    toast.success(`Berhasil menambahkan ${addedCount} Main Size Label berdasarkan ukuran shell.`);
  } else {
    toast.info('Semua Main Size Label untuk ukuran shell yang ada sudah diinput.');
  }
};

const generateBarcodes = () => {
  const colors = Array.from(new Set(shells.value.map(s => s.color.trim()).filter(Boolean)));
  const sizesList: string[] = [];
  shells.value.forEach(s => {
    s.sizes.forEach(sz => {
      if (sz.size.trim() && !sizesList.includes(sz.size.trim())) {
        sizesList.push(sz.size.trim());
      }
    });
  });

  if (colors.length === 0 || sizesList.length === 0) {
    toast.error('Tidak ada warna atau ukuran di Shell yang bisa dijadikan rujukan.');
    return;
  }

  let addedCount = 0;
  colors.forEach(color => {
    sizesList.forEach(size => {
      const barcodeDesc = `Barcode ${color} - ${size}`;
      const exists = trims.value.some(t => 
        t.item.toLowerCase() === 'barcode' && 
        t.color.toLowerCase() === color.toLowerCase() && 
        t.description.toLowerCase() === barcodeDesc.toLowerCase()
      );

      if (!exists) {
        const qty = shells.value
          .filter(s => s.color.toLowerCase() === color.toLowerCase() && s.material_type === 'fabric')
          .reduce((sum, s) => {
            const sz = s.sizes.find(sz => sz.size.trim().toLowerCase() === size.toLowerCase());
            return sum + (sz ? getSizeCalculatedQty(sz) : 0);
          }, 0);

        trims.value.push({
          item: 'Barcode',
          description: barcodeDesc,
          color: color,
          code: `BAR-${color.toUpperCase().replace(/\s+/g, '-')}-${size.toUpperCase().replace(/\s+/g, '-')}`,
          cons: 1,
          qty: qty || 0,
          uom: 'PCS',
          position: 'Packaging',
          allow: 1,
          provided_by: 'permata'
        });
        addedCount++;
      }
    });
  });

  if (addedCount > 0) {
    toast.success(`Berhasil menambahkan ${addedCount} Barcode berdasarkan warna dan ukuran shell.`);
  } else {
    toast.info('Semua Barcode untuk kombinasi warna dan ukuran shell yang ada sudah diinput.');
  }
};

const addMaterial = () => {
  materials.value.push({ description: '', size: '', color: '', uom: '' });
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
    s.provided_by.trim() &&
    s.color.trim() &&
    parseNumber(s.cons) > 0 &&
    parseInteger(s.allow) >= 1 &&
    parseNumber(s.berat_1_yd) > 0 &&
    s.sizes.length > 0 &&
    s.sizes.every(sz => sz.size.trim() && parseInteger(sz.qty) > 0 && parseToFloat(sz.ratio) > 0)
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
        material_type: s.material_type,
        deskripsi: s.deskripsi,
        provided_by: s.provided_by,
        color: s.color,
        cons: parseNumber(s.cons),
        allow: parseInteger(s.allow),
        berat_1_yd: parseNumber(s.berat_1_yd),
        sizes: s.sizes.map(sz => ({
          size: sz.size,
          qty: getSizeCalculatedQty(sz),
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
                  <option value="">
                    {{ isLoadingPOItems ? 'Memuat item...' : (step1.selectedPOId && poItemOptions.length === 0) ? 'Tidak ada item garmen tersedia (Semua sudah memiliki WO)' : 'Pilih PO Item...' }}
                  </option>
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
                <button @click="removeShell(si)" type="button" class="text-neutral-400 hover:text-red-500 transition">
                  <Trash2Icon class="w-4 h-4" />
                </button>
              </div>

              <!-- Shell Fields -->
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                  <label class="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Provided By *</label>
                  <select v-model="shell.provided_by"
                    class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition cursor-pointer h-9">
                    <option value="client">Client</option>
                    <option value="permata">Permatatex</option>
                  </select>
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Color *</label>
                  <input v-model="shell.color" type="text" placeholder="cth: Navy Blue"
                    class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-neutral-500 uppercase">Cons (yd) *</label>
                  <input v-model="shell.cons" @input="shell.cons = ($event.target as HTMLInputElement).value.replace(/,/g, '.')" type="text" placeholder="1.5"
                    class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-neutral-500 uppercase">Allow (%) *</label>
                  <input v-model="shell.allow" type="text" placeholder="3"
                    class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-neutral-500 uppercase">Berat/yd (kg) *</label>
                  <input v-model="shell.berat_1_yd" @input="shell.berat_1_yd = ($event.target as HTMLInputElement).value.replace(/,/g, '.')" type="text" placeholder="0.8"
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
                          <th class="px-3 py-2 text-left text-[10px] font-bold text-neutral-500 uppercase">Qty (pcs)</th>
                          <th class="px-3 py-2 text-left text-[10px] font-bold text-neutral-500 uppercase">Ratio</th>
                          <th class="px-3 py-2 text-left text-[10px] font-bold text-neutral-500 uppercase">Total Qty Size</th>
                          <th class="px-3 py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-neutral-100">
                        <tr v-for="(size, zi) in shell.sizes" :key="zi" class="bg-white">
                          <td class="px-3 py-2">
                            <input v-model="size.size" type="text" placeholder="cth: L / XL / 32"
                              class="w-full rounded border border-neutral-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-400 bg-white" />
                          </td>
                          <td class="px-3 py-2">
                            <input :value="size.qty" @input="handleQtyChange(si, zi, ($event.target as HTMLInputElement).value)" type="text" placeholder="200"
                              class="w-full rounded border border-neutral-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-400" />
                          </td>
                          <td class="px-3 py-2">
                            <input :value="size.ratio" @input="handleRatioChange(si, zi, ($event.target as HTMLInputElement).value)" type="text" placeholder="1"
                              class="w-full rounded border border-neutral-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-400" />
                          </td>
                          <td class="px-3 py-2 font-medium text-neutral-700">
                            {{ getSizeCalculatedQty(size) }} pcs
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
                    <span class="text-neutral-800">
                      {{ getShellTotalQty(si) }} pcs
                    </span>
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
                  <Button type="button" variant="outline" size="sm" class="border-neutral-300 text-neutral-600 hover:text-neutral-900 shadow-xs text-xs" @click="generateThreadsFromColors">
                    <SparklesIcon class="w-3.5 h-3.5 mr-1" /> Auto Thread (Warna)
                  </Button>
                  <Button type="button" variant="outline" size="sm" class="border-neutral-300 text-neutral-600 hover:text-neutral-900 shadow-xs text-xs" @click="generateLabelsFromSizes">
                    <SparklesIcon class="w-3.5 h-3.5 mr-1" /> Auto Label (Size)
                  </Button>
                  <Button type="button" variant="outline" size="sm" class="border-neutral-300 text-neutral-600 hover:text-neutral-900 shadow-xs text-xs" @click="generateBarcodes">
                    <SparklesIcon class="w-3.5 h-3.5 mr-1" /> Auto Barcode (Warna & Size)
                  </Button>
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
                    <button @click="removeTrim(ti)" type="button" class="text-neutral-400 hover:text-red-500 transition" title="Hapus Trim">
                      <Trash2Icon class="w-4 h-4" />
                    </button>
                  </div>
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
                    <input v-model="trim.color" type="text" placeholder="cth: Black"
                      class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                    <p v-if="trim.color && hasDuplicateTrimColor(ti)" class="text-[9px] text-amber-600 font-semibold mt-0.5 leading-none">
                      (Warna ini sudah digunakan di Trim lain)
                    </p>
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Cons</label>
                    <input v-model="trim.cons" type="text" placeholder="1.0"
                      class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Qty</label>
                    <input v-model="trim.qty" type="text" placeholder="100"
                      class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-bold text-neutral-500 uppercase">UOM</label>
                    <input v-model="trim.uom" type="text" placeholder="PCS / SET"
                      class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Allow (%) *</label>
                    <input v-model="trim.allow" type="text" placeholder="3"
                      class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Position</label>
                    <input v-model="trim.position" type="text" placeholder="cth: Front"
                      class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Provided By *</label>
                    <select v-model="trim.provided_by"
                      class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition cursor-pointer h-9">
                      <option value="client">Client</option>
                      <option value="permata">Permatatex</option>
                    </select>
                  </div>
                  <div class="space-y-1 col-span-2 sm:col-span-3">
                    <label class="text-[10px] font-bold text-neutral-500 uppercase">Description</label>
                    <input v-model="trim.description" type="text" placeholder="Deskripsi singkat trim"
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
                    <input v-model="mat.color" type="text" placeholder="cth: White"
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
