<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue';
import { useRouter, useSearch } from '@tanstack/vue-router';
import { PlusIcon, Trash2Icon, ArrowLeftIcon, SaveIcon, ChevronDownIcon, Layers2Icon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { getPOClients, type POClientListItem } from '@/api/po-clients/po-clients';
import { getWorkOrders, getWorkOrderById, type WorkOrderListItem, type WorkOrderDetailResponse, type WorkOrderShell } from '@/api/work-orders/work-orders';
import { createMarkerPlan } from '@/api/marker-plan/marker-plan';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const router = useRouter();
const search = useSearch({ strict: false }) as any;

// Dropdowns lists
const poList = ref<POClientListItem[]>([]);
const woList = ref<WorkOrderListItem[]>([]);
const isLoadingPO = ref(false);
const isLoadingWO = ref(false);
const isLoadingWoDetail = ref(false);

const selectedPoId = ref<number | ''>('');
const selectedWoId = ref<number | ''>('');
const selectedShellId = ref<number | ''>('');

const woDetail = ref<WorkOrderDetailResponse | null>(null);
const selectedShell = ref<WorkOrderShell | null>(null);

// Header state
const noDokumen = ref('');
const tanggalEfektif = ref('');

// Dynamic Components and Ratios State
interface SizeInput {
  id_wo_shell_size: number;
  size: string;
  qty_plan: string;
}

interface RatioInput {
  id_wo_shell: number;
  cons: string;
  plan_spreading_gelaran: string;
  panjang_marker: string;
  efficiency_marker: string;
  allowance: string;
  cons_buyer: string;
  roll_qty: string;
  sambungan_roll: string;
  sizes: SizeInput[];
}

interface ComponentInput {
  nama_komponen: string;
  ratios: RatioInput[];
}

const components = ref<ComponentInput[]>([]);
const isSaving = ref(false);

// Load PO & WO initially
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
    console.error('Failed to load PO and WO data:', e);
    toast.error('Gagal memuat data PO dan Work Order.');
  } finally {
    isLoadingPO.value = false;
    isLoadingWO.value = false;
  }
};

// Cascading drop-down helpers
const selectedPo = computed(() =>
  poList.value.find((p) => p.id_po_client === selectedPoId.value) ?? null
);

const filteredWoList = computed(() => {
  if (!selectedPo.value) return [];
  return woList.value.filter((wo) => wo.po_number === selectedPo.value?.po_number);
});

// Watch PO reset
watch(selectedPoId, () => {
  selectedWoId.value = '';
  selectedShellId.value = '';
  woDetail.value = null;
  selectedShell.value = null;
  components.value = [];
});

// Watch WO loads details
watch(selectedWoId, async (newWoId) => {
  selectedShellId.value = '';
  selectedShell.value = null;
  woDetail.value = null;
  components.value = [];

  if (newWoId) {
    isLoadingWoDetail.value = true;
    try {
      woDetail.value = await getWorkOrderById(newWoId);
    } catch (e) {
      console.error('Failed to load Work Order details:', e);
      toast.error('Gagal memuat rincian Work Order.');
    } finally {
      isLoadingWoDetail.value = false;
    }
  }
});

// Watch Shell choice
watch(selectedShellId, (newShellId) => {
  selectedShell.value = null;
  components.value = [];

  if (newShellId && woDetail.value?.shells) {
    const shell = woDetail.value.shells.find((s) => s.id_wo_shell === newShellId);
    if (shell) {
      selectedShell.value = shell;
      // Initialize with one default component (Fabric Utama) and one empty ratio row
      initDefaultComponent(shell);
    }
  }
});

const initDefaultComponent = (shell: WorkOrderShell) => {
  components.value = [
    {
      nama_komponen: 'Fabric Utama',
      ratios: [
        createEmptyRatio(shell)
      ]
    }
  ];
};

const createEmptyRatio = (shell: WorkOrderShell): RatioInput => {
  return {
    id_wo_shell: shell.id_wo_shell,
    cons: '',
    plan_spreading_gelaran: '',
    panjang_marker: '',
    efficiency_marker: '',
    allowance: '',
    cons_buyer: '',
    roll_qty: '',
    sambungan_roll: '',
    sizes: (shell.sizes ?? []).map((sz) => ({
      id_wo_shell_size: sz.id_wo_shell_size,
      size: sz.size,
      qty_plan: ''
    }))
  };
};

const addComponent = () => {
  if (!selectedShell.value) return;
  components.value.push({
    nama_komponen: '',
    ratios: [
      createEmptyRatio(selectedShell.value)
    ]
  });
};

const removeComponent = (compIdx: number) => {
  components.value.splice(compIdx, 1);
};

const addRatioRow = (compIdx: number) => {
  if (!selectedShell.value) return;
  const comp = components.value[compIdx];
  if (comp) {
    comp.ratios.push(createEmptyRatio(selectedShell.value));
  }
};

const removeRatioRow = (compIdx: number, ratioIdx: number) => {
  const comp = components.value[compIdx];
  if (comp) {
    if (comp.ratios.length > 1) {
      comp.ratios.splice(ratioIdx, 1);
    } else {
      toast.error('Komponen harus memiliki minimal 1 baris ratio.');
    }
  }
};

// Form Save Action
const handleSubmit = async () => {
  if (!noDokumen.value) {
    toast.error('Harap isi Nomor Dokumen.');
    return;
  }
  if (!tanggalEfektif.value) {
    toast.error('Harap isi Tanggal Efektif.');
    return;
  }
  if (!selectedShellId.value) {
    toast.error('Harap pilih Fabric/Shell Rujukan.');
    return;
  }
  if (components.value.length === 0) {
    toast.error('Minimal harus terdapat satu komponen.');
    return;
  }

  // Validate components & ratio contents
  let cIdx = 0;
  for (const comp of components.value) {
    if (!comp.nama_komponen.trim()) {
      toast.error(`Harap isi nama komponen pada Komponen #${cIdx + 1}`);
      return;
    }
    let rIdx = 0;
    for (const rat of comp.ratios) {
      // Check mandatory fields
      if (
        rat.cons === '' || 
        rat.plan_spreading_gelaran === '' || 
        rat.panjang_marker === '' || 
        rat.efficiency_marker === '' || 
        rat.allowance === '' || 
        rat.roll_qty === '' || 
        rat.sambungan_roll === ''
      ) {
        toast.error(`Harap lengkapi semua field numerik di Komponen "${comp.nama_komponen}" baris #${rIdx + 1}`);
        return;
      }

      // Check if size quantity has at least one filled value
      const totalQty = rat.sizes.reduce((acc, curr) => acc + (parseInt(curr.qty_plan) || 0), 0);
      if (totalQty <= 0) {
        toast.error(`Harap isi QTY Plan ukuran minimal satu di Komponen "${comp.nama_komponen}" baris #${rIdx + 1}`);
        return;
      }
      rIdx++;
    }
    cIdx++;
  }

  isSaving.value = true;
  try {
    const payload = {
      no_dokumen: noDokumen.value,
      tanggal_efektif: tanggalEfektif.value,
      id_wo_shell: Number(selectedShellId.value),
      components: components.value.map((comp) => ({
        nama_komponen: comp.nama_komponen,
        ratios: comp.ratios.map((rat) => ({
          id_wo_shell: Number(selectedShellId.value),
          cons: parseFloat(rat.cons) || 0,
          plan_spreading_gelaran: parseFloat(rat.plan_spreading_gelaran) || 0,
          panjang_marker: parseFloat(rat.panjang_marker) || 0,
          efficiency_marker: parseFloat(rat.efficiency_marker) || 0,
          allowance: parseFloat(rat.allowance) || 0,
          cons_buyer: rat.cons_buyer !== '' ? parseFloat(rat.cons_buyer) : null,
          roll_qty: parseInt(rat.roll_qty) || 0,
          sambungan_roll: parseInt(rat.sambungan_roll) || 0,
          sizes: rat.sizes.map((sz) => ({
            id_wo_shell_size: sz.id_wo_shell_size,
            qty_plan: parseInt(sz.qty_plan) || 0
          }))
        }))
      }))
    };

    const res = await createMarkerPlan(payload);
    toast.success('Marker Plan berhasil disimpan!');
    
    // Redirect to detail page
    if (res && res.id_marker_plan) {
      router.navigate({ to: '/marker-plan/$id', params: { id: String(res.id_marker_plan) } });
    } else {
      router.navigate({ to: '/work-order' });
    }
  } catch (error: any) {
    const msg = error?.response?.data?.message ?? 'Gagal membuat Marker Plan.';
    toast.error(msg);
  } finally {
    isSaving.value = false;
  }
};

onMounted(async () => {
  tanggalEfektif.value = new Date().toISOString().split('T')[0] ?? '';
  await fetchInitialData();

  if (search.value?.poNumber) {
    const po = poList.value.find(p => p.po_number === search.value.poNumber);
    if (po) {
      selectedPoId.value = po.id_po_client;
      
      // Wait for WO list to load and select
      setTimeout(() => {
        if (search.value?.woId) {
          selectedWoId.value = Number(search.value.woId);
          
          // Wait for shell options to load and select
          setTimeout(() => {
            if (search.value?.shellId) {
              selectedShellId.value = Number(search.value.shellId);
            }
          }, 450);
        }
      }, 250);
    }
  }
});
</script>

<template>
  <div class="container mx-auto py-8 space-y-8 max-w-7xl">
    <!-- Header -->
    <div class="flex items-center gap-4 border-b pb-5 border-neutral-100 justify-between">
      <div class="flex items-center gap-3">
        <div class="bg-neutral-50 border border-neutral-200 p-2.5 rounded-xl shadow-sm animate-fade-in">
          <Layers2Icon class="w-6 h-6 text-neutral-700" />
        </div>
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-neutral-900">Tambah Marker Plan</h1>
          <p class="text-[13px] text-neutral-500 mt-1">
            Buat rencana pemotongan (marker plan) yang mengorganisasikan komponen kain, ratio marker, spreading gelaran, dan size breakdown.
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
          Informasi Utama Dokumen
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="space-y-1.5">
            <Label class="text-xs font-semibold text-neutral-700">Nomor Dokumen <span class="text-red-500">*</span></Label>
            <Input v-model="noDokumen" type="text" placeholder="Masukkan nomor dokumen marker plan" class="h-9 text-xs border-neutral-200" required />
          </div>

          <div class="space-y-1.5">
            <Label class="text-xs font-semibold text-neutral-700">Tanggal Efektif <span class="text-red-500">*</span></Label>
            <Input v-model="tanggalEfektif" type="date" class="h-9 text-xs border-neutral-200" required />
          </div>
        </div>

        <Separator class="bg-neutral-100" />

        <!-- Cascading WO selectors -->
        <h2 class="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
          <span class="inline-block w-1.5 h-4 bg-neutral-900 rounded-full"></span>
          Rujukan Work Order & Shell
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="space-y-1.5">
            <Label class="text-xs font-semibold text-neutral-700">Purchase Order <span class="text-red-500">*</span></Label>
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
            <Label class="text-xs font-semibold text-neutral-700">Work Order <span class="text-red-500">*</span></Label>
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

          <div class="space-y-1.5">
            <Label class="text-xs font-semibold text-neutral-700">Pilih Fabric / Shell Rujukan <span class="text-red-500">*</span></Label>
            <div class="relative">
              <select
                v-model="selectedShellId"
                :disabled="!selectedWoId || isLoadingWoDetail"
                class="w-full h-9 rounded-md border border-neutral-200 bg-white pl-3 pr-9 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 appearance-none cursor-pointer"
              >
                <option value="" disabled>Pilih Fabric / Shell</option>
                <option v-for="shell in woDetail?.shells" :key="shell.id_wo_shell" :value="shell.id_wo_shell">
                  {{ shell.fabric }} ({{ shell.color }})
                </option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                <ChevronDownIcon class="w-4 h-4 text-neutral-400" />
              </div>
            </div>
          </div>
        </div>

        <!-- DYNAMIC COMPONENTS AND RATIOS SECTION -->
        <div v-if="selectedShell" class="space-y-6 pt-4">
          <div class="flex items-center justify-between border-b pb-3 border-neutral-100">
            <h2 class="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
              <span class="inline-block w-1.5 h-4 bg-emerald-600 rounded-full"></span>
              Pengaturan Komponen & Ratio (Kain: {{ selectedShell.fabric }}, Warna: {{ selectedShell.color }})
            </h2>
            <Button type="button" @click="addComponent" size="sm" variant="outline" class="h-8 border-dashed border-neutral-300 text-neutral-700 hover:bg-neutral-50">
              <PlusIcon class="w-3.5 h-3.5 mr-1" /> Tambah Komponen
            </Button>
          </div>

          <!-- Component Cards Loop -->
          <div v-for="(comp, compIdx) in components" :key="compIdx" class="bg-neutral-50/45 border border-neutral-200 rounded-xl p-5 space-y-4 shadow-sm relative animate-fade-in">
            <!-- Delete Component btn -->
            <button
              v-if="components.length > 1"
              type="button"
              @click="removeComponent(compIdx)"
              class="absolute top-4 right-4 text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
              title="Hapus Komponen"
            >
              <Trash2Icon class="w-4 h-4" />
            </button>

            <!-- Component Header inputs -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
              <div class="space-y-1.5">
                <Label class="text-xs font-semibold text-neutral-700">Nama Komponen <span class="text-red-500">*</span></Label>
                <Input v-model="comp.nama_komponen" type="text" placeholder="Contoh: Fabric Utama, Interlining, Kantong" class="h-9 text-xs bg-white border-neutral-200" required />
              </div>
            </div>

            <!-- Ratio Table inside Component -->
            <div class="space-y-2">
              <Label class="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Ratio Marker & Spreading Plan</Label>
              <div class="overflow-x-auto border border-neutral-200 rounded-lg shadow-inner bg-white">
                <table class="w-full text-left border-collapse text-xs min-w-[950px]">
                  <thead class="bg-neutral-50 border-b border-neutral-200 text-[10px] uppercase font-bold text-neutral-500">
                    <tr>
                      <th class="px-3 py-2.5 w-[7%]">Cons (yd)</th>
                      <th class="px-3 py-2.5 w-[8%]">Spreading Gelaran</th>
                      <th class="px-3 py-2.5 w-[7%]">Pjg Marker (yd)</th>
                      <th class="px-3 py-2.5 w-[7%]">Efficiency (%)</th>
                      <th class="px-3 py-2.5 w-[7%]">Allowance (%)</th>
                      <th class="px-3 py-2.5 w-[7%]">Cons Buyer (yd)</th>
                      <th class="px-3 py-2.5 w-[6%]">Roll Qty</th>
                      <th class="px-3 py-2.5 w-[6%]">Sambungan</th>
                      <!-- Dynamic size headers -->
                      <th v-for="sz in selectedShell.sizes" :key="sz.id_wo_shell_size" class="px-3 py-2.5 text-center w-[6%] bg-neutral-100/50">
                        Sz {{ sz.size }}
                      </th>
                      <th class="px-3 py-2.5 text-center w-[5%]">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-neutral-150 text-neutral-800">
                    <tr v-for="(ratio, ratioIdx) in comp.ratios" :key="ratioIdx" class="hover:bg-neutral-50/30 transition-colors">
                      <!-- Cons -->
                      <td class="p-2">
                        <Input v-model="ratio.cons" type="number" min="0" step="0.001" class="h-8 text-xs border-neutral-200 font-mono text-right" required />
                      </td>
                      <!-- Spreading -->
                      <td class="p-2">
                        <Input v-model="ratio.plan_spreading_gelaran" type="number" min="0" step="0.01" class="h-8 text-xs border-neutral-200 font-mono text-right" required />
                      </td>
                      <!-- Pjg Marker -->
                      <td class="p-2">
                        <Input v-model="ratio.panjang_marker" type="number" min="0" step="0.001" class="h-8 text-xs border-neutral-200 font-mono text-right" required />
                      </td>
                      <!-- Efficiency -->
                      <td class="p-2">
                        <Input v-model="ratio.efficiency_marker" type="number" min="0" max="100" step="0.01" class="h-8 text-xs border-neutral-200 font-mono text-right" required />
                      </td>
                      <!-- Allowance -->
                      <td class="p-2">
                        <Input v-model="ratio.allowance" type="number" min="0" step="0.01" class="h-8 text-xs border-neutral-200 font-mono text-right" required />
                      </td>
                      <!-- Cons Buyer -->
                      <td class="p-2">
                        <Input v-model="ratio.cons_buyer" type="number" min="0" step="0.001" placeholder="Optional" class="h-8 text-xs border-neutral-200 font-mono text-right" />
                      </td>
                      <!-- Roll Qty -->
                      <td class="p-2">
                        <Input v-model="ratio.roll_qty" type="number" min="0" step="1" class="h-8 text-xs border-neutral-200 font-mono text-right" required />
                      </td>
                      <!-- Sambungan -->
                      <td class="p-2">
                        <Input v-model="ratio.sambungan_roll" type="number" min="0" step="1" class="h-8 text-xs border-neutral-200 font-mono text-right" required />
                      </td>
                      
                      <!-- Dynamic size inputs -->
                      <td v-for="szIn in ratio.sizes" :key="szIn.id_wo_shell_size" class="p-2 bg-neutral-50/20">
                        <Input v-model="szIn.qty_plan" type="number" min="0" step="1" class="h-8 text-xs border-neutral-200 font-mono text-center bg-white" required />
                      </td>

                      <!-- Delete Row button -->
                      <td class="p-2 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          @click="removeRatioRow(compIdx, ratioIdx)"
                          class="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md"
                          :disabled="comp.ratios.length <= 1"
                        >
                          <Trash2Icon class="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Add Row Button -->
            <div class="flex justify-start pt-1">
              <Button type="button" @click="addRatioRow(compIdx)" size="sm" variant="outline" class="h-8 border-neutral-200 text-neutral-600 hover:bg-white shadow-xs">
                <PlusIcon class="w-3.5 h-3.5 mr-1" /> Tambah Baris Ratio
              </Button>
            </div>
          </div>
        </div>

        <!-- Form Submission Button -->
        <div class="flex justify-end pt-4 border-t border-neutral-100 gap-3">
          <Button
            type="button"
            variant="outline"
            @click="router.history.back()"
            :disabled="isSaving"
            class="border-neutral-200 text-neutral-600"
          >
            Batal
          </Button>
          <Button
            type="submit"
            :disabled="isSaving || !selectedShellId"
            class="bg-neutral-900 hover:bg-neutral-800 text-white font-medium transition-all shadow-sm"
          >
            <Spinner v-if="isSaving" class="w-4 h-4 mr-2" />
            <SaveIcon v-else class="w-4 h-4 mr-2" />
            {{ isSaving ? 'Menyimpan...' : 'Simpan Marker Plan' }}
          </Button>
        </div>
      </form>
    </Card>
  </div>
</template>
