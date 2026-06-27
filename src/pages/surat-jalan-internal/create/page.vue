<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useSearch } from '@tanstack/vue-router';
import { ArrowLeftIcon, SaveIcon, PlusIcon, Trash2Icon, PackageIcon, LayersIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { createSuratJalanInternal } from '@/api/surat-jalan-internal/surat-jalan-internal';
import { getWorkOrderById } from '@/api/work-orders/work-orders';
import { getPackingLists, getPackingListById } from '@/api/packing-list/packing-list';
import type { PackingListListItem } from '@/schemas/packing-list/response';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const router = useRouter();
const search = useSearch({ strict: false }) as any;

const selectedPlId = ref<number | null>(search.value?.id_packing_list ? Number(search.value.id_packing_list) : null);
const selectedWoId = ref<number | null>(null);
const isSubmitting = ref(false);

const packingLists = ref<PackingListListItem[]>([]);
const isLoadingPls = ref(false);
const isLoadingPlDetail = ref(false);

interface TableItemRow {
  no: number;
  deskripsi: string;
  qty: number;
  note: string;
}

const tableItems = ref<TableItemRow[]>([]);

const addRow = () => {
  tableItems.value.push({
    no: tableItems.value.length + 1,
    deskripsi: '',
    qty: 0,
    note: ''
  });
};

const removeRow = (index: number) => {
  tableItems.value.splice(index, 1);
  tableItems.value.forEach((item, idx) => {
    item.no = idx + 1;
  });
};

const fetchPackingLists = async () => {
  isLoadingPls.value = true;
  try {
    const res = await getPackingLists({ limit: 500 });
    packingLists.value = res.results.filter(pl => !pl.id_surat_jalan_internal || pl.id_packing_list === selectedPlId.value);
    if (selectedPlId.value) {
      await onPackingListChange(selectedPlId.value);
    }
  } catch (e) {
    console.error("Gagal memuat daftar Packing List:", e);
  } finally {
    isLoadingPls.value = false;
  }
};

const onPackingListChange = async (plId: number) => {
  selectedPlId.value = plId;
  tableItems.value = [];
  
  isLoadingPlDetail.value = true;
  try {
    const plFull = await getPackingListById(plId);
    selectedWoId.value = plFull.id_wo;
    
    const woDetail = await getWorkOrderById(plFull.id_wo);
    const styleName = woDetail?.po_client_item_style ? `Style ${woDetail.po_client_item_style} ` : '';
    const modelName = woDetail?.model || plFull.model || '';

    const items: TableItemRow[] = [];
    let idx = 1;

    if (plFull.items && plFull.items.length > 0) {
      for (const item of plFull.items) {
        const sizeList = (item.sizes && item.sizes.length > 0)
          ? item.sizes.map((s: any) => s.size).join('-')
          : '';
        
        let desc = `${styleName}Model ${modelName} Warna ${item.color || ''}`;
        if (sizeList) {
          desc += ` Size ${sizeList}`;
        }

        items.push({
          no: idx++,
          deskripsi: desc,
          qty: 0,
          note: item.note || ''
        });
      }
    } else {
      items.push({
        no: 1,
        deskripsi: `${styleName}Model ${modelName}`,
        qty: 0,
        note: ''
      });
    }

    tableItems.value = items;
  } catch (e) {
    console.error("Gagal memuat detail Packing List / Work Order:", e);
    toast.error("Gagal memuat rincian dari Packing List terpilih.");
  } finally {
    isLoadingPlDetail.value = false;
  }
};

const handleSubmit = async () => {
    if (!selectedPlId.value || !selectedWoId.value) {
        toast.error('Packing List wajib dipilih.');
        return;
    }

    isSubmitting.value = true;
    try {
        await createSuratJalanInternal({
            id_wo: selectedWoId.value,
            no_dokumen: '',
            items: tableItems.value,
            id_packing_lists: [selectedPlId.value]
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
  <div class="space-y-6 w-full max-w-[1400px] mx-auto p-2 md:p-6 animate-fade-in">
    <!-- Header Navigation Section -->
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
          <p class="text-sm text-slate-500 mt-0.5">Pilih Packing List terdaftar untuk meng-generate dokumen surat jalan secara presisi</p>
        </div>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" @click="router.navigate({ to: '/surat-jalan-internal' })" :disabled="isSubmitting">
          Batal
        </Button>
        <Button @click="handleSubmit" :disabled="isSubmitting || !selectedPlId" class="flex gap-2 items-center">
          <SaveIcon class="w-4 h-4" /> {{ isSubmitting ? 'Menyimpan...' : 'Simpan Surat Jalan' }}
        </Button>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 gap-6">
      <!-- Selector Card -->
      <Card class="rounded-2xl border-slate-200 shadow-xs bg-white">
        <CardHeader class="pb-3 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <LayersIcon class="w-5 h-5 text-emerald-600" />
            <CardTitle class="text-base font-semibold text-slate-900">Sumber Dokumen</CardTitle>
          </div>
          <CardDescription>Pilih dokumen Packing List acuan untuk rincian pengiriman</CardDescription>
        </CardHeader>
        <CardContent class="pt-4">
          <div class="max-w-xl space-y-2">
            <label class="text-sm font-semibold text-slate-700">Pilih Packing List Acuan <span class="text-rose-500">*</span></label>
            <div class="relative">
              <select
                :value="selectedPlId || ''"
                @change="(e: any) => onPackingListChange(Number(e.target.value))"
                :disabled="isLoadingPls || isSubmitting"
                class="w-full h-11 px-4 py-2 bg-white border border-slate-300 rounded-xl shadow-xs text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 appearance-none cursor-pointer"
              >
                <option value="" disabled>-- Pilih Packing List --</option>
                <option v-for="pl in packingLists" :key="pl.id_packing_list" :value="pl.id_packing_list">
                  Packing List #{{ pl.id_packing_list }} (WO #{{ pl.id_wo }} - {{ pl.buyer }} {{ pl.model }})
                </option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg class="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Items Table Card -->
      <Card class="rounded-2xl border-slate-200 shadow-xs bg-white overflow-hidden">
        <CardHeader class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50 py-4 px-6">
          <div>
            <CardTitle class="text-base font-semibold text-slate-900">Rincian Barang Pengiriman</CardTitle>
            <CardDescription class="text-xs">Tabel item rincian barang (No | Desc | Quantity | Note)</CardDescription>
          </div>
          <Button size="sm" variant="outline" @click="addRow" class="rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-50 flex gap-1.5 items-center self-start sm:self-auto shadow-xs font-medium" :disabled="!selectedPlId">
            <PlusIcon class="w-4 h-4" /> Tambah Baris
          </Button>
        </CardHeader>
        
        <CardContent class="p-0">
          <div v-if="isLoadingPlDetail" class="py-16 text-center text-slate-500">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mb-2"></div>
            <p class="text-sm font-medium">Memuat rincian barang dari Packing List...</p>
          </div>
          
          <div v-else-if="!selectedPlId" class="py-16 text-center text-slate-400 bg-slate-50/30">
            <PackageIcon class="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p class="text-base font-semibold text-slate-700">Packing List Belum Dipilih</p>
            <p class="text-sm text-slate-500 mt-1">Silakan pilih Packing List pada menu di atas untuk memuat rincian barang otomatis.</p>
          </div>
          
          <div v-else-if="tableItems.length === 0" class="py-16 text-center text-slate-400">
            <PackageIcon class="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p class="text-base font-semibold text-slate-700">Belum Ada Item Barang</p>
            <p class="text-sm text-slate-500 mt-1">Klik tombol "Tambah Baris" di atas untuk menambahkan barang pengiriman.</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm text-left border-collapse">
              <thead class="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th class="py-3.5 px-4 w-14 text-center">No.</th>
                  <th class="py-3.5 px-4 min-w-[400px]">Desc (Deskripsi Barang)</th>
                  <th class="py-3.5 px-4 w-44">Quantity</th>
                  <th class="py-3.5 px-4 w-72">Note</th>
                  <th class="py-3.5 px-4 w-16 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 bg-white">
                <tr v-for="(item, idx) in tableItems" :key="idx" class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3 px-4 text-center font-bold text-slate-500">{{ idx + 1 }}</td>
                  <td class="p-2">
                    <Input 
                      v-model="item.deskripsi" 
                      placeholder="Style [PO Item] Model [WO] Warna [Packing List] Size [Size]" 
                      class="rounded-lg border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 font-medium text-slate-800"
                    />
                  </td>
                  <td class="p-2">
                    <Input 
                      type="number" 
                      v-model.number="item.qty" 
                      min="0" 
                      placeholder="0" 
                      class="rounded-lg border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 text-right font-bold text-slate-900 text-base" 
                    />
                  </td>
                  <td class="p-2">
                    <Input 
                      v-model="item.note" 
                      placeholder="Contoh: Tanpa Reject" 
                      class="rounded-lg border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 text-slate-700"
                    />
                  </td>
                  <td class="p-2 text-center">
                    <Button variant="ghost" size="icon" class="h-9 w-9 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50" @click="removeRow(idx)">
                      <Trash2Icon class="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex justify-end gap-3 p-6 pt-4 border-t border-slate-100 bg-slate-50/30">
            <Button variant="outline" @click="router.navigate({ to: '/surat-jalan-internal' })" :disabled="isSubmitting">
              Batal
            </Button>
            <Button @click="handleSubmit" :disabled="isSubmitting || !selectedPlId" class="flex gap-2 items-center">
              <SaveIcon class="w-4 h-4" /> {{ isSubmitting ? 'Menyimpan...' : 'Simpan Surat Jalan' }}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
