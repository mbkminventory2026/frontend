<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue';
import {
  ClipboardListIcon,
  ChevronDownIcon,
  FileTextIcon,
  SaveIcon,
  ActivityIcon,
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { getPOClients, type POClientListItem } from '@/api/po-clients/po-clients';
import { getWorkOrders, getWorkOrderById, getWorkOrderDailyReports, type WorkOrderListItem, type WorkOrderDetailResponse, type DailyReportListItem } from '@/api/work-orders/work-orders';
import { getProductionSummary, createFactoryReport } from '@/api/production/production';
import type { ProductionAggregateResponse, ProductionStats } from '@/schemas/production/production';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { formatDate } from '@/lib/formatter';

// ─── API Lists ────────────────────────────────────────────────────────────────
const poList = ref<POClientListItem[]>([]);
const woList = ref<WorkOrderListItem[]>([]);
const isLoadingPO = ref(false);
const isLoadingWO = ref(false);

// ─── Selection States ─────────────────────────────────────────────────────────
const selectedPoId = ref<number | ''>('');
const selectedWoId = ref<number | ''>('');
const selectedColor = ref<string>('');
const selectedSizeId = ref<number | ''>('');
const selectedReportType = ref<string>('');
const tanggal = ref('');
const qty = ref<string>('');

const isSaving = ref(false);
const isLoadingWoDetail = ref(false);

const woDetail = ref<WorkOrderDetailResponse | null>(null);
const summaryItems = ref<ProductionAggregateResponse[]>([]);
const dailyReports = ref<DailyReportListItem[]>([]);

// ─── Fetch Initial PO & WO ───────────────────────────────────────────────────
const fetchInitialData = async () => {
  isLoadingPO.value = true;
  isLoadingWO.value = true;
  try {
    const [poRes, woRes] = await Promise.all([
      getPOClients({ limit: 200 }),
      getWorkOrders({ limit: 500 })
    ]);
    poList.value = poRes?.results ?? [];
    woList.value = woRes?.results ?? [];
  } catch (e) {
    console.error('Failed to load initial data:', e);
    toast.error('Gagal memuat data PO dan Work Order.');
  } finally {
    isLoadingPO.value = false;
    isLoadingWO.value = false;
  }
};

// ─── Dropdown Options / Cascades ──────────────────────────────────────────────
const selectedPo = computed(() =>
  poList.value.find((p) => p.id_po_client === selectedPoId.value) ?? null
);

const filteredWoList = computed(() => {
  if (!selectedPo.value) return [];
  return woList.value.filter((wo) => wo.po_number === selectedPo.value?.po_number);
});

const uniqueColors = computed(() => {
  if (!woDetail.value?.shells) return [];
  return Array.from(new Set(woDetail.value.shells.map((s) => s.color)));
});

const availableSizes = computed(() => {
  if (!selectedColor.value || !woDetail.value?.shells) return [];
  const shell = woDetail.value.shells.find((s) => s.color === selectedColor.value);
  return shell?.sizes ?? [];
});

// Reset logic on cascades
watch(selectedPoId, () => {
  selectedWoId.value = '';
  selectedColor.value = '';
  selectedSizeId.value = '';
  woDetail.value = null;
  summaryItems.value = [];
  dailyReports.value = [];
});

watch(selectedWoId, async (newWoId) => {
  selectedColor.value = '';
  selectedSizeId.value = '';
  woDetail.value = null;
  summaryItems.value = [];
  dailyReports.value = [];

  if (newWoId) {
    isLoadingWoDetail.value = true;
    try {
      const [detailRes, summaryRes, dailyRes] = await Promise.all([
        getWorkOrderById(newWoId),
        getProductionSummary({ id_wo: newWoId, limit: 100 }),
        getWorkOrderDailyReports(newWoId)
      ]);
      woDetail.value = detailRes;
      summaryItems.value = summaryRes?.items ?? [];
      dailyReports.value = dailyRes?.items ?? [];
    } catch (e) {
      console.error('Failed to load Work Order details:', e);
      toast.error('Gagal memuat rincian Work Order.');
    } finally {
      isLoadingWoDetail.value = false;
    }
  }
});

watch(selectedColor, () => {
  selectedSizeId.value = '';
});

// ─── Submitting Daily Output ───────────────────────────────────────────────
const handleSubmitReport = async () => {
  if (!selectedSizeId.value) {
    toast.error('Harap pilih Size/Ukuran terlebih dahulu.');
    return;
  }
  if (!selectedReportType.value) {
    toast.error('Harap pilih Bentuk Report terlebih dahulu.');
    return;
  }
  if (!tanggal.value) {
    toast.error('Harap isi Tanggal laporan.');
    return;
  }
  const qtyVal = parseInt(qty.value) || 0;
  if (qtyVal <= 0) {
    toast.error('QTY Output harus lebih dari 0.');
    return;
  }

  isSaving.value = true;
  try {
    await createFactoryReport(selectedReportType.value, {
      id_wo_shell_size: Number(selectedSizeId.value),
      tanggal: tanggal.value,
      qty: qtyVal
    });
    toast.success('Laporan output produksi berhasil disimpan!');
    qty.value = '';

    // Re-fetch data to update bottom table
    if (selectedWoId.value) {
      const [summaryRes, dailyRes] = await Promise.all([
        getProductionSummary({ id_wo: selectedWoId.value, limit: 100 }),
        getWorkOrderDailyReports(selectedWoId.value)
      ]);
      summaryItems.value = summaryRes?.items ?? [];
      dailyReports.value = dailyRes?.items ?? [];
    }
  } catch (error: any) {
    const msg = error?.response?.data?.message ?? 'Gagal menyimpan laporan.';
    toast.error(msg);
  } finally {
    isSaving.value = false;
  }
};

// ─── BOTTOM SECTION: MULTI-COLOR MATRIX TABLE DATA ───────────────────────────────────────────────
const uniqueSizes = computed(() => {
  if (!woDetail.value?.shells) return [];
  const sizes = new Set<string>();
  woDetail.value.shells.forEach((shell) => {
    if (shell.sizes) {
      shell.sizes.forEach((s) => sizes.add(s.size));
    }
  });
  return Array.from(sizes);
});

interface SizeData {
  orderQty: number;
  cuttingQty: number;
  sewingQty: number;
  qcQty: number;
  packingQty: number;
  shippedQty: number;
}

interface ColorRow {
  color: string;
  sizes: Record<string, SizeData>;
  totalOrder: number;
  totalCutting: number;
  totalSewing: number;
  totalQc: number;
  totalPacking: number;
  totalShipped: number;
}

const tableData = computed<ColorRow[]>(() => {
  if (!woDetail.value?.shells) return [];
  const rows: ColorRow[] = [];

  const prodMap = new Map<number, ProductionStats>();
  summaryItems.value.forEach((item) => {
    prodMap.set(item.id_wo_shell_size, item.production);
  });

  woDetail.value.shells.forEach((shell) => {
    const sizesData: Record<string, SizeData> = {};
    let totalOrder = 0;
    let totalCutting = 0;
    let totalSewing = 0;
    let totalQc = 0;
    let totalPacking = 0;
    let totalShipped = 0;

    uniqueSizes.value.forEach((sizeName) => {
      sizesData[sizeName] = {
        orderQty: 0,
        cuttingQty: 0,
        sewingQty: 0,
        qcQty: 0,
        packingQty: 0,
        shippedQty: 0
      };
    });

    if (shell.sizes) {
      shell.sizes.forEach((s) => {
        const stats = prodMap.get(s.id_wo_shell_size);
        const sizeName = s.size;

        sizesData[sizeName] = {
          orderQty: s.qty,
          cuttingQty: stats?.cutting ?? 0,
          sewingQty: stats?.sewing ?? 0,
          qcQty: stats?.qc_pass ?? 0,
          packingQty: stats?.packing ?? 0,
          shippedQty: stats?.shipped ?? 0
        };

        totalOrder += s.qty;
        totalCutting += stats?.cutting ?? 0;
        totalSewing += stats?.sewing ?? 0;
        totalQc += stats?.qc_pass ?? 0;
        totalPacking += stats?.packing ?? 0;
        totalShipped += stats?.shipped ?? 0;
      });
    }

    rows.push({
      color: shell.color,
      sizes: sizesData,
      totalOrder,
      totalCutting,
      totalSewing,
      totalQc,
      totalPacking,
      totalShipped
    });
  });

  return rows;
});

// ─── BOTTOM SECTION: SINGLE-COLOR DAILY HISTORY TABLE DATA ───────────────────────────────
const selectedColorSizes = computed(() => {
  if (!selectedColor.value || !woDetail.value?.shells) return [];
  const shell = woDetail.value.shells.find((s) => s.color === selectedColor.value);
  return shell?.sizes ?? [];
});

const selectedColorSizeNames = computed(() =>
  selectedColorSizes.value.map((s) => s.size)
);

const selectedColorTotalOrder = computed(() => {
  return selectedColorSizes.value.reduce((sum, s) => sum + s.qty, 0);
});

const filteredDailyReports = computed(() => {
  if (!selectedColor.value || !woDetail.value?.shells) return [];
  const shell = woDetail.value.shells.find((s) => s.color === selectedColor.value);
  if (!shell || !shell.sizes) return [];
  const sizeIds = new Set(shell.sizes.map((s) => s.id_wo_shell_size));
  return dailyReports.value.filter((r) => sizeIds.has(r.id_wo_shell_size));
});

interface DivisionDailyLog {
  date: string;
  quantities: Record<string, number>;
  total: number;
}

interface ParallelDailyRow {
  cutting: DivisionDailyLog | null;
  sewing: DivisionDailyLog | null;
  qc: DivisionDailyLog | null;
  packing: DivisionDailyLog | null;
  shipped: DivisionDailyLog | null;
}

const getDivisionLogs = (divisionName: string): DivisionDailyLog[] => {
  const shell = woDetail.value?.shells?.find((s) => s.color === selectedColor.value);
  if (!shell || !shell.sizes) return [];

  const idToSizeNameMap: Record<number, string> = {};
  shell.sizes.forEach((s) => {
    idToSizeNameMap[s.id_wo_shell_size] = s.size;
  });

  const logsMap: Record<string, DivisionDailyLog> = {};

  filteredDailyReports.value
    .filter((r) => r.division === divisionName)
    .forEach((r) => {
      const date = r.tanggal;
      const sizeName = idToSizeNameMap[r.id_wo_shell_size];
      if (!sizeName) return;

      if (!logsMap[date]) {
        logsMap[date] = {
          date,
          quantities: {},
          total: 0
        };
      }

      const log = logsMap[date];
      log.quantities[sizeName] = (log.quantities[sizeName] ?? 0) + r.qty;
      log.total += r.qty;
    });

  return Object.values(logsMap).sort((a, b) => a.date.localeCompare(b.date));
};

const cuttingLogs = computed(() => getDivisionLogs('cutting'));
const sewingLogs = computed(() => getDivisionLogs('sewing'));
const qcLogs = computed(() => getDivisionLogs('qc-finish'));
const packingLogs = computed(() => getDivisionLogs('packing'));
const shippedLogs = computed(() => getDivisionLogs('pengiriman'));

const maxLogsLength = computed(() => {
  return Math.max(
    cuttingLogs.value.length,
    sewingLogs.value.length,
    qcLogs.value.length,
    packingLogs.value.length,
    shippedLogs.value.length,
    1
  );
});

const parallelDailyRows = computed<ParallelDailyRow[]>(() => {
  const rows: ParallelDailyRow[] = [];
  const len = maxLogsLength.value;
  for (let i = 0; i < len; i++) {
    rows.push({
      cutting: cuttingLogs.value[i] ?? null,
      sewing: sewingLogs.value[i] ?? null,
      qc: qcLogs.value[i] ?? null,
      packing: packingLogs.value[i] ?? null,
      shipped: shippedLogs.value[i] ?? null
    });
  }
  return rows;
});

const dailyTotals = computed(() => {
  const totals = {
    cutting: {} as Record<string, number>,
    sewing: {} as Record<string, number>,
    qc: {} as Record<string, number>,
    packing: {} as Record<string, number>,
    shipped: {} as Record<string, number>,
    totalCutting: 0,
    totalSewing: 0,
    totalQc: 0,
    totalPacking: 0,
    totalShipped: 0
  };

  selectedColorSizeNames.value.forEach((sizeName) => {
    totals.cutting[sizeName] = 0;
    totals.sewing[sizeName] = 0;
    totals.qc[sizeName] = 0;
    totals.packing[sizeName] = 0;
    totals.shipped[sizeName] = 0;
  });

  cuttingLogs.value.forEach((log) => {
    selectedColorSizeNames.value.forEach((sizeName) => {
      totals.cutting[sizeName] = (totals.cutting[sizeName] ?? 0) + (log.quantities[sizeName] ?? 0);
    });
    totals.totalCutting += log.total;
  });

  sewingLogs.value.forEach((log) => {
    selectedColorSizeNames.value.forEach((sizeName) => {
      totals.sewing[sizeName] = (totals.sewing[sizeName] ?? 0) + (log.quantities[sizeName] ?? 0);
    });
    totals.totalSewing += log.total;
  });

  qcLogs.value.forEach((log) => {
    selectedColorSizeNames.value.forEach((sizeName) => {
      totals.qc[sizeName] = (totals.qc[sizeName] ?? 0) + (log.quantities[sizeName] ?? 0);
    });
    totals.totalQc += log.total;
  });

  packingLogs.value.forEach((log) => {
    selectedColorSizeNames.value.forEach((sizeName) => {
      totals.packing[sizeName] = (totals.packing[sizeName] ?? 0) + (log.quantities[sizeName] ?? 0);
    });
    totals.totalPacking += log.total;
  });

  shippedLogs.value.forEach((log) => {
    selectedColorSizeNames.value.forEach((sizeName) => {
      totals.shipped[sizeName] = (totals.shipped[sizeName] ?? 0) + (log.quantities[sizeName] ?? 0);
    });
    totals.totalShipped += log.total;
  });

  return totals;
});

const dailyBalances = computed(() => {
  const balances = {
    cutting: {} as Record<string, number>,
    sewing: {} as Record<string, number>,
    qc: {} as Record<string, number>,
    packing: {} as Record<string, number>,
    shipped: {} as Record<string, number>,
    totalCutting: 0,
    totalSewing: 0,
    totalQc: 0,
    totalPacking: 0,
    totalShipped: 0
  };

  selectedColorSizeNames.value.forEach((sizeName) => {
    const orderQty = selectedColorSizes.value.find((s) => s.size === sizeName)?.qty ?? 0;
    balances.cutting[sizeName] = orderQty - (dailyTotals.value.cutting[sizeName] ?? 0);
    balances.sewing[sizeName] = orderQty - (dailyTotals.value.sewing[sizeName] ?? 0);
    balances.qc[sizeName] = orderQty - (dailyTotals.value.qc[sizeName] ?? 0);
    balances.packing[sizeName] = orderQty - (dailyTotals.value.packing[sizeName] ?? 0);
    balances.shipped[sizeName] = orderQty - (dailyTotals.value.shipped[sizeName] ?? 0);
  });

  balances.totalCutting = selectedColorTotalOrder.value - dailyTotals.value.totalCutting;
  balances.totalSewing = selectedColorTotalOrder.value - dailyTotals.value.totalSewing;
  balances.totalQc = selectedColorTotalOrder.value - dailyTotals.value.totalQc;
  balances.totalPacking = selectedColorTotalOrder.value - dailyTotals.value.totalPacking;
  balances.totalShipped = selectedColorTotalOrder.value - dailyTotals.value.totalShipped;

  return balances;
});

onMounted(() => {
  tanggal.value = new Date().toISOString().split('T')[0] ?? '';
  fetchInitialData();
});
</script>

<template>
  <div class="container mx-auto py-8 space-y-8 max-w-7xl">
    <!-- Header -->
    <div class="flex items-center gap-3 border-b pb-5 border-neutral-100">
      <div class="bg-neutral-50 border border-neutral-200/80 p-2.5 rounded-xl shadow-sm">
        <ClipboardListIcon class="w-6 h-6 text-neutral-600" />
      </div>
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-neutral-900">Laporan Produksi</h1>
        <p class="text-[13px] text-neutral-500 mt-1">
          Mencatat laporan harian divisi dan memantau kemajuan progres produksi beserta balance untuk tiap-tiap warna/ukuran.
        </p>
      </div>
    </div>

    <!-- ═══ TOP SECTION: FORM ═══ -->
    <Card class="border border-neutral-200 bg-white p-6 shadow-sm rounded-xl">
      <h2 class="text-sm font-bold text-neutral-800 uppercase tracking-wider mb-5 flex items-center gap-2">
        <span class="inline-block w-1.5 h-4 bg-neutral-900 rounded-full"></span>
        Input Laporan Harian Produksi
      </h2>

      <form @submit.prevent="handleSubmitReport" class="space-y-5">
        <!-- Row 1: PO & WO -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="space-y-1.5">
            <Label class="text-xs font-semibold text-neutral-700">Purchase Order (Rujukan) <span class="text-red-500">*</span></Label>
            <div class="relative">
              <select
                v-model="selectedPoId"
                :disabled="isLoadingPO"
                class="w-full h-9 rounded-md border border-neutral-200 bg-white pl-3 pr-9 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 appearance-none cursor-pointer"
              >
                <option value="" disabled>Pilih Purchase Order</option>
                <option v-for="po in poList" :key="po.id_po_client" :value="po.id_po_client">
                  {{ po.po_number }} — {{ po.mitra_name }}
                </option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                <ChevronDownIcon class="w-4 h-4 text-neutral-400" />
              </div>
            </div>
          </div>

          <div class="space-y-1.5">
            <Label class="text-xs font-semibold text-neutral-700">Work Order (Rujukan) <span class="text-red-500">*</span></Label>
            <div class="relative">
              <select
                v-model="selectedWoId"
                :disabled="!selectedPoId || isLoadingWO"
                class="w-full h-9 rounded-md border border-neutral-200 bg-white pl-3 pr-9 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 appearance-none cursor-pointer"
              >
                <option value="" disabled>Pilih Work Order</option>
                <option v-for="wo in filteredWoList" :key="wo.id_wo" :value="wo.id_wo">
                  WO #{{ wo.id_wo }} — {{ wo.buyer }} · {{ wo.model }}
                </option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                <ChevronDownIcon class="w-4 h-4 text-neutral-400" />
              </div>
            </div>
          </div>
        </div>

        <!-- Row 2: Color, Size & Report Type -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div class="space-y-1.5">
            <Label class="text-xs font-semibold text-neutral-700">Warna (Rujukan) <span class="text-red-500">*</span></Label>
            <div class="relative">
              <select
                v-model="selectedColor"
                :disabled="!selectedWoId || isLoadingWoDetail"
                class="w-full h-9 rounded-md border border-neutral-200 bg-white pl-3 pr-9 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 appearance-none cursor-pointer"
              >
                <option value="">Pilih Warna</option>
                <option v-for="color in uniqueColors" :key="color" :value="color">
                  {{ color }}
                </option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                <ChevronDownIcon class="w-4 h-4 text-neutral-400" />
              </div>
            </div>
          </div>

          <div class="space-y-1.5">
            <Label class="text-xs font-semibold text-neutral-700">Size / Ukuran (Rujukan) <span class="text-red-500">*</span></Label>
            <div class="relative">
              <select
                v-model="selectedSizeId"
                :disabled="!selectedColor"
                class="w-full h-9 rounded-md border border-neutral-200 bg-white pl-3 pr-9 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 appearance-none cursor-pointer"
              >
                <option value="" disabled>Pilih Ukuran</option>
                <option v-for="sizeOpt in availableSizes" :key="sizeOpt.id_wo_shell_size" :value="sizeOpt.id_wo_shell_size">
                  Size {{ sizeOpt.size }} [Qty Order: {{ sizeOpt.qty }}]
                </option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                <ChevronDownIcon class="w-4 h-4 text-neutral-400" />
              </div>
            </div>
          </div>

          <div class="space-y-1.5">
            <Label class="text-xs font-semibold text-neutral-700">Bentuk Report (Divisi) <span class="text-red-500">*</span></Label>
            <div class="relative">
              <select
                v-model="selectedReportType"
                class="w-full h-9 rounded-md border border-neutral-200 bg-white pl-3 pr-9 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 appearance-none cursor-pointer"
              >
                <option value="" disabled>Pilih Bentuk Report</option>
                <option value="cutting">Cutting</option>
                <option value="sewing">Sewing</option>
                <option value="qc-finish">QC / Finishing</option>
                <option value="packing">Packing</option>
                <option value="pengiriman">Pengiriman</option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                <ChevronDownIcon class="w-4 h-4 text-neutral-400" />
              </div>
            </div>
          </div>
        </div>

        <!-- Row 3: Date & Qty -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="space-y-1.5">
            <Label class="text-xs font-semibold text-neutral-700">Tanggal Laporan <span class="text-red-500">*</span></Label>
            <Input id="tanggal" v-model="tanggal" type="date" class="h-9 text-xs border-neutral-200" required />
          </div>

          <div class="space-y-1.5">
            <Label class="text-xs font-semibold text-neutral-700">QTY Output <span class="text-red-500">*</span></Label>
            <Input id="qty" v-model="qty" type="number" min="1" placeholder="Masukkan QTY Output Produksi" class="h-9 text-xs border-neutral-200" required />
          </div>
        </div>

        <!-- Submit Button -->
        <div class="flex justify-end pt-3">
          <Button
            type="submit"
            :disabled="isSaving || !selectedSizeId || !selectedReportType"
            class="bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm font-medium transition-all"
          >
            <SaveIcon class="w-4 h-4 mr-2" />
            {{ isSaving ? 'Menyimpan...' : 'Kirim Output Laporan' }}
          </Button>
        </div>
      </form>
    </Card>

    <!-- ═══ BOTTOM SECTION: MATRIX SUMMARY ═══ -->
    <Card class="border border-neutral-200 bg-white p-6 shadow-sm rounded-xl overflow-hidden">
      <h2 class="text-sm font-bold text-neutral-800 uppercase tracking-wider mb-5 flex items-center gap-2">
        <ActivityIcon class="w-4 h-4 text-neutral-600" />
        Matriks Progres Produksi & Balance
      </h2>

      <!-- Empty State -->
      <div v-if="!selectedWoId" class="flex flex-col items-center justify-center min-h-[200px] text-center p-8 border-2 border-dashed border-neutral-100 rounded-lg">
        <div class="bg-neutral-50 p-3 rounded-full border border-neutral-100 mb-3">
          <FileTextIcon class="w-6 h-6 text-neutral-400" />
        </div>
        <p class="text-sm font-medium text-neutral-500">Tolong pilih Work Order terlebih dahulu.</p>
        <p class="text-xs text-neutral-400 mt-1">Pilih Purchase Order lalu Work Order pada form di atas untuk menampilkan matriks.</p>
      </div>

      <!-- Loading State -->
      <div v-else-if="isLoadingWoDetail" class="flex flex-col items-center justify-center min-h-[200px] gap-3">
        <Spinner class="size-7" />
        <p class="text-neutral-500 text-xs animate-pulse">Memuat matriks progres produksi...</p>
      </div>

      <!-- MATRIX 1: MULTI-COLOR MAIN TABLE (If selectedColor is NOT selected) -->
      <div v-else-if="!selectedColor" class="overflow-x-auto border border-neutral-200 rounded-lg shadow-sm max-w-full">
        <table class="w-full text-left border-collapse border-spacing-0">
          <thead class="bg-neutral-50 border-b border-neutral-200 text-xs font-semibold text-neutral-600">
            <!-- Row 1: Stage Groups -->
            <tr>
              <th rowspan="2" class="px-4 py-3 text-left border-r border-neutral-200 min-w-[120px] sticky left-0 bg-neutral-100 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                Color
              </th>
              <th :colspan="uniqueSizes.length + 1" class="px-4 py-3 text-center border-r border-neutral-200 bg-indigo-50/50 text-indigo-900">
                QTY Order
              </th>
              <th :colspan="uniqueSizes.length + 2" class="px-4 py-3 text-center border-r border-neutral-200 bg-blue-50/50 text-blue-900">
                QTY Cutting
              </th>
              <th :colspan="uniqueSizes.length + 2" class="px-4 py-3 text-center border-r border-neutral-200 bg-emerald-50/50 text-emerald-900">
                QTY Sewing
              </th>
              <th :colspan="uniqueSizes.length + 2" class="px-4 py-3 text-center border-r border-neutral-200 bg-amber-50/50 text-amber-900">
                QTY QC/Finishing
              </th>
              <th :colspan="uniqueSizes.length + 2" class="px-4 py-3 text-center border-r border-neutral-200 bg-violet-50/50 text-violet-950">
                QTY Packing
              </th>
              <th :colspan="uniqueSizes.length + 2" class="px-4 py-3 text-center bg-rose-50/50 text-rose-950">
                QTY Pengiriman
              </th>
            </tr>
            <!-- Row 2: Size & Total Subheaders -->
            <tr class="border-t border-neutral-200 bg-neutral-50 text-[10px] uppercase tracking-wider text-neutral-500">
              <!-- QTY Order sizes + total -->
              <th v-for="size in uniqueSizes" :key="'order-' + size" class="px-3 py-2 text-right border-r border-neutral-150">
                {{ size }}
              </th>
              <th class="px-3 py-2 text-right border-r border-neutral-200 font-bold bg-indigo-50/30 text-indigo-950">Total</th>

              <!-- QTY Cutting sizes + total + balance -->
              <th v-for="size in uniqueSizes" :key="'cutting-' + size" class="px-3 py-2 text-right border-r border-neutral-150">
                {{ size }}
              </th>
              <th class="px-3 py-2 text-right border-r border-neutral-150 font-bold bg-blue-50/30 text-blue-950">Total</th>
              <th class="px-3 py-2 text-right border-r border-neutral-200 font-bold text-neutral-700 bg-red-50/20">Balance</th>

              <!-- QTY Sewing sizes + total + balance -->
              <th v-for="size in uniqueSizes" :key="'sewing-' + size" class="px-3 py-2 text-right border-r border-neutral-150">
                {{ size }}
              </th>
              <th class="px-3 py-2 text-right border-r border-neutral-150 font-bold bg-emerald-50/30 text-emerald-950">Total</th>
              <th class="px-3 py-2 text-right border-r border-neutral-200 font-bold text-neutral-700 bg-red-50/20">Balance</th>

              <!-- QTY QC/Finishing sizes + total + balance -->
              <th v-for="size in uniqueSizes" :key="'qc-' + size" class="px-3 py-2 text-right border-r border-neutral-150">
                {{ size }}
              </th>
              <th class="px-3 py-2 text-right border-r border-neutral-150 font-bold bg-amber-50/30 text-amber-950">Total</th>
              <th class="px-3 py-2 text-right border-r border-neutral-200 font-bold text-neutral-700 bg-red-50/20">Balance</th>

              <!-- QTY Packing sizes + total + balance -->
              <th v-for="size in uniqueSizes" :key="'packing-' + size" class="px-3 py-2 text-right border-r border-neutral-150">
                {{ size }}
              </th>
              <th class="px-3 py-2 text-right border-r border-neutral-150 font-bold bg-violet-50/30 text-violet-950">Total</th>
              <th class="px-3 py-2 text-right border-r border-neutral-200 font-bold text-neutral-700 bg-red-50/20">Balance</th>

              <!-- QTY Pengiriman sizes + total + balance -->
              <th v-for="size in uniqueSizes" :key="'shipped-' + size" class="px-3 py-2 text-right border-r border-neutral-150">
                {{ size }}
              </th>
              <th class="px-3 py-2 text-right border-r border-neutral-150 font-bold bg-rose-50/30 text-rose-950">Total</th>
              <th class="px-3 py-2 text-right font-bold text-neutral-700 bg-red-50/20">Balance</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-200 text-xs font-mono text-neutral-800 bg-white">
            <tr v-for="row in tableData" :key="row.color" class="hover:bg-neutral-50/50 transition-colors group">
              <!-- Color -->
              <td class="px-4 py-3 font-semibold font-sans text-neutral-900 border-r border-neutral-200 sticky left-0 bg-neutral-50 group-hover:bg-neutral-100 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                {{ row.color }}
              </td>

              <!-- QTY Order -->
              <td v-for="size in uniqueSizes" :key="'order-val-' + size" class="px-3 py-3 text-right border-r border-neutral-150 text-neutral-500">
                {{ row.sizes[size]?.orderQty ? row.sizes[size]?.orderQty.toLocaleString('id-ID') : '—' }}
              </td>
              <td class="px-3 py-3 text-right border-r border-neutral-200 font-bold bg-indigo-50/10 text-indigo-950">
                {{ row.totalOrder.toLocaleString('id-ID') }}
              </td>

              <!-- QTY Cutting -->
              <td v-for="size in uniqueSizes" :key="'cutting-val-' + size" class="px-3 py-3 text-right border-r border-neutral-150 text-neutral-500">
                {{ row.sizes[size]?.cuttingQty ? row.sizes[size]?.cuttingQty.toLocaleString('id-ID') : '—' }}
              </td>
              <td class="px-3 py-3 text-right border-r border-neutral-150 font-bold bg-blue-50/10 text-blue-950">
                {{ row.totalCutting.toLocaleString('id-ID') }}
              </td>
              <td :class="['px-3 py-3 text-right border-r border-neutral-200 font-bold', row.totalOrder - row.totalCutting > 0 ? 'text-amber-600' : 'text-neutral-500']">
                {{ (row.totalOrder - row.totalCutting).toLocaleString('id-ID') }}
              </td>

              <!-- QTY Sewing -->
              <td v-for="size in uniqueSizes" :key="'sewing-val-' + size" class="px-3 py-3 text-right border-r border-neutral-150 text-neutral-500">
                {{ row.sizes[size]?.sewingQty ? row.sizes[size]?.sewingQty.toLocaleString('id-ID') : '—' }}
              </td>
              <td class="px-3 py-3 text-right border-r border-neutral-150 font-bold bg-emerald-50/10 text-emerald-950">
                {{ row.totalSewing.toLocaleString('id-ID') }}
              </td>
              <td :class="['px-3 py-3 text-right border-r border-neutral-200 font-bold', row.totalOrder - row.totalSewing > 0 ? 'text-amber-600' : 'text-neutral-500']">
                {{ (row.totalOrder - row.totalSewing).toLocaleString('id-ID') }}
              </td>

              <!-- QTY QC/Finishing -->
              <td v-for="size in uniqueSizes" :key="'qc-val-' + size" class="px-3 py-3 text-right border-r border-neutral-150 text-neutral-500">
                {{ row.sizes[size]?.qcQty ? row.sizes[size]?.qcQty.toLocaleString('id-ID') : '—' }}
              </td>
              <td class="px-3 py-3 text-right border-r border-neutral-150 font-bold bg-amber-50/10 text-amber-950">
                {{ row.totalQc.toLocaleString('id-ID') }}
              </td>
              <td :class="['px-3 py-3 text-right border-r border-neutral-200 font-bold', row.totalOrder - row.totalQc > 0 ? 'text-amber-600' : 'text-neutral-500']">
                {{ (row.totalOrder - row.totalQc).toLocaleString('id-ID') }}
              </td>

              <!-- QTY Packing -->
              <td v-for="size in uniqueSizes" :key="'packing-val-' + size" class="px-3 py-3 text-right border-r border-neutral-150 text-neutral-500">
                {{ row.sizes[size]?.packingQty ? row.sizes[size]?.packingQty.toLocaleString('id-ID') : '—' }}
              </td>
              <td class="px-3 py-3 text-right border-r border-neutral-150 font-bold bg-violet-50/10 text-violet-950">
                {{ row.totalPacking.toLocaleString('id-ID') }}
              </td>
              <td :class="['px-3 py-3 text-right border-r border-neutral-200 font-bold', row.totalOrder - row.totalPacking > 0 ? 'text-amber-600' : 'text-neutral-500']">
                {{ (row.totalOrder - row.totalPacking).toLocaleString('id-ID') }}
              </td>

              <!-- QTY Pengiriman -->
              <td v-for="size in uniqueSizes" :key="'shipped-val-' + size" class="px-3 py-3 text-right border-r border-neutral-150 text-neutral-500">
                {{ row.sizes[size]?.shippedQty ? row.sizes[size]?.shippedQty.toLocaleString('id-ID') : '—' }}
              </td>
              <td class="px-3 py-3 text-right border-r border-neutral-150 font-bold bg-rose-50/10 text-rose-950">
                {{ row.totalShipped.toLocaleString('id-ID') }}
              </td>
              <td :class="['px-3 py-3 text-right font-bold', row.totalOrder - row.totalShipped > 0 ? 'text-amber-600' : 'text-neutral-500']">
                {{ (row.totalOrder - row.totalShipped).toLocaleString('id-ID') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MATRIX 2: SINGLE-COLOR DAILY HISTORY TABLE (If selectedColor IS selected) -->
      <div v-else class="overflow-x-auto border border-neutral-200 rounded-lg shadow-sm max-w-full">
        <table class="w-full text-left border-collapse border-spacing-0">
          <thead class="bg-neutral-50 border-b border-neutral-200 text-xs font-semibold text-neutral-600">
            <!-- Row 1: Stage Groups -->
            <tr>
              <th rowspan="2" class="px-4 py-3 text-left border-r border-neutral-200 min-w-[120px] sticky left-0 bg-neutral-100 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                {{ selectedColor }}
              </th>
              <th :colspan="selectedColorSizeNames.length + 1" class="px-4 py-3 text-center border-r border-neutral-200 bg-indigo-50/50 text-indigo-900">
                QTY ORDER
              </th>
              <!-- Cutting -->
              <th rowspan="2" class="px-4 py-3 text-center border-r border-neutral-200 min-w-[110px] bg-neutral-50">
                Date
              </th>
              <th :colspan="selectedColorSizeNames.length + 1" class="px-4 py-3 text-center border-r border-neutral-200 bg-blue-50/50 text-blue-900">
                QTY Cutting
              </th>
              <!-- Sewing -->
              <th rowspan="2" class="px-4 py-3 text-center border-r border-neutral-200 min-w-[110px] bg-neutral-50">
                Date
              </th>
              <th :colspan="selectedColorSizeNames.length + 1" class="px-4 py-3 text-center border-r border-neutral-200 bg-emerald-50/50 text-emerald-900">
                QTY Sewing
              </th>
              <!-- QC/Finishing -->
              <th rowspan="2" class="px-4 py-3 text-center border-r border-neutral-200 min-w-[110px] bg-neutral-50">
                Date
              </th>
              <th :colspan="selectedColorSizeNames.length + 1" class="px-4 py-3 text-center border-r border-neutral-200 bg-amber-50/50 text-amber-900">
                QTY QC/Finishing
              </th>
              <!-- Packing -->
              <th rowspan="2" class="px-4 py-3 text-center border-r border-neutral-200 min-w-[110px] bg-neutral-50">
                Date
              </th>
              <th :colspan="selectedColorSizeNames.length + 1" class="px-4 py-3 text-center border-r border-neutral-200 bg-violet-50/50 text-violet-900">
                QTY Packing
              </th>
              <!-- Pengiriman -->
              <th rowspan="2" class="px-4 py-3 text-center border-r border-neutral-200 min-w-[110px] bg-neutral-50">
                Date
              </th>
              <th :colspan="selectedColorSizeNames.length + 1" class="px-4 py-3 text-center bg-rose-50/50 text-rose-900">
                QTY Pengiriman
              </th>
            </tr>
            <!-- Row 2: Size & Total Subheaders -->
            <tr class="border-t border-neutral-200 bg-neutral-50 text-[10px] uppercase tracking-wider text-neutral-500">
              <!-- QTY Order sizes + total -->
              <th v-for="size in selectedColorSizeNames" :key="'order-h-' + size" class="px-3 py-2 text-right border-r border-neutral-150">
                {{ size }}
              </th>
              <th class="px-3 py-2 text-right border-r border-neutral-200 font-bold bg-indigo-50/30 text-indigo-950">Total</th>

              <!-- QTY Cutting sizes + total -->
              <th v-for="size in selectedColorSizeNames" :key="'cutting-h-' + size" class="px-3 py-2 text-right border-r border-neutral-150">
                {{ size }}
              </th>
              <th class="px-3 py-2 text-right border-r border-neutral-200 font-bold bg-blue-50/30 text-blue-950">Total</th>

              <!-- QTY Sewing sizes + total -->
              <th v-for="size in selectedColorSizeNames" :key="'sewing-h-' + size" class="px-3 py-2 text-right border-r border-neutral-150">
                {{ size }}
              </th>
              <th class="px-3 py-2 text-right border-r border-neutral-200 font-bold bg-emerald-50/30 text-emerald-950">Total</th>

              <!-- QTY QC/Finishing sizes + total -->
              <th v-for="size in selectedColorSizeNames" :key="'qc-h-' + size" class="px-3 py-2 text-right border-r border-neutral-150">
                {{ size }}
              </th>
              <th class="px-3 py-2 text-right border-r border-neutral-200 font-bold bg-amber-50/30 text-amber-950">Total</th>

              <!-- QTY Packing sizes + total -->
              <th v-for="size in selectedColorSizeNames" :key="'packing-h-' + size" class="px-3 py-2 text-right border-r border-neutral-150">
                {{ size }}
              </th>
              <th class="px-3 py-2 text-right border-r border-neutral-200 font-bold bg-violet-50/30 text-violet-950">Total</th>

              <!-- QTY Pengiriman sizes + total -->
              <th v-for="size in selectedColorSizeNames" :key="'shipped-h-' + size" class="px-3 py-2 text-right border-r border-neutral-150">
                {{ size }}
              </th>
              <th class="px-3 py-2 text-right font-bold bg-rose-50/30 text-rose-950">Total</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-200 text-xs font-mono text-neutral-800 bg-white">
            <tr v-for="(row, idx) in parallelDailyRows" :key="idx" class="hover:bg-neutral-50/50 transition-colors group">
              <!-- Selected Color Column (sticky left, rowspan spans all rows, empty inside) -->
              <td v-if="idx === 0" :rowspan="parallelDailyRows.length" class="px-4 py-3 border-r border-neutral-200 sticky left-0 bg-neutral-50 group-hover:bg-neutral-100 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                <!-- empty as the header already shows the color name -->
              </td>

              <!-- QTY Order sizes (rowspan spans all rows) -->
              <td v-if="idx === 0" v-for="sizeName in selectedColorSizeNames" :key="'order-val-' + sizeName" :rowspan="parallelDailyRows.length" class="px-3 py-3 text-right border-r border-neutral-150 text-neutral-500 bg-indigo-50/5">
                {{ (selectedColorSizes.find((s) => s.size === sizeName)?.qty ?? 0).toLocaleString('id-ID') }}
              </td>

              <!-- QTY Order Total (rowspan spans all rows) -->
              <td v-if="idx === 0" :rowspan="parallelDailyRows.length" class="px-3 py-3 text-right border-r border-neutral-200 font-bold bg-indigo-50/10 text-indigo-950">
                {{ selectedColorTotalOrder.toLocaleString('id-ID') }}
              </td>

              <!-- Cutting: Date & Qty -->
              <td class="px-3 py-3 text-center border-r border-neutral-200 text-neutral-600 bg-neutral-50/30">
                {{ row.cutting ? formatDate(row.cutting.date) : '—' }}
              </td>
              <td v-for="sizeName in selectedColorSizeNames" :key="'cutting-val-' + sizeName" class="px-3 py-3 text-right border-r border-neutral-150 text-neutral-500">
                {{ (row.cutting?.quantities[sizeName] ?? 0) > 0 ? (row.cutting?.quantities[sizeName] ?? 0).toLocaleString('id-ID') : '—' }}
              </td>
              <td class="px-3 py-3 text-right border-r border-neutral-200 font-bold bg-blue-50/10 text-blue-950">
                {{ (row.cutting?.total ?? 0) > 0 ? (row.cutting?.total ?? 0).toLocaleString('id-ID') : '—' }}
              </td>

              <!-- Sewing: Date & Qty -->
              <td class="px-3 py-3 text-center border-r border-neutral-200 text-neutral-600 bg-neutral-50/30">
                {{ row.sewing ? formatDate(row.sewing.date) : '—' }}
              </td>
              <td v-for="sizeName in selectedColorSizeNames" :key="'sewing-val-' + sizeName" class="px-3 py-3 text-right border-r border-neutral-150 text-neutral-500">
                {{ (row.sewing?.quantities[sizeName] ?? 0) > 0 ? (row.sewing?.quantities[sizeName] ?? 0).toLocaleString('id-ID') : '—' }}
              </td>
              <td class="px-3 py-3 text-right border-r border-neutral-200 font-bold bg-emerald-50/10 text-emerald-950">
                {{ (row.sewing?.total ?? 0) > 0 ? (row.sewing?.total ?? 0).toLocaleString('id-ID') : '—' }}
              </td>

              <!-- QC: Date & Qty -->
              <td class="px-3 py-3 text-center border-r border-neutral-200 text-neutral-600 bg-neutral-50/30">
                {{ row.qc ? formatDate(row.qc.date) : '—' }}
              </td>
              <td v-for="sizeName in selectedColorSizeNames" :key="'qc-val-' + sizeName" class="px-3 py-3 text-right border-r border-neutral-150 text-neutral-500">
                {{ (row.qc?.quantities[sizeName] ?? 0) > 0 ? (row.qc?.quantities[sizeName] ?? 0).toLocaleString('id-ID') : '—' }}
              </td>
              <td class="px-3 py-3 text-right border-r border-neutral-200 font-bold bg-amber-50/10 text-amber-950">
                {{ (row.qc?.total ?? 0) > 0 ? (row.qc?.total ?? 0).toLocaleString('id-ID') : '—' }}
              </td>

              <!-- Packing: Date & Qty -->
              <td class="px-3 py-3 text-center border-r border-neutral-200 text-neutral-600 bg-neutral-50/30">
                {{ row.packing ? formatDate(row.packing.date) : '—' }}
              </td>
              <td v-for="sizeName in selectedColorSizeNames" :key="'packing-val-' + sizeName" class="px-3 py-3 text-right border-r border-neutral-150 text-neutral-500">
                {{ (row.packing?.quantities[sizeName] ?? 0) > 0 ? (row.packing?.quantities[sizeName] ?? 0).toLocaleString('id-ID') : '—' }}
              </td>
              <td class="px-3 py-3 text-right border-r border-neutral-200 font-bold bg-violet-50/10 text-violet-950">
                {{ (row.packing?.total ?? 0) > 0 ? (row.packing?.total ?? 0).toLocaleString('id-ID') : '—' }}
              </td>

              <!-- Shipped: Date & Qty -->
              <td class="px-3 py-3 text-center border-r border-neutral-200 text-neutral-600 bg-neutral-50/30">
                {{ row.shipped ? formatDate(row.shipped.date) : '—' }}
              </td>
              <td v-for="sizeName in selectedColorSizeNames" :key="'shipped-val-' + sizeName" class="px-3 py-3 text-right border-r border-neutral-150 text-neutral-500">
                {{ (row.shipped?.quantities[sizeName] ?? 0) > 0 ? (row.shipped?.quantities[sizeName] ?? 0).toLocaleString('id-ID') : '—' }}
              </td>
              <td class="px-3 py-3 text-right font-bold bg-rose-50/10 text-rose-950 border-r border-neutral-200">
                {{ (row.shipped?.total ?? 0) > 0 ? (row.shipped?.total ?? 0).toLocaleString('id-ID') : '—' }}
              </td>
            </tr>

            <!-- Footer Row 1: TOTAL (Sum of values above) -->
            <tr class="bg-neutral-50 font-bold border-t-2 border-neutral-300">
              <td class="px-4 py-3 text-left border-r border-neutral-200 sticky left-0 bg-neutral-200 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                Total
              </td>
              <!-- QTY Order totals -->
              <td v-for="sizeName in selectedColorSizeNames" :key="'total-order-' + sizeName" class="px-3 py-3 text-right border-r border-neutral-150 bg-indigo-50/5 text-indigo-950">
                {{ (selectedColorSizes.find((s) => s.size === sizeName)?.qty ?? 0).toLocaleString('id-ID') }}
              </td>
              <td class="px-3 py-3 text-right border-r border-neutral-200 bg-indigo-50/10 text-indigo-950">
                {{ selectedColorTotalOrder.toLocaleString('id-ID') }}
              </td>

              <!-- Cutting Date separator -->
              <td class="px-3 py-3 text-center font-bold border-r border-neutral-200 bg-neutral-100/30">
                Total
              </td>
              <!-- Cutting Stage totals -->
              <td v-for="sizeName in selectedColorSizeNames" :key="'total-cutting-' + sizeName" class="px-3 py-3 text-right border-r border-neutral-150 bg-blue-50/5 text-blue-950">
                {{ (dailyTotals.cutting[sizeName] ?? 0).toLocaleString('id-ID') }}
              </td>
              <td class="px-3 py-3 text-right border-r border-neutral-200 bg-blue-50/10 text-blue-950">
                {{ dailyTotals.totalCutting.toLocaleString('id-ID') }}
              </td>

              <!-- Sewing Date separator -->
              <td class="px-3 py-3 text-center font-bold border-r border-neutral-200 bg-neutral-100/30">
                Total
              </td>
              <!-- Sewing Stage totals -->
              <td v-for="sizeName in selectedColorSizeNames" :key="'total-sewing-' + sizeName" class="px-3 py-3 text-right border-r border-neutral-150 bg-emerald-50/5 text-emerald-950">
                {{ (dailyTotals.sewing[sizeName] ?? 0).toLocaleString('id-ID') }}
              </td>
              <td class="px-3 py-3 text-right border-r border-neutral-200 bg-emerald-50/10 text-emerald-950">
                {{ dailyTotals.totalSewing.toLocaleString('id-ID') }}
              </td>

              <!-- QC Date separator -->
              <td class="px-3 py-3 text-center font-bold border-r border-neutral-200 bg-neutral-100/30">
                Total
              </td>
              <!-- QC Stage totals -->
              <td v-for="sizeName in selectedColorSizeNames" :key="'total-qc-' + sizeName" class="px-3 py-3 text-right border-r border-neutral-150 bg-amber-50/5 text-amber-950">
                {{ (dailyTotals.qc[sizeName] ?? 0).toLocaleString('id-ID') }}
              </td>
              <td class="px-3 py-3 text-right border-r border-neutral-200 bg-amber-50/10 text-amber-950">
                {{ dailyTotals.totalQc.toLocaleString('id-ID') }}
              </td>

              <!-- Packing Date separator -->
              <td class="px-3 py-3 text-center font-bold border-r border-neutral-200 bg-neutral-100/30">
                Total
              </td>
              <!-- Packing Stage totals -->
              <td v-for="sizeName in selectedColorSizeNames" :key="'total-packing-' + sizeName" class="px-3 py-3 text-right border-r border-neutral-150 bg-violet-50/5 text-violet-950">
                {{ (dailyTotals.packing[sizeName] ?? 0).toLocaleString('id-ID') }}
              </td>
              <td class="px-3 py-3 text-right border-r border-neutral-200 bg-violet-50/10 text-violet-950">
                {{ dailyTotals.totalPacking.toLocaleString('id-ID') }}
              </td>

              <!-- Shipped Date separator -->
              <td class="px-3 py-3 text-center font-bold border-r border-neutral-200 bg-neutral-100/30">
                Total
              </td>
              <!-- Shipped Stage totals -->
              <td v-for="sizeName in selectedColorSizeNames" :key="'total-shipped-' + sizeName" class="px-3 py-3 text-right border-r border-neutral-150 bg-rose-50/5 text-rose-950">
                {{ (dailyTotals.shipped[sizeName] ?? 0).toLocaleString('id-ID') }}
              </td>
              <td class="px-3 py-3 text-right bg-rose-50/10 text-rose-950 border-r border-neutral-200">
                {{ dailyTotals.totalShipped.toLocaleString('id-ID') }}
              </td>
            </tr>

            <!-- Footer Row 2: BALANCE (QTY Order - Total) -->
            <tr class="bg-neutral-50 font-bold">
              <td class="px-4 py-3 text-left border-r border-neutral-200 text-amber-800 bg-amber-100 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                Balance
              </td>
              <!-- QTY Order balance (0) -->
              <td v-for="sizeName in selectedColorSizeNames" :key="'balance-order-' + sizeName" class="px-3 py-3 text-right border-r border-neutral-150 text-neutral-400 bg-indigo-50/5">
                0
              </td>
              <td class="px-3 py-3 text-right border-r border-neutral-200 text-neutral-400 bg-indigo-50/10">
                0
              </td>

              <!-- Cutting Date separator -->
              <td class="px-3 py-3 text-center font-bold border-r border-neutral-200 bg-neutral-100/30 text-amber-800 bg-amber-50/10">
                Balance
              </td>
              <!-- Cutting Stage balances -->
              <td v-for="sizeName in selectedColorSizeNames" :key="'balance-cutting-' + sizeName" :class="['px-3 py-3 text-right border-r border-neutral-150', (dailyBalances.cutting[sizeName] ?? 0) > 0 ? 'text-amber-600' : 'text-neutral-500']">
                {{ (dailyBalances.cutting[sizeName] ?? 0).toLocaleString('id-ID') }}
              </td>
              <td :class="['px-3 py-3 text-right border-r border-neutral-200', dailyBalances.totalCutting > 0 ? 'text-amber-600' : 'text-neutral-500']">
                {{ dailyBalances.totalCutting.toLocaleString('id-ID') }}
              </td>

              <!-- Sewing Date separator -->
              <td class="px-3 py-3 text-center font-bold border-r border-neutral-200 bg-neutral-100/30 text-amber-800 bg-amber-50/10">
                Balance
              </td>
              <!-- Sewing Stage balances -->
              <td v-for="sizeName in selectedColorSizeNames" :key="'balance-sewing-' + sizeName" :class="['px-3 py-3 text-right border-r border-neutral-150', (dailyBalances.sewing[sizeName] ?? 0) > 0 ? 'text-amber-600' : 'text-neutral-500']">
                {{ (dailyBalances.sewing[sizeName] ?? 0).toLocaleString('id-ID') }}
              </td>
              <td :class="['px-3 py-3 text-right border-r border-neutral-200', dailyBalances.totalSewing > 0 ? 'text-amber-600' : 'text-neutral-500']">
                {{ dailyBalances.totalSewing.toLocaleString('id-ID') }}
              </td>

              <!-- QC Date separator -->
              <td class="px-3 py-3 text-center font-bold border-r border-neutral-200 bg-neutral-100/30 text-amber-800 bg-amber-50/10">
                Balance
              </td>
              <!-- QC Stage balances -->
              <td v-for="sizeName in selectedColorSizeNames" :key="'balance-qc-' + sizeName" :class="['px-3 py-3 text-right border-r border-neutral-150', (dailyBalances.qc[sizeName] ?? 0) > 0 ? 'text-amber-600' : 'text-neutral-500']">
                {{ (dailyBalances.qc[sizeName] ?? 0).toLocaleString('id-ID') }}
              </td>
              <td :class="['px-3 py-3 text-right border-r border-neutral-200', dailyBalances.totalQc > 0 ? 'text-amber-600' : 'text-neutral-500']">
                {{ dailyBalances.totalQc.toLocaleString('id-ID') }}
              </td>

              <!-- Packing Date separator -->
              <td class="px-3 py-3 text-center font-bold border-r border-neutral-200 bg-neutral-100/30 text-amber-800 bg-amber-50/10">
                Balance
              </td>
              <!-- Packing Stage balances -->
              <td v-for="sizeName in selectedColorSizeNames" :key="'balance-packing-' + sizeName" :class="['px-3 py-3 text-right border-r border-neutral-150', (dailyBalances.packing[sizeName] ?? 0) > 0 ? 'text-amber-600' : 'text-neutral-500']">
                {{ (dailyBalances.packing[sizeName] ?? 0).toLocaleString('id-ID') }}
              </td>
              <td :class="['px-3 py-3 text-right border-r border-neutral-200', dailyBalances.totalPacking > 0 ? 'text-amber-600' : 'text-neutral-500']">
                {{ dailyBalances.totalPacking.toLocaleString('id-ID') }}
              </td>

              <!-- Shipped Date separator -->
              <td class="px-3 py-3 text-center font-bold border-r border-neutral-200 bg-neutral-100/30 text-amber-800 bg-amber-50/10">
                Balance
              </td>
              <!-- Shipped Stage balances -->
              <td v-for="sizeName in selectedColorSizeNames" :key="'balance-shipped-' + sizeName" :class="['px-3 py-3 text-right border-r border-neutral-150', (dailyBalances.shipped[sizeName] ?? 0) > 0 ? 'text-amber-600' : 'text-neutral-500']">
                {{ (dailyBalances.shipped[sizeName] ?? 0).toLocaleString('id-ID') }}
              </td>
              <td :class="['px-3 py-3 text-right', dailyBalances.totalShipped > 0 ? 'text-amber-600' : 'text-neutral-500']">
                {{ dailyBalances.totalShipped.toLocaleString('id-ID') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  </div>
</template>
