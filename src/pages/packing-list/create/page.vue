<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue';
import { useRouter } from '@tanstack/vue-router';
import { PlusIcon, Trash2Icon, ArrowLeftIcon, SaveIcon, PackageIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { getWorkOrders, getWorkOrderById, type WorkOrderListItem, type WorkOrderDetailResponse } from '@/api/work-orders/work-orders';
import { createPackingList } from '@/api/packing-list/packing-list';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const router = useRouter();

// Master Data Lists
const woList = ref<WorkOrderListItem[]>([]);
const isLoadingWO = ref(false);
const isLoadingWoDetail = ref(false);

const selectedWoId = ref<number | ''>('');
const woDetail = ref<WorkOrderDetailResponse | null>(null);

// Header state
interface RejectSizeInput {
  qty: string;
  sizeName: string;
}

const rejectSizes = ref<RejectSizeInput[]>([]);

const totalReject = computed(() => {
  return rejectSizes.value.reduce((acc, curr) => acc + (parseInt(curr.qty) || 0), 0);
});

// Dynamic Box Groups State
interface SizeInput {
  qty: string;
  sizeName: string;
}

interface BoxGroupInput {
  color: string;
  box_no_start: string;
  box_no_end: string;
  note: string;
  sizes: SizeInput[];
}

const boxGroups = ref<BoxGroupInput[]>([]);
const isSaving = ref(false);

// Overlap check for box numbers
const boxNumberOverlaps = computed(() => {
  const overlaps: Record<number, boolean> = {};
  const ranges = boxGroups.value.map((g, idx) => {
    const start = parseInt(g.box_no_start) || 0;
    const end = parseInt(g.box_no_end) || 0;
    return { idx, start, end };
  });

  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      const r1 = ranges[i];
      const r2 = ranges[j];
      if (r1 && r2) {
        if (r1.start > 0 && r1.end >= r1.start && r2.start > 0 && r2.end >= r2.start) {
          if (Math.max(r1.start, r2.start) <= Math.min(r1.end, r2.end)) {
            overlaps[r1.idx] = true;
            overlaps[r2.idx] = true;
          }
        }
      }
    }
  }
  return overlaps;
});

// Load Work Orders
const fetchWorkOrders = async () => {
  isLoadingWO.value = true;
  try {
    const res = await getWorkOrders({ limit: 500 });
    woList.value = res?.results ?? [];
  } catch (e) {
    console.error('Failed to load Work Orders:', e);
    toast.error('Gagal memuat daftar Work Order.');
  } finally {
    isLoadingWO.value = false;
  }
};

// Colors available in the selected WO's shells
const availableColors = computed(() => {
  if (!woDetail.value || !woDetail.value.shells) return [];
  const colorsSet = new Set<string>();
  woDetail.value.shells.forEach(s => {
    if (s.color) colorsSet.add(s.color);
  });
  return Array.from(colorsSet);
});

// Sizes list from the selected WO
const woSizes = computed(() => {
  if (!woDetail.value || !woDetail.value.shells || woDetail.value.shells.length === 0) return [];
  return woDetail.value.shells[0]?.sizes || [];
});

// Watch WO loads details
watch(selectedWoId, async (newWoId) => {
  woDetail.value = null;
  boxGroups.value = [];
  rejectSizes.value = [];

  if (newWoId) {
    isLoadingWoDetail.value = true;
    try {
      const detail = await getWorkOrderById(newWoId);
      woDetail.value = detail;
      
      // Initialize reject sizes state
      rejectSizes.value = woSizes.value.map(sz => ({
        qty: '',
        sizeName: sz.size
      }));
      
      // Initialize with one empty box group row
      addBoxGroup();
    } catch (e) {
      console.error('Failed to load Work Order details:', e);
      toast.error('Gagal memuat rincian Work Order.');
    } finally {
      isLoadingWoDetail.value = false;
    }
  }
});

const addBoxGroup = () => {
  const initialColor = availableColors.value[0] || '';
  
  // Predict next box number start based on previous rows
  let nextStart = 1;
  if (boxGroups.value.length > 0) {
    const lastGroup = boxGroups.value[boxGroups.value.length - 1];
    const lastEnd = parseInt(lastGroup?.box_no_end || '0');
    if (!isNaN(lastEnd) && lastEnd > 0) {
      nextStart = lastEnd + 1;
    }
  }

  boxGroups.value.push({
    color: initialColor,
    box_no_start: String(nextStart),
    box_no_end: String(nextStart),
    note: '',
    sizes: woSizes.value.map(sz => ({
      qty: '',
      sizeName: sz.size
    }))
  });
};

const removeBoxGroup = (idx: number) => {
  boxGroups.value.splice(idx, 1);
};

// Calculate box count for a single group
const getBoxCount = (group: BoxGroupInput): number => {
  const start = parseInt(group.box_no_start) || 0;
  const end = parseInt(group.box_no_end) || 0;
  if (end < start) return 0;
  return end - start + 1;
};

// Calculate pieces per box for a single group (sum of sizes quantity)
const getQtyPerBox = (group: BoxGroupInput): number => {
  return group.sizes.reduce((acc, curr) => acc + (parseInt(curr.qty) || 0), 0);
};

// Grand total boxes
const grandTotalBoxes = computed(() => {
  return boxGroups.value.reduce((acc, group) => acc + getBoxCount(group), 0);
});

// Grand total garments
const grandTotalGarments = computed(() => {
  return boxGroups.value.reduce((acc, group) => {
    const boxCount = getBoxCount(group);
    const qtyPerBox = getQtyPerBox(group);
    return acc + (boxCount * qtyPerBox);
  }, 0);
});

// Auto-fill box end number based on start and quantity adjustments if needed
const updateEndNumber = (group: BoxGroupInput) => {
  const start = parseInt(group.box_no_start) || 0;
  const end = parseInt(group.box_no_end) || 0;
  if (end < start) {
    group.box_no_end = group.box_no_start;
  }
};

const handleSubmit = async () => {
  if (!selectedWoId.value) {
    toast.error('Harap pilih Work Order rujukan.');
    return;
  }
  if (boxGroups.value.length === 0) {
    toast.error('Harap tambahkan minimal 1 baris rincian box.');
    return;
  }

  // Validate items
  let idx = 0;
  const ranges: { start: number; end: number; line: number }[] = [];
  for (const group of boxGroups.value) {
    if (!group.color) {
      toast.error(`Harap pilih warna pada Baris #${idx + 1}`);
      return;
    }
    const start = parseInt(group.box_no_start) || 0;
    const end = parseInt(group.box_no_end) || 0;
    if (start <= 0 || end <= 0) {
      toast.error(`Nomor box harus berupa angka positif pada Baris #${idx + 1}`);
      return;
    }
    if (end < start) {
      toast.error(`Nomor box akhir tidak boleh kurang dari awal pada Baris #${idx + 1}`);
      return;
    }
    const qtyPerBox = getQtyPerBox(group);
    if (qtyPerBox <= 0) {
      toast.error(`Harap isi kuantitas size breakdown minimal 1 pcs pada Baris #${idx + 1}`);
      return;
    }

    // Overlap validation
    for (const r of ranges) {
      if (Math.max(start, r.start) <= Math.min(end, r.end)) {
        toast.error(`Nomor karton Baris #${idx + 1} (${start}-${end}) tumpang tindih dengan Baris #${r.line} (${r.start}-${r.end}).`);
        return;
      }
    }
    ranges.push({ start, end, line: idx + 1 });

    idx++;
  }

  isSaving.value = true;
  try {
    const payload = {
      total_garment_per_box: grandTotalGarments.value, // Total garments in all boxes
      total_reject: totalReject.value,
      id_wo: Number(selectedWoId.value),
      id_surat_jalan_internal: null,
      items: boxGroups.value.map(group => ({
        color: group.color,
        qty_box: getBoxCount(group),
        qty_per_box: getQtyPerBox(group),
        box_no_start: parseInt(group.box_no_start),
        box_no_end: parseInt(group.box_no_end),
        note: group.note,
        sizes: group.sizes.map(sz => ({
          qty: parseInt(sz.qty) || 0
        }))
      })),
      reject_sizes: rejectSizes.value.map(sz => ({
        qty: parseInt(sz.qty) || 0
      }))
    };

    const res = await createPackingList(payload);
    toast.success('Packing List berhasil disimpan!');
    
    // Redirect to detail page
    if (res && res.id_packing_list) {
      router.navigate({ to: '/packing-list/$id', params: { id: String(res.id_packing_list) } });
    } else {
      router.navigate({ to: '/packing-list' });
    }
  } catch (error: any) {
    const msg = error?.response?.data?.message ?? 'Gagal menyimpan Packing List.';
    toast.error(msg);
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  fetchWorkOrders();
});
</script>

<template>
  <div class="container mx-auto py-8 space-y-8 max-w-7xl">
    <!-- Header -->
    <div class="flex items-center gap-4 border-b pb-5 border-neutral-100 justify-between">
      <div class="flex items-center gap-3">
        <div class="bg-neutral-50 border border-neutral-200 p-2.5 rounded-xl shadow-sm">
          <PackageIcon class="w-6 h-6 text-neutral-700" />
        </div>
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-neutral-900">Tambah Packing List</h1>
          <p class="text-[13px] text-neutral-500 mt-1">
            Buat dokumen packing list baru dengan rujukan Work Order, isi nomor karton box, dan breakdown size quantity.
          </p>
        </div>
      </div>
      <Button @click="router.history.back()" variant="outline" class="border-neutral-200">
        <ArrowLeftIcon class="w-4 h-4 mr-2" /> Kembali
      </Button>
    </div>

    <!-- MAIN FORM CARD -->
    <Card class="border border-neutral-200 bg-white p-6 shadow-sm rounded-xl">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        
        <!-- Header Info Fields -->
        <h2 class="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
          <span class="inline-block w-1.5 h-4 bg-neutral-900 rounded-full"></span>
          Informasi Utama & Rujukan
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-1.5">
            <Label class="text-xs font-semibold text-neutral-700">Rujukan Work Order <span class="text-red-500">*</span></Label>
            <div class="relative">
              <select v-model="selectedWoId" class="w-full h-9 px-3 rounded-md border border-neutral-200 bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-neutral-400" required>
                <option value="" disabled>-- Pilih Work Order --</option>
                <option v-for="wo in woList" :key="wo.id_wo" :value="wo.id_wo">
                  #{{ wo.id_wo }} - {{ wo.model }} (Buyer: {{ wo.buyer }})
                </option>
              </select>
            </div>
          </div>

          <div class="space-y-1.5">
            <Label class="text-xs font-semibold text-neutral-700">Total Reject (Pcs)</Label>
            <Input :value="totalReject" type="number" readonly class="h-9 text-xs border-neutral-200 bg-neutral-50 cursor-not-allowed font-semibold" />
          </div>
        </div>

        <div v-if="isLoadingWoDetail" class="flex items-center justify-center py-12 gap-2 text-neutral-500 text-sm">
          <Spinner class="w-5 h-5" />
          <span>Memuat rincian ukuran Work Order...</span>
        </div>

        <div v-else-if="woDetail" class="space-y-6 animate-fade-in">
          <Separator class="bg-neutral-100" />

          <!-- Breakdown Reject Qty per Size -->
          <div class="space-y-3 bg-red-50/10 border border-red-100 rounded-xl p-5 shadow-3xs">
            <h3 class="text-xs font-bold text-red-800 uppercase tracking-wider flex items-center gap-2">
              <span class="inline-block w-1.5 h-4 bg-red-600 rounded-full"></span>
              Breakdown Reject Qty per Size
            </h3>
            <p class="text-[11px] text-neutral-500">
              Masukkan jumlah garment reject untuk masing-masing ukuran (opsional).
            </p>
            <div class="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 gap-3">
              <div v-for="(sz, szIdx) in rejectSizes" :key="szIdx" class="bg-white border border-neutral-200 rounded-md p-1.5 space-y-1 text-center shadow-3xs">
                <span class="text-[10px] font-bold text-neutral-500 block">Sz {{ sz.sizeName }}</span>
                <input v-model="sz.qty" type="number" min="0" placeholder="0" class="w-full text-center text-xs font-mono font-bold border-b border-neutral-150 py-0.5 focus:outline-none focus:border-red-400" />
              </div>
            </div>
          </div>

          <Separator class="bg-neutral-100" />

          <!-- Dynamic Box Groups Section -->
          <div class="flex items-center justify-between border-b pb-2 border-neutral-100">
            <h2 class="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
              <span class="inline-block w-1.5 h-4 bg-neutral-900 rounded-full"></span>
              Rincian Box / Karton & Size Breakdown
            </h2>
            <Button type="button" @click="addBoxGroup" variant="outline" size="sm" class="h-8 text-[11px] border-neutral-300">
              <PlusIcon class="w-3.5 h-3.5 mr-1" /> Tambah Baris Box
            </Button>
          </div>

          <!-- List of Box Groups -->
          <div class="space-y-4">
            <div v-for="(group, groupIdx) in boxGroups" :key="groupIdx" class="border border-neutral-150 rounded-xl p-5 bg-neutral-50/20 shadow-2xs space-y-4 relative hover:border-neutral-300 transition-colors">
              <button type="button" @click="removeBoxGroup(groupIdx)" class="absolute top-4 right-4 text-neutral-400 hover:text-red-500 transition-colors p-1" title="Hapus Karton">
                <Trash2Icon class="w-4 h-4" />
              </button>

              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <!-- Color -->
                <div class="space-y-1">
                  <Label class="text-[11px] font-semibold text-neutral-600">Warna <span class="text-red-500">*</span></Label>
                  <select v-model="group.color" class="w-full h-8 px-2.5 rounded-md border border-neutral-200 bg-white text-xs focus:outline-none" required>
                    <option value="" disabled>-- Warna --</option>
                    <option v-for="color in availableColors" :key="color" :value="color">
                      {{ color }}
                    </option>
                  </select>
                </div>

                <!-- Box Start -->
                <div class="space-y-1">
                  <Label class="text-[11px] font-semibold text-neutral-600">Karton Mulai <span class="text-red-500">*</span></Label>
                  <Input v-model="group.box_no_start" type="number" min="1" @input="updateEndNumber(group)" :class="{'border-red-500 focus-visible:ring-red-500': boxNumberOverlaps[groupIdx]}" class="h-8 text-xs border-neutral-200 bg-white" required />
                </div>

                <!-- Box End -->
                <div class="space-y-1">
                  <Label class="text-[11px] font-semibold text-neutral-600">Karton Akhir <span class="text-red-500">*</span></Label>
                  <Input v-model="group.box_no_end" type="number" :min="group.box_no_start" @input="updateEndNumber(group)" :class="{'border-red-500 focus-visible:ring-red-500': boxNumberOverlaps[groupIdx]}" class="h-8 text-xs border-neutral-200 bg-white" required />
                </div>

                <!-- Box Qty Info -->
                <div class="space-y-1 flex flex-col justify-end pb-1 text-xs text-neutral-500">
                  <p class="font-sans">Jumlah Box: <span class="font-mono font-bold text-neutral-800">{{ getBoxCount(group) }} Box</span></p>
                </div>
              </div>

              <!-- Overlap Warning Message -->
              <p v-if="boxNumberOverlaps[groupIdx]" class="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                ⚠️ Nomor karton tumpang tindih dengan baris box lain. Harap sesuaikan agar unik.
              </p>

              <!-- Sizes Grid Breakdown -->
              <div class="space-y-1.5">
                <Label class="text-[11px] font-semibold text-neutral-600">Breakdown Size Qty (per Box) <span class="text-red-500">*</span></Label>
                <div class="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                  <div v-for="(sz, szIdx) in group.sizes" :key="szIdx" class="bg-white border border-neutral-200 rounded-md p-1.5 space-y-1 text-center shadow-3xs">
                    <span class="text-[10px] font-bold text-neutral-500 block">Sz {{ sz.sizeName }}</span>
                    <input v-model="sz.qty" type="number" min="0" placeholder="0" class="w-full text-center text-xs font-mono font-bold border-b border-neutral-100 py-0.5 focus:outline-none focus:border-neutral-400" />
                  </div>
                </div>
              </div>

              <!-- Item Footer Summary -->
              <div class="flex flex-wrap items-center justify-between text-xs text-neutral-500 border-t pt-3 border-neutral-100 font-sans">
                <div class="flex gap-4">
                  <p>Qty per Box: <span class="font-mono font-bold text-neutral-800">{{ getQtyPerBox(group).toLocaleString('id-ID') }} Pcs</span></p>
                  <p>Total Pcs Group: <span class="font-mono font-bold text-neutral-950 text-sm">{{ (getBoxCount(group) * getQtyPerBox(group)).toLocaleString('id-ID') }} Pcs</span></p>
                </div>
                <div class="space-y-1 max-w-sm w-full md:w-auto">
                  <input v-model="group.note" type="text" placeholder="Catatan / Note" class="w-full h-8 px-2.5 rounded-md border border-neutral-250 bg-white text-[11px]" />
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Grand Total Summary -->
          <div class="bg-neutral-50 border border-neutral-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans">
            <div>
              <h3 class="text-xs font-bold text-neutral-700 uppercase tracking-wider">Total Kuantitas Packing List</h3>
              <p class="text-[11px] text-neutral-500 mt-0.5">Ringkasan kuantitas box dan garment dari seluruh rincian karton.</p>
            </div>
            <div class="flex gap-8 text-sm">
              <div class="space-y-0.5">
                <span class="text-neutral-500 text-xs block">Total Box</span>
                <span class="font-mono font-bold text-neutral-900 text-lg">{{ grandTotalBoxes.toLocaleString('id-ID') }} Box</span>
              </div>
              <div class="space-y-0.5">
                <span class="text-neutral-500 text-xs block">Total Garment Pcs</span>
                <span class="font-mono font-bold text-neutral-950 text-xl">{{ grandTotalGarments.toLocaleString('id-ID') }} Pcs</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 pt-4 border-t border-neutral-100">
            <Button type="button" variant="outline" @click="router.history.back()" :disabled="isSaving" class="border-neutral-300">
              Batal
            </Button>
            <Button type="submit" :disabled="isSaving" class="flex-1 md:flex-none">
              <template v-if="isSaving">
                <Spinner class="w-4 h-4 mr-2" />
                Menyimpan...
              </template>
              <template v-else>
                <SaveIcon class="w-4 h-4 mr-2" />
                Simpan Packing List
              </template>
            </Button>
          </div>
        </div>
      </form>
    </Card>
  </div>
</template>
