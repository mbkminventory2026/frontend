<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from '@tanstack/vue-router';
import { ArrowLeftIcon, SaveIcon, PlusIcon, Trash2Icon, PackageIcon, XIcon, ChevronDownIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { createSuratJalanInternal } from '@/api/surat-jalan-internal/surat-jalan-internal';
import { getWorkOrderById } from '@/api/work-orders/work-orders';
import { getPackingLists, getPackingListById } from '@/api/packing-list/packing-list';
import type { PackingListListItem, PackingListResponse } from '@/schemas/packing-list/response';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const router = useRouter();

const isSubmitting = ref(false);
const isDropdownOpen = ref(false);

const allPackingLists = ref<PackingListListItem[]>([]);
const selectedPlIds = ref<Set<number>>(new Set());
const isLoadingPls = ref(false);
const isLoadingDetail = ref(false);
const loadedPlDetails = ref<Map<number, PackingListResponse>>(new Map());
const loadedWoDetails = ref<Map<number, any>>(new Map());

const availablePls = computed(() =>
  allPackingLists.value.filter(pl => !selectedPlIds.value.has(pl.id_packing_list))
);

const selectedPlList = computed(() =>
  allPackingLists.value.filter(pl => selectedPlIds.value.has(pl.id_packing_list))
);

interface TableItemRow {
  id: number;
  no: number;
  deskripsi: string;
  qty: number;
  note: string;
  from_pl_id?: number;
}

let rowIdCounter = 0;
const tableItems = ref<TableItemRow[]>([]);

const addManualRow = () => {
  tableItems.value.push({
    id: ++rowIdCounter,
    no: tableItems.value.length + 1,
    deskripsi: '',
    qty: 0,
    note: ''
  });
};

const removeRow = (id: number) => {
  tableItems.value = tableItems.value.filter(r => r.id !== id);
  tableItems.value.forEach((item, idx) => { item.no = idx + 1; });
};

const fetchPackingLists = async () => {
  isLoadingPls.value = true;
  try {
    const res = await getPackingLists({ limit: 500 });
    allPackingLists.value = res.results.filter(pl => !pl.id_surat_jalan_internal);
  } catch (e) {
    toast.error("Gagal memuat daftar Packing List.");
  } finally {
    isLoadingPls.value = false;
  }
};

const generateRowsForPl = async (plId: number) => {
  let plFull = loadedPlDetails.value.get(plId);
  if (!plFull) {
    plFull = await getPackingListById(plId);
    loadedPlDetails.value.set(plId, plFull);
  }

  let woDetail = loadedWoDetails.value.get(plFull.id_wo);
  if (!woDetail) {
    woDetail = await getWorkOrderById(plFull.id_wo).catch(() => null);
    if (woDetail) loadedWoDetails.value.set(plFull.id_wo, woDetail);
  }

  const styleName = woDetail?.po_client_item_style ? `Style ${woDetail.po_client_item_style} ` : '';
  const modelName = woDetail?.model || plFull.model || '';
  const newRows: TableItemRow[] = [];

  if (plFull.items && plFull.items.length > 0) {
    for (const item of plFull.items) {
      const sizeList = item.sizes?.length > 0 ? item.sizes.map((s: any) => s.size).join('-') : '';
      let desc = `${styleName}Model ${modelName} Warna ${item.color || ''}`;
      if (sizeList) desc += ` Size ${sizeList}`;
      newRows.push({ id: ++rowIdCounter, no: 0, deskripsi: desc, qty: 0, note: item.note || '', from_pl_id: plId });
    }
  } else {
    newRows.push({ id: ++rowIdCounter, no: 0, deskripsi: `${styleName}Model ${modelName}`, qty: 0, note: '', from_pl_id: plId });
  }

  return newRows;
};

const addPackingList = async (plId: number) => {
  isDropdownOpen.value = false;
  if (selectedPlIds.value.has(plId)) return;

  isLoadingDetail.value = true;
  try {
    const newRows = await generateRowsForPl(plId);
    selectedPlIds.value = new Set([...selectedPlIds.value, plId]);
    tableItems.value.push(...newRows);
    tableItems.value.forEach((item, idx) => { item.no = idx + 1; });
  } catch (e) {
    toast.error(`Gagal memuat rincian Packing List #${plId}.`);
  } finally {
    isLoadingDetail.value = false;
  }
};

const removePl = (plId: number) => {
  selectedPlIds.value.delete(plId);
  selectedPlIds.value = new Set(selectedPlIds.value);
  tableItems.value = tableItems.value.filter(r => r.from_pl_id !== plId);
  tableItems.value.forEach((item, idx) => { item.no = idx + 1; });
};

const handleSubmit = async () => {
  if (selectedPlIds.value.size === 0) {
    toast.error('Pilih minimal satu Packing List.');
    return;
  }
  isSubmitting.value = true;
  try {
    await createSuratJalanInternal({
      id_packing_lists: Array.from(selectedPlIds.value),
      items: tableItems.value.map((r, idx) => ({
        no: idx + 1,
        deskripsi: r.deskripsi,
        qty: r.qty,
        note: r.note
      }))
    });
    toast.success('Surat Jalan Internal berhasil dibuat.');
    router.navigate({ to: '/surat-jalan-internal' });
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Gagal membuat Surat Jalan Internal.');
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  fetchPackingLists();
});
</script>

<template>
  <div class="space-y-6 w-full max-w-[1400px] mx-auto p-2 md:p-6" @click.self="isDropdownOpen = false">
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
      <div class="flex items-center gap-3">
        <Button variant="outline" size="icon" class="rounded-xl border-slate-300 shadow-xs hover:bg-slate-100" @click="router.navigate({ to: '/surat-jalan-internal' })">
          <ArrowLeftIcon class="w-4 h-4 text-slate-700" />
        </Button>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold tracking-tight text-slate-900">Buat Surat Jalan Internal</h1>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Pengiriman Internal
            </span>
          </div>
          <p class="text-sm text-slate-500 mt-0.5">Pilih satu atau lebih Packing List sebagai acuan dokumen surat jalan</p>
        </div>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" @click="router.navigate({ to: '/surat-jalan-internal' })" :disabled="isSubmitting">
          Batal
        </Button>
        <Button @click="handleSubmit" :disabled="isSubmitting || selectedPlIds.size === 0" class="flex gap-2 items-center">
          <SaveIcon class="w-4 h-4" /> {{ isSubmitting ? 'Menyimpan...' : 'Simpan Surat Jalan' }}
        </Button>
      </div>
    </div>

    <!-- Packing List Selector Bar -->
    <Card class="rounded-2xl border-slate-200 shadow-xs bg-white">
      <CardContent class="py-4 px-5">
        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
          <div class="flex-shrink-0">
            <p class="text-sm font-semibold text-slate-700">Packing List <span class="text-rose-500">*</span></p>
            <p class="text-xs text-slate-400">Pilih satu atau lebih PL</p>
          </div>

          <!-- Selected PL chips -->
          <div class="flex flex-wrap gap-2 flex-1 min-w-0">
            <span
              v-for="pl in selectedPlList"
              :key="pl.id_packing_list"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
              PL #{{ pl.id_packing_list }} — WO #{{ pl.id_wo }} · {{ pl.model }}
              <button
                @click="removePl(pl.id_packing_list)"
                class="ml-1 text-emerald-600 hover:text-red-600 transition-colors"
                title="Hapus Packing List ini"
              >
                <XIcon class="w-3.5 h-3.5" />
              </button>
            </span>

            <span v-if="selectedPlIds.size === 0" class="text-sm text-slate-400 italic self-center">
              Belum ada Packing List
            </span>
          </div>

          <!-- Add PL Dropdown -->
          <div class="relative flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              class="flex gap-1.5 items-center font-medium"
              :disabled="isLoadingPls || availablePls.length === 0"
              @click.stop="isDropdownOpen = !isDropdownOpen"
            >
              <PlusIcon class="w-4 h-4" />
              Tambah Packing List
              <ChevronDownIcon class="w-3.5 h-3.5 opacity-60" :class="{ 'rotate-180': isDropdownOpen }" />
            </Button>

            <!-- Dropdown -->
            <div
              v-if="isDropdownOpen"
              class="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden"
              @click.stop
            >
              <div class="p-2 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                Pilih Packing List
              </div>
              <div class="max-h-64 overflow-y-auto">
                <div v-if="availablePls.length === 0" class="py-6 text-center text-slate-400 text-sm">
                  Semua Packing List sudah dipilih
                </div>
                <button
                  v-for="pl in availablePls"
                  :key="pl.id_packing_list"
                  @click="addPackingList(pl.id_packing_list)"
                  :disabled="isLoadingDetail"
                  class="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 disabled:opacity-40 cursor-pointer"
                >
                  <p class="text-sm font-semibold text-slate-800">Packing List #{{ pl.id_packing_list }}</p>
                  <p class="text-xs text-slate-500 mt-0.5">WO #{{ pl.id_wo }} · {{ pl.buyer }} · {{ pl.model }}</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isLoadingDetail" class="flex items-center gap-2 mt-3 text-sm text-slate-500">
          <div class="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent"></div>
          Memuat rincian barang dari Packing List...
        </div>
      </CardContent>
    </Card>

    <!-- Items Table Card -->
    <Card class="rounded-2xl border-slate-200 shadow-xs bg-white overflow-hidden">
      <CardHeader class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50 py-4 px-6">
        <div>
          <CardTitle class="text-base font-semibold text-slate-900">Rincian Barang Pengiriman</CardTitle>
          <CardDescription class="text-xs">
            Baris otomatis ter-prefill dari Packing List yang dipilih. QTY dan Note diisi manual.
          </CardDescription>
        </div>
        <Button size="sm" variant="outline" @click="addManualRow" class="flex gap-1.5 items-center self-start sm:self-auto font-medium" :disabled="selectedPlIds.size === 0 && tableItems.length === 0">
          <PlusIcon class="w-4 h-4" /> Tambah Baris Manual
        </Button>
      </CardHeader>

      <CardContent class="p-0">
        <div v-if="selectedPlIds.size === 0 && !isLoadingDetail" class="py-16 text-center text-slate-400 bg-slate-50/30">
          <PackageIcon class="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p class="text-base font-semibold text-slate-700">Packing List Belum Dipilih</p>
          <p class="text-sm text-slate-500 mt-1">Pilih Packing List di atas untuk memuat rincian barang secara otomatis.</p>
        </div>

        <div v-else-if="tableItems.length === 0 && !isLoadingDetail" class="py-16 text-center text-slate-400">
          <PackageIcon class="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p class="text-base font-semibold text-slate-700">Belum Ada Item Barang</p>
          <p class="text-sm text-slate-500 mt-1">Klik "Tambah Baris Manual" untuk menambahkan barang secara manual.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm text-left border-collapse">
            <thead class="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 sticky top-0">
              <tr>
                <th class="py-3.5 px-4 w-14 text-center">No.</th>
                <th class="py-3.5 px-4 min-w-[380px]">Desc (Deskripsi Barang)</th>
                <th class="py-3.5 px-4 w-40">Quantity</th>
                <th class="py-3.5 px-4 w-64">Note</th>
                <th class="py-3.5 px-4 w-14 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <template v-for="(item, idx) in tableItems" :key="item.id">
                <!-- Group label for PL source -->
                <tr
                  v-if="item.from_pl_id && (idx === 0 || tableItems[idx - 1]?.from_pl_id !== item.from_pl_id)"
                  class="bg-emerald-50/70"
                >
                  <td colspan="5" class="px-4 py-2 text-xs font-bold text-emerald-700 border-l-4 border-l-emerald-400">
                    Packing List #{{ item.from_pl_id }}
                  </td>
                </tr>
                <tr
                  v-if="!item.from_pl_id && (idx === 0 || tableItems[idx - 1]?.from_pl_id !== undefined)"
                  class="bg-slate-50/60"
                >
                  <td colspan="5" class="px-4 py-2 text-xs font-bold text-slate-500 border-l-4 border-l-slate-300">
                    Baris Manual
                  </td>
                </tr>

                <tr class="hover:bg-slate-50/80 transition-colors" :class="item.from_pl_id ? 'border-l-4 border-l-emerald-100' : 'border-l-4 border-l-slate-100'">
                  <td class="py-3 px-4 text-center font-bold text-slate-500">{{ idx + 1 }}</td>
                  <td class="p-2">
                    <Input v-model="item.deskripsi" placeholder="Deskripsi barang..." class="rounded-lg" />
                  </td>
                  <td class="p-2">
                    <Input type="number" v-model.number="item.qty" min="0" placeholder="0" class="rounded-lg text-right font-bold" />
                  </td>
                  <td class="p-2">
                    <Input v-model="item.note" placeholder="Contoh: Tanpa Reject" class="rounded-lg" />
                  </td>
                  <td class="p-2 text-center">
                    <Button variant="ghost" size="icon" class="h-9 w-9 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50" @click="removeRow(item.id)">
                      <Trash2Icon class="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <div v-if="tableItems.length > 0" class="flex justify-end gap-3 p-6 pt-4 border-t border-slate-100 bg-slate-50/30">
          <Button variant="outline" @click="router.navigate({ to: '/surat-jalan-internal' })" :disabled="isSubmitting">
            Batal
          </Button>
          <Button @click="handleSubmit" :disabled="isSubmitting || selectedPlIds.size === 0" class="flex gap-2 items-center">
            <SaveIcon class="w-4 h-4" /> {{ isSubmitting ? 'Menyimpan...' : 'Simpan Surat Jalan' }}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
