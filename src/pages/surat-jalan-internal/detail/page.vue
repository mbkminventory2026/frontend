<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useParams, useRouter } from '@tanstack/vue-router';
import { ArrowLeftIcon, PlusIcon, Trash2Icon, PrinterIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { 
  getSuratJalanInternalById, 
  assignPackingListToSJ, 
  unassignPackingListFromSJ 
} from '@/api/surat-jalan-internal/surat-jalan-internal';
import { getPackingLists, getPackingListById } from '@/api/packing-list/packing-list';
import type { SuratJalanInternalDetailResponse } from '@/schemas/surat-jalan-internal/response';
import type { PackingListListItem } from '@/schemas/packing-list/response';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/formatter';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

const router = useRouter();
const params = useParams({ from: '/_authenticated/surat-jalan-internal/$id' });
const id = computed(() => Number(params.value.id));

const detail = ref<SuratJalanInternalDetailResponse | null>(null);
const isLoading = ref(true);

// Combined WO Shell details computed from attached packing lists
const combinedWOShells = ref<Array<{ no: number; deskripsi: string; color: string; qty: number; note: string }>>([]);
const isLoadingShells = ref(false);

// Assign modal states
const isAssignDialogOpen = ref(false);
const availablePackingLists = ref<PackingListListItem[]>([]);
const selectedPlToAssign = ref<number | null>(null);
const isAssigning = ref(false);

const fetchDetail = async () => {
  isLoading.value = true;
  try {
    const res = await getSuratJalanInternalById(id.value);
    detail.value = res;
    await fetchWOShellsForPackingLists(res.packing_lists);
  } catch (e) {
    toast.error("Gagal memuat rincian Surat Jalan Internal.");
  } finally {
    isLoading.value = false;
  }
};

const fetchWOShellsForPackingLists = async (pls: Array<{ id_packing_list: number; id_wo: number }>) => {
  if (!pls || pls.length === 0) {
    combinedWOShells.value = [];
    return;
  }
  isLoadingShells.value = true;
  try {
    const shellMap = new Map<string, { deskripsi: string; color: string; qty: number; note: string }>();
    
    for (const pl of pls) {
      try {
        const plDetail = await getPackingListById(pl.id_packing_list);
        if (plDetail && plDetail.items) {
          for (const item of plDetail.items) {
            for (const sz of item.sizes) {
              const key = `${sz.id_wo_shell_size}`;
              const existing = shellMap.get(key);
              if (existing) {
                existing.qty += sz.qty;
              } else {
                shellMap.set(key, {
                  deskripsi: `WO #${pl.id_wo} - ${plDetail.buyer} ${plDetail.model} (Size: ${sz.size})`,
                  color: item.color || 'Shell Material',
                  qty: sz.qty,
                  note: item.note || `Ref PL #${pl.id_packing_list}`
                });
              }
            }
          }
        }
      } catch (err) {
        console.error(`Gagal fetch detail PL #${pl.id_packing_list}`, err);
      }
    }

    const items: Array<{ no: number; deskripsi: string; color: string; qty: number; note: string }> = [];
    let idx = 1;
    shellMap.forEach((val) => {
      items.push({ no: idx++, ...val });
    });
    combinedWOShells.value = items;
  } catch (e) {
    console.error("Error computing WO shells:", e);
  } finally {
    isLoadingShells.value = false;
  }
};

const openAssignDialog = async () => {
  isAssignDialogOpen.value = true;
  selectedPlToAssign.value = null;
  try {
    const res = await getPackingLists({ limit: 100 });
    availablePackingLists.value = res.results.filter(pl => !pl.id_surat_jalan_internal);
  } catch (e) {
    toast.error("Gagal memuat daftar Packing List.");
  }
};

const handleAssign = async () => {
  if (!selectedPlToAssign.value) {
    toast.error("Pilih Packing List terlebih dahulu.");
    return;
  }
  isAssigning.value = true;
  try {
    await assignPackingListToSJ(id.value, { id_packing_list: selectedPlToAssign.value });
    toast.success("Packing List berhasil ditambahkan ke Surat Jalan.");
    isAssignDialogOpen.value = false;
    await fetchDetail();
  } catch (e: any) {
    toast.error(e?.response?.data?.message || "Gagal menambahkan Packing List.");
  } finally {
    isAssigning.value = false;
  }
};

const handleUnassign = async (idPL: number) => {
  if (!confirm(`Apakah Anda yakin ingin melepaskan Packing List #${idPL} dari Surat Jalan ini?`)) return;
  try {
    await unassignPackingListFromSJ(id.value, idPL);
    toast.success("Packing List berhasil dilepaskan.");
    await fetchDetail();
  } catch (e: any) {
    toast.error(e?.response?.data?.message || "Gagal melepaskan Packing List.");
  }
};

const handlePrint = () => {
  window.print();
};

onMounted(() => {
  fetchDetail();
});
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    <div class="flex items-center justify-between print:hidden">
      <div class="flex items-center gap-4">
        <Button variant="outline" size="icon" @click="router.navigate({ to: '/surat-jalan-internal' })">
          <ArrowLeftIcon class="w-4 h-4" />
        </Button>
        <div>
          <h2 class="text-2xl font-bold tracking-tight">Detail Surat Jalan Internal</h2>
          <p class="text-muted-foreground">Rincian pengiriman internal dan daftar WO Shell</p>
        </div>
      </div>
      <Button variant="outline" @click="handlePrint" class="flex gap-2 items-center">
        <PrinterIcon class="w-4 h-4" /> Cetak Surat Jalan
      </Button>
    </div>

    <div v-if="isLoading" class="py-12 text-center text-muted-foreground">
      Memuat rincian Surat Jalan Internal...
    </div>

    <template v-else-if="detail">
      <!-- Document Header Info Card -->
      <Card>
        <CardHeader>
          <CardTitle>Dokumen Surat Jalan Internal #{{ detail.id_surat_jalan_internal }}</CardTitle>
        </CardHeader>
        <CardContent class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span class="text-muted-foreground block">No. Dokumen:</span>
            <span class="font-bold text-base">{{ detail.no_dokumen || '—' }}</span>
          </div>
          <div>
            <span class="text-muted-foreground block">Tanggal Dibuat:</span>
            <span class="font-medium">{{ formatDate(detail.created_at) }}</span>
          </div>
          <div>
            <span class="text-muted-foreground block">Deskripsi:</span>
            <span class="font-medium">{{ detail.deskripsi || '—' }}</span>
          </div>
        </CardContent>
      </Card>

      <!-- Attached Packing Lists Card -->
      <Card class="print:hidden">
        <CardHeader class="flex flex-row items-center justify-between">
          <CardTitle>Packing List Terkait ({{ detail.packing_lists.length }})</CardTitle>
          <Button size="sm" @click="openAssignDialog" class="flex gap-2 items-center">
            <PlusIcon class="w-4 h-4" /> Attach Packing List
          </Button>
        </CardHeader>
        <CardContent>
          <div v-if="detail.packing_lists.length === 0" class="py-4 text-center text-muted-foreground">
            Belum ada Packing List yang dikaitkan dengan Surat Jalan ini.
          </div>
          <div v-else class="border rounded-md overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="bg-muted text-muted-foreground font-medium border-b">
                <tr>
                  <th class="p-3">ID PL</th>
                  <th class="p-3">ID WO</th>
                  <th class="p-3">Pcs per Box</th>
                  <th class="p-3">Total Reject</th>
                  <th class="p-3">Tanggal Dibuat</th>
                  <th class="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr v-for="pl in detail.packing_lists" :key="pl.id_packing_list" class="hover:bg-muted/30">
                  <td class="p-3 font-semibold">#{{ pl.id_packing_list }}</td>
                  <td class="p-3">#{{ pl.id_wo }}</td>
                  <td class="p-3">{{ pl.total_garment_per_box.toLocaleString('id-ID') }}</td>
                  <td class="p-3">{{ pl.total_reject.toLocaleString('id-ID') }}</td>
                  <td class="p-3">{{ formatDate(pl.created_at) }}</td>
                  <td class="p-3 text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      class="text-destructive hover:text-destructive"
                      @click="handleUnassign(pl.id_packing_list)"
                    >
                      <Trash2Icon class="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <!-- WO Shell Summary Table (No | Desc | QTY | Note) -->
      <Card>
        <CardHeader>
          <CardTitle>Rincian Barang (WO Shell Details)</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="isLoadingShells" class="py-6 text-center text-muted-foreground">
            Menghitung rincian barang WO Shell...
          </div>
          <div v-else-if="combinedWOShells.length === 0" class="py-6 text-center text-muted-foreground">
            Tidak ada rincian barang. Lampirkan Packing List untuk menampilkan detail WO Shell.
          </div>
          <div v-else class="border rounded-md overflow-x-auto">
            <table class="w-full text-sm text-left border-collapse">
              <thead class="bg-muted text-muted-foreground font-medium border-b">
                <tr>
                  <th class="p-3 w-12 text-center">No.</th>
                  <th class="p-3">Deskripsi (Model / Warna / Size)</th>
                  <th class="p-3 text-right w-28">QTY</th>
                  <th class="p-3">Note</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr v-for="item in combinedWOShells" :key="item.no" class="hover:bg-muted/30">
                  <td class="p-3 text-center font-medium">{{ item.no }}</td>
                  <td class="p-3">{{ item.deskripsi }}</td>
                  <td class="p-3 text-right font-semibold">{{ item.qty.toLocaleString('id-ID') }}</td>
                  <td class="p-3 text-muted-foreground">{{ item.note }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </template>

    <!-- Modal Attach Packing List -->
    <Dialog v-model:open="isAssignDialogOpen">
      <DialogContent class="max-w-xl">
        <DialogHeader>
          <DialogTitle>Lampirkan Packing List</DialogTitle>
        </DialogHeader>
        <div class="py-4">
          <p class="text-sm text-muted-foreground mb-4">Pilih Packing List yang belum memiliki Surat Jalan:</p>
          <div v-if="availablePackingLists.length === 0" class="text-center py-6 text-muted-foreground border rounded-md">
            Tidak ada Packing List unassigned yang tersedia.
          </div>
          <div v-else class="space-y-2 max-h-60 overflow-y-auto pr-1">
            <div 
              v-for="pl in availablePackingLists" 
              :key="pl.id_packing_list"
              class="flex items-center space-x-3 p-3 border rounded-md hover:bg-muted/50 cursor-pointer"
              @click="selectedPlToAssign = pl.id_packing_list"
            >
              <Checkbox :checked="selectedPlToAssign === pl.id_packing_list" />
              <div class="flex-1 text-sm grid grid-cols-2 gap-1">
                <div><span class="font-semibold">ID PL:</span> #{{ pl.id_packing_list }}</div>
                <div><span class="font-semibold">ID WO:</span> #{{ pl.id_wo }}</div>
                <div class="col-span-2 text-xs text-muted-foreground">{{ pl.buyer }} - {{ pl.model }}</div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isAssignDialogOpen = false" :disabled="isAssigning">Batal</Button>
          <Button @click="handleAssign" :disabled="isAssigning || !selectedPlToAssign">
            {{ isAssigning ? 'Menyimpan...' : 'Tambahkan' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
