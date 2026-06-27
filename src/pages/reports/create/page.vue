<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue';
import { useRouter, useParams } from '@tanstack/vue-router';
import {
  ArrowLeftIcon,
  SaveIcon,
  ClipboardListIcon,
  ChevronDownIcon,
  InfoIcon,
  AlertTriangleIcon,
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { getProductionSummary, createFactoryReport } from '@/api/production/production';
import type { ProductionAggregateResponse, DivisionSlug } from '@/schemas/production/production';
import { DIVISION_META } from '@/schemas/production/production';
import { parseToInt } from '@/lib/number';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import DateInput from '@/components/form/DateInput.vue';

// ─── Router & Params ────────────────────────────────────────────────────────
const router = useRouter();
const params = useParams({ strict: false }) as any;
const divisiSlug = computed(() => params.value?.divisi as string);

// ─── Division Meta ───────────────────────────────────────────────────────────
const divisionMeta = computed(() =>
  DIVISION_META.find((d) => d.slug === divisiSlug.value) ?? null
);

// ─── Division Badge Color Map ────────────────────────────────────────────────
const divisionColorMap: Record<string, { badge: string; accent: string; bg: string }> = {
  cutting:    { badge: 'bg-blue-100 text-blue-700 border-blue-200',   accent: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' },
  sewing:     { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', accent: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  'qc-finish':{ badge: 'bg-amber-100 text-amber-700 border-amber-200',  accent: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' },
  packing:    { badge: 'bg-violet-100 text-violet-700 border-violet-200',accent: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
  pengiriman: { badge: 'bg-rose-100 text-rose-700 border-rose-200',    accent: 'text-rose-600',   bg: 'bg-rose-50 border-rose-200' },
};

const divisionColors = computed(() =>
  divisionColorMap[divisiSlug.value] ?? { badge: 'bg-neutral-100 text-neutral-700 border-neutral-200', accent: 'text-neutral-600', bg: 'bg-neutral-50 border-neutral-200' }
);

// ─── Prev Division Label (for info box) ─────────────────────────────────────
const prevDivisionLabel = computed(() => {
  const meta = divisionMeta.value;
  if (!meta) return '';
  if (meta.prevField === 'target_qty') return 'Target Work Order';
  // Map production stat field key → division slug
  const statFieldToSlug: Record<string, DivisionSlug> = {
    cutting: 'cutting',
    sewing:  'sewing',
    qc_pass: 'qc-finish',
    packing: 'packing',
  };
  const prevSlug = statFieldToSlug[meta.prevField];
  return DIVISION_META.find((d) => d.slug === prevSlug)?.label ?? meta.prevField;
});

// ─── Production Summary Data (for dropdown + max qty) ────────────────────────
const summaryItems = ref<ProductionAggregateResponse[]>([]);
const isLoadingSummary = ref(false);

const fetchSummaryData = async () => {
  isLoadingSummary.value = true;
  try {
    const response = await getProductionSummary({ limit: 200, page: 1 });
    summaryItems.value = response?.items ?? [];
  } catch (e) {
    console.error('Gagal fetch production summary:', e);
    toast.error('Gagal memuat daftar Target Pesanan.');
  } finally {
    isLoadingSummary.value = false;
  }
};

// ─── Form State ──────────────────────────────────────────────────────────────
const selectedIdWoShellSize = ref<number | ''>('');
const tanggal = ref('');
const qty = ref<string>('');
const isSaving = ref(false);

// ─── Selected Item & Max QTY Logic ───────────────────────────────────────────
const selectedItem = computed(() =>
  summaryItems.value.find((item) => item.id_wo_shell_size === selectedIdWoShellSize.value) ?? null
);

const maxQty = computed(() => {
  const item = selectedItem.value;
  const meta = divisionMeta.value;
  if (!item || !meta) return null;
  if (meta.prevField === 'target_qty') return item.target_qty;
  return item.production?.[meta.prevField as keyof typeof item.production] ?? 0;
});

const isQtyExceeding = computed(() => {
  if (maxQty.value === null || qty.value === '') return false;
  return parseToInt(qty.value) > maxQty.value;
});

// Reset qty when item changes to avoid stale exceeding state
watch(selectedIdWoShellSize, () => {
  qty.value = '';
});

// ─── Submit Handler ──────────────────────────────────────────────────────────
const handleSubmit = async () => {
  // Validate required fields
  if (!selectedIdWoShellSize.value) {
    toast.error('Harap pilih Target Pesanan terlebih dahulu.');
    return;
  }
  if (!tanggal.value) {
    toast.error('Harap isi Tanggal laporan.');
    return;
  }
  const qtyVal = parseToInt(qty.value);
  if (qty.value === '' || qtyVal <= 0) {
    toast.error('Jumlah QTY harus lebih dari 0.');
    return;
  }

  // Estafet validation
  if (maxQty.value !== null && qtyVal > maxQty.value) {
    toast.error(
      `QTY tidak boleh melebihi output ${prevDivisionLabel.value}: ${maxQty.value.toLocaleString('id-ID')} pcs.`
    );
    return;
  }

  isSaving.value = true;
  try {
    await createFactoryReport(divisiSlug.value, {
      id_wo_shell_size: Number(selectedIdWoShellSize.value),
      qty: qtyVal,
      tanggal: tanggal.value,
    });
    toast.success(`Laporan divisi ${divisionMeta.value?.label ?? divisiSlug.value} berhasil disimpan!`);
    router.navigate({ to: '/production-summary' });
  } catch (error: any) {
    const message = error?.response?.data?.message ?? 'Gagal menyimpan laporan. Silakan coba lagi.';
    toast.error(message);
  } finally {
    isSaving.value = false;
  }
};

// ─── Lifecycle ───────────────────────────────────────────────────────────────
onMounted(() => {
  tanggal.value = new Date().toISOString().split('T')[0] ?? '';
  fetchSummaryData();
});
</script>

<template>
  <div class="container mx-auto py-8 max-w-3xl space-y-6">

    <!-- ═══ HEADER ═══ -->
    <div class="flex flex-col md:flex-row md:items-center justify-between border-b pb-5 border-neutral-100 gap-4">
      <div class="flex items-center gap-3">
        <div class="bg-neutral-50 border border-neutral-200/80 p-2.5 rounded-xl shadow-sm">
          <ClipboardListIcon class="w-6 h-6 text-neutral-600" />
        </div>
        <div>
          <div class="flex items-center gap-2.5 mb-1">
            <h1 class="text-2xl font-bold tracking-tight text-neutral-900">
              Tambah Laporan Produksi
            </h1>
            <!-- Division Badge -->
            <span
              v-if="divisionMeta"
              :class="['text-xs font-semibold px-2.5 py-0.5 rounded-full border', divisionColors.badge]"
            >
              {{ divisionMeta.label }}
            </span>
          </div>
          <p class="text-[13px] text-neutral-500">
            Mencatat output harian divisi
            <strong class="text-neutral-700">{{ divisionMeta?.label ?? divisiSlug }}</strong>
            ke dalam sistem.
          </p>
        </div>
      </div>

      <Button
        type="button"
        @click="router.navigate({ to: '/production-summary' })"
        variant="outline"
        class="h-10 px-4 border-neutral-300 shadow-sm transition-all rounded-lg shrink-0"
      >
        <ArrowLeftIcon class="w-4 h-4 mr-2" /> Kembali
      </Button>
    </div>

    <!-- ═══ LOADING ═══ -->
    <div v-if="isLoadingSummary" class="flex flex-col items-center justify-center min-h-[300px] gap-4">
      <Spinner class="size-8" />
      <p class="text-neutral-500 animate-pulse text-sm">Memuat data pesanan...</p>
    </div>

    <!-- ═══ FORM ═══ -->
    <div v-else>
      <form @submit.prevent="handleSubmit" class="space-y-6">

        <!-- Form Card -->
        <Card class="border border-neutral-200 bg-white p-6 shadow-sm rounded-xl">
          <h2 class="text-sm font-bold text-neutral-800 uppercase tracking-wider mb-5 flex items-center gap-2">
            <span class="inline-block w-1.5 h-4 bg-neutral-900 rounded-full"></span>
            Informasi Laporan
          </h2>

          <div class="space-y-5">

            <!-- Target Pesanan Dropdown -->
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-neutral-700">
                Target Pesanan <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <select
                  v-model="selectedIdWoShellSize"
                  :disabled="isLoadingSummary"
                  class="w-full h-9 rounded-md border border-neutral-200 bg-white pl-3 pr-9 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 appearance-none cursor-pointer"
                >
                  <option value="" disabled>
                    {{ isLoadingSummary ? 'Memuat data pesanan...' : 'Pilih Model / Ukuran Target' }}
                  </option>
                  <option
                    v-for="item in summaryItems"
                    :key="item.id_wo_shell_size"
                    :value="item.id_wo_shell_size"
                  >
                    #ORD-{{ item.id_wo_shell_size }} — {{ item.model_name }} (Size {{ item.size }}) [Target: {{ item.target_qty.toLocaleString('id-ID') }} pcs]
                  </option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                  <ChevronDownIcon class="w-4 h-4 text-neutral-400" />
                </div>
              </div>
              <p v-if="summaryItems.length === 0 && !isLoadingSummary" class="text-xs text-amber-600">
                Tidak ada data pesanan aktif. Pastikan terdapat Work Order yang sudah dibuat.
              </p>
            </div>

            <!-- Date & QTY Row -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">

              <!-- Tanggal -->
              <div class="space-y-1.5">
                <label class="text-sm font-medium text-neutral-700">
                  Tanggal Laporan <span class="text-red-500">*</span>
                </label>
                <DateInput
                  v-model="tanggal"
                  class="h-9 text-sm border-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-800 bg-white"
                />
              </div>

              <!-- QTY -->
              <div class="space-y-1.5">
                <label class="text-sm font-medium text-neutral-700">
                  Jumlah Output (Pcs) <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <Input
                    v-model="qty"
                    type="text"
                    min="1"
                    :max="maxQty ?? undefined"
                    placeholder="Masukkan qty hasil produksi"
                    :class="[
                      'h-9 text-sm border-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-800 bg-white',
                      isQtyExceeding ? 'border-red-400 focus-visible:ring-red-400' : '',
                    ]"
                  />
                </div>
                <p v-if="isQtyExceeding" class="text-xs text-red-500 flex items-center gap-1">
                  <AlertTriangleIcon class="w-3 h-3" />
                  Melebihi batas maksimal {{ maxQty?.toLocaleString('id-ID') }} pcs
                </p>
              </div>
            </div>

            <!-- ═══ ESTAFET INFO BOX ═══ -->
            <div
              v-if="selectedItem && divisionMeta"
              :class="['rounded-lg border p-4 space-y-2', divisionColors.bg]"
            >
              <div class="flex items-start gap-2">
                <InfoIcon :class="['w-4 h-4 mt-0.5 shrink-0', divisionColors.accent]" />
                <div class="space-y-1">
                  <p class="text-sm font-semibold text-neutral-800">
                    Batas Maksimal QTY untuk Divisi {{ divisionMeta.label }}
                  </p>
                  <p class="text-xs text-neutral-600">
                    Berdasarkan output dari
                    <strong class="text-neutral-800">{{ prevDivisionLabel }}</strong>:
                    <span :class="['font-bold text-base', divisionColors.accent]">
                      {{ maxQty?.toLocaleString('id-ID') ?? '—' }} pcs
                    </span>
                  </p>

                  <!-- Production Chain Visual -->
                  <div class="flex items-center gap-1.5 flex-wrap mt-2 pt-2 border-t border-neutral-200/60">
                    <template v-for="(d, idx) in DIVISION_META" :key="d.slug">
                      <span
                        :class="[
                          'text-[10px] font-semibold px-2 py-0.5 rounded',
                          d.slug === divisiSlug
                            ? 'bg-neutral-800 text-white'
                            : 'bg-neutral-100 text-neutral-500',
                        ]"
                      >
                        {{ d.label }}
                      </span>
                      <span v-if="idx < DIVISION_META.length - 1" class="text-neutral-300 text-xs">→</span>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <!-- No item selected hint -->
            <div
              v-else-if="!selectedItem"
              class="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 p-4 text-center"
            >
              <p class="text-xs text-neutral-400">
                Pilih Target Pesanan di atas untuk melihat batas maksimal QTY berdasarkan estafet produksi.
              </p>
            </div>

          </div>
        </Card>

        <!-- ═══ FOOTER BUTTONS ═══ -->
        <div class="border-t border-neutral-200 pt-6 flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            @click="router.navigate({ to: '/production-summary' })"
            class="h-10 px-5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 rounded-lg transition-all border-neutral-300"
          >
            Batal
          </Button>
          <Button
            type="submit"
            :disabled="isSaving || isQtyExceeding"
            class="h-10 px-6 text-sm font-medium bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg shadow-sm border border-neutral-800 transition-all flex items-center gap-2 active:scale-[0.98] disabled:opacity-50"
          >
            <template v-if="isSaving">
              <Spinner class="w-4 h-4" /> Menyimpan...
            </template>
            <template v-else>
              <SaveIcon class="w-4 h-4" /> Kirim Laporan
            </template>
          </Button>
        </div>

      </form>
    </div>

  </div>
</template>
