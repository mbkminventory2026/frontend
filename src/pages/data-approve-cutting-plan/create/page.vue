<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue';
import { useRouter } from '@tanstack/vue-router';
import { ArrowLeftIcon, SaveIcon, ChevronDownIcon, ClipboardCheckIcon, Loader2Icon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { getPOClients, type POClientListItem } from '@/api/po-clients/po-clients';
import { getWorkOrders, type WorkOrderListItem } from '@/api/work-orders/work-orders';
import { createDataApproveCuttingPlan } from '@/api/data-approve-cutting/data-approve-cutting';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import Separator from '@/components/ui/separator/Separator.vue';

const router = useRouter();

// ── Dropdown state ──────────────────────────────────────────────
const poList = ref<POClientListItem[]>([]);
const woList = ref<WorkOrderListItem[]>([]);
const isLoadingPO = ref(false);
const isLoadingWO = ref(false);
const selectedPoId = ref<number | ''>('');
const selectedWoId = ref<number | ''>('');

// ── Form state ─────────────────────────────────────────────────
const noDokumen = ref('');
const tanggal = ref('');
const isSaving = ref(false);

const selectedPo = computed(() => poList.value.find(p => p.id_po_client === selectedPoId.value) ?? null);
const filteredWoList = computed(() => {
  if (!selectedPo.value) return woList.value;
  return woList.value.filter(wo => wo.po_number === selectedPo.value?.po_number);
});

// ── Fetch initial data ──────────────────────────────────────────
const fetchInitial = async () => {
  isLoadingPO.value = true;
  isLoadingWO.value = true;
  try {
    const [poRes, woRes] = await Promise.all([
      getPOClients({ limit: 200 }),
      getWorkOrders({ limit: 500 }),
    ]);
    poList.value = poRes?.results ?? [];
    woList.value = woRes?.results ?? [];
  } catch {
    toast.error('Gagal memuat data PO dan Work Order.');
  } finally {
    isLoadingPO.value = false;
    isLoadingWO.value = false;
  }
};

// ── When PO changes, reset WO ────────────────────────────────────
watch(selectedPoId, () => {
  selectedWoId.value = '';
});

// ── Submit ────────────────────────────────────────────────────────
const handleSubmit = async () => {
  if (!noDokumen.value.trim()) {
    toast.error('Harap isi Nomor Dokumen.');
    return;
  }
  if (!tanggal.value) {
    toast.error('Harap isi Tanggal.');
    return;
  }
  if (!selectedWoId.value) {
    toast.error('Harap pilih Work Order.');
    return;
  }

  isSaving.value = true;
  try {
    const created = await createDataApproveCuttingPlan({
      no_dokumen: noDokumen.value.trim(),
      tanggal: tanggal.value,
      id_wo: Number(selectedWoId.value),
    });
    toast.success('Data Approve Cutting Plan berhasil dibuat!');
    // Navigasi menggunakan window.location agar tidak bergantung pada
    // routeTree.gen.ts yang belum di-regenerate setelah route baru ditambahkan.
    window.location.href = `/data-approve-cutting-plan/${created.id_dacp}`;
  } catch (err: any) {
    const msg = err?.response?.data?.message ?? 'Gagal membuat dokumen.';
    toast.error(msg);
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  tanggal.value = new Date().toISOString().split('T')[0] ?? '';
  fetchInitial();
});
</script>


<template>
  <div class="container mx-auto py-8 space-y-8 max-w-5xl">
    <!-- Header -->
    <div class="flex items-center justify-between border-b pb-5 border-neutral-100">
      <div class="flex items-center gap-3">
        <div class="bg-neutral-50 border border-neutral-200 p-2.5 rounded-xl shadow-sm">
          <ClipboardCheckIcon class="w-6 h-6 text-neutral-700" />
        </div>
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-neutral-900">Buat Data Approve Cutting Plan</h1>
          <p class="text-[13px] text-neutral-500 mt-1">
            Dokumen ini akan menggabungkan data QTY Order, Cutting Plan, Cutting Actual, dan Report Cutting dari Work Order yang dipilih.
          </p>
        </div>
      </div>
      <Button @click="router.history.back()" variant="outline" class="border-neutral-200 shrink-0">
        <ArrowLeftIcon class="w-4 h-4 mr-2" /> Kembali
      </Button>
    </div>

    <!-- Form Card -->
    <Card class="border border-neutral-200 bg-white p-6 shadow-sm rounded-xl">
      <form @submit.prevent="handleSubmit" class="space-y-6">

        <!-- Informasi Dokumen -->
        <h2 class="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
          <span class="inline-block w-1.5 h-4 bg-neutral-900 rounded-full"></span>
          Informasi Dokumen
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-1.5">
            <Label class="text-xs font-semibold text-neutral-700">Nomor Dokumen <span class="text-red-500">*</span></Label>
            <Input
              id="no-dokumen-dacp"
              v-model="noDokumen"
              type="text"
              placeholder="Contoh: DACP/2025/001"
              class="h-9 text-xs border-neutral-200"
              required
            />
          </div>
          <div class="space-y-1.5">
            <Label class="text-xs font-semibold text-neutral-700">Tanggal <span class="text-red-500">*</span></Label>
            <Input
              id="tanggal-dacp"
              v-model="tanggal"
              type="date"
              class="h-9 text-xs border-neutral-200"
              required
            />
          </div>
        </div>

        <Separator class="bg-neutral-100" />

        <!-- Rujukan Work Order -->
        <h2 class="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
          <span class="inline-block w-1.5 h-4 bg-neutral-900 rounded-full"></span>
          Rujukan Work Order
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-1.5">
            <Label class="text-xs font-semibold text-neutral-700">Purchase Order <span class="text-red-500">*</span></Label>
            <div class="relative">
              <select
                id="po-select-dacp"
                v-model="selectedPoId"
                :disabled="isLoadingPO"
                class="w-full h-9 rounded-md border border-neutral-200 bg-white pl-3 pr-9 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 appearance-none cursor-pointer"
              >
                <option value="" disabled>Pilih Purchase Order</option>
                <option v-for="po in poList" :key="po.id_po_client" :value="po.id_po_client">
                  {{ po.po_number }} — {{ po.mitra_name }}
                </option>
              </select>
              <ChevronDownIcon class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            </div>
          </div>

          <div class="space-y-1.5">
            <Label class="text-xs font-semibold text-neutral-700">Work Order <span class="text-red-500">*</span></Label>
            <div class="relative">
              <select
                id="wo-select-dacp"
                v-model="selectedWoId"
                :disabled="!selectedPoId || isLoadingWO"
                class="w-full h-9 rounded-md border border-neutral-200 bg-white pl-3 pr-9 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 appearance-none cursor-pointer"
              >
                <option value="" disabled>Pilih Work Order</option>
                <option v-for="wo in filteredWoList" :key="wo.id_wo" :value="wo.id_wo">
                  WO #{{ wo.id_wo }} — {{ wo.buyer }} · {{ wo.model }}
                </option>
              </select>
              <ChevronDownIcon class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            </div>
          </div>
        </div>

        <!-- Info Box -->
        <div v-if="selectedWoId" class="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 space-y-1">
          <p class="font-semibold flex items-center gap-1.5">
            <ClipboardCheckIcon class="w-3.5 h-3.5" />
            Data Tabel Akan Dibuat Otomatis
          </p>
          <p class="text-blue-600">
            Setelah disimpan, sistem akan secara otomatis mengambil dan menggabungkan data dari:
            <strong>WO Shell Size</strong> (QTY Order), <strong>Spreading Plan</strong> (QTY Cutting Plan),
            <strong>Marker Plan</strong> (QTY Cutting Actual), dan <strong>Report Cutting</strong> (Cutting Report &amp; Balance Allowance).
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
          <Button @click="router.history.back()" type="button" variant="outline" class="border-neutral-200">
            Batal
          </Button>
          <Button
            id="btn-simpan-dacp"
            :disabled="isSaving || !selectedWoId || !noDokumen || !tanggal"
            type="submit"
            class="bg-neutral-900 text-white hover:bg-neutral-800"
          >
            <Loader2Icon v-if="isSaving" class="w-4 h-4 mr-2 animate-spin" />
            <SaveIcon v-else class="w-4 h-4 mr-2" />
            {{ isSaving ? 'Menyimpan...' : 'Simpan & Ajukan Approval' }}
          </Button>
        </div>

      </form>
    </Card>
  </div>
</template>
