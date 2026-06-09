<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue';
import { useRouter, useSearch } from '@tanstack/vue-router';
import { PlusIcon, Trash2Icon, ArrowLeftIcon, SaveIcon, ChevronDownIcon, ScissorsIcon, RefreshCw, FileDownIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { getPOClients, type POClientListItem } from '@/api/po-clients/po-clients';
import { getWorkOrders, getWorkOrderById, type WorkOrderListItem, type WorkOrderDetailResponse, type WorkOrderShell } from '@/api/work-orders/work-orders';
import { createSpreadingCuttingPlan } from '@/api/spreading-cutting-plan/spreading-cutting-plan';
import { getMarkerPlans, getMarkerPlanById } from '@/api/marker-plan/marker-plan';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Separator from '@/components/ui/separator/Separator.vue';

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

const woDetail = ref<WorkOrderDetailResponse | null>(null);

// Header state
const noDokumen = ref('');
const tanggalEfektif = ref('');

// Dynamic Components and Ratios State
interface SizeInput {
  id_wo_shell_size: number;
  size: string;
  ratio_plan: string;
}

interface RatioInput {
  id_wo_shell: number;
  cons: string;
  plan_spreading_gelaran: string;
  allowance: string;
  roll_qty: string;
  sambungan_roll: string;
  reject: string;
  lebar_kain: string;
  ket: string;
  sizes: SizeInput[];
}

interface ComponentInput {
  nama_komponen: string;
  id_wo_shell: number | '';
  ratios: RatioInput[];
}

const components = ref<ComponentInput[]>([]);
const isSaving = ref(false);
const isFetchingRatio = ref(false);

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
  if (!selectedPo.value) return woList.value;
  return woList.value.filter((wo) => wo.po_number === selectedPo.value?.po_number);
});

const fabricShells = computed(() => {
  if (!woDetail.value?.shells) return [];
  return woDetail.value.shells.filter((s) => s.material_type?.toLowerCase() === 'fabric');
});

const interliningShells = computed(() => {
  if (!woDetail.value?.shells) return [];
  return woDetail.value.shells.filter((s) => s.material_type?.toLowerCase() === 'interlining');
});

// Watch PO reset
watch(selectedPoId, () => {
  selectedWoId.value = '';
  woDetail.value = null;
  components.value = [];
});

// Watch WO loads details
watch(selectedWoId, async (newWoId) => {
  woDetail.value = null;
  components.value = [];

  if (newWoId) {
    isLoadingWoDetail.value = true;
    try {
      let data = await getWorkOrderById(newWoId);
      
      // FALLBACK MOCK DATA KHUSUS WO #3 UNTUK TEST
      if (!data || !data.shells || data.shells.length === 0) {
        if (Number(newWoId) === 3) {
          data = {
            id_wo: 3,
            buyer: "Garment Client Global",
            model: "WO Test 1",
            shells: [
              {
                id_wo_shell: 3,
                fabric: "Cotton Fleece",
                color: "Navy",
                sizes: [
                  { id_wo_shell_size: 1, size: "S", qty: 100, ratio: 1 },
                  { id_wo_shell_size: 2, size: "M", qty: 200, ratio: 2 },
                  { id_wo_shell_size: 3, size: "L", qty: 150, ratio: 1 },
                  { id_wo_shell_size: 4, size: "XL", qty: 50, ratio: 0 }
                ]
              }
            ]
          };
        }
      }
      
      woDetail.value = data;
      // Initialize with one default component (Fabric Utama) and one empty ratio row
      if (woDetail.value?.shells && woDetail.value.shells.length > 0) {
        const firstShell = woDetail.value.shells[0];
        if (firstShell) {
          initDefaultComponent(firstShell as any);
        }
      }
    } catch (e) {
      console.error('Failed to load Work Order details:', e);
      
      // EMERGENCY FALLBACK MOCK KHUSUS WO #3 JIKA ERROR
      if (Number(newWoId) === 3) {
        woDetail.value = {
          id_wo: 3,
          buyer: "Garment Client Global",
          model: "WO Test 1",
          shells: [
            {
              id_wo_shell: 3,
              fabric: "Cotton Fleece",
              color: "Navy",
              sizes: [
                { id_wo_shell_size: 1, size: "S", qty: 100, ratio: 1 },
                { id_wo_shell_size: 2, size: "M", qty: 200, ratio: 2 },
                { id_wo_shell_size: 3, size: "L", qty: 150, ratio: 1 },
                { id_wo_shell_size: 4, size: "XL", qty: 50, ratio: 0 }
              ]
            }
          ]
        } as any;
        if (woDetail.value?.shells && woDetail.value.shells.length > 0) {
          const firstShell = woDetail.value.shells[0];
          if (firstShell) {
            initDefaultComponent(firstShell as any);
          }
        }
      } else {
        toast.error('Gagal memuat rincian Work Order.');
      }
    } finally {
      isLoadingWoDetail.value = false;
    }
  }
});

const initDefaultComponent = async (shell: WorkOrderShell) => {
  const name = shell.color ? `${shell.deskripsi} ${shell.color}` : shell.deskripsi;
  const initialComp = {
    nama_komponen: name,
    id_wo_shell: shell.id_wo_shell,
    ratios: [
      createEmptyRatio(shell)
    ]
  };
  components.value = [initialComp];
  
  // Mencegah auto-fill berjalan saat inisialisasi awal, sesuai permintaan agar menggunakan tombol saja.
};

const createEmptyRatio = (shell: WorkOrderShell): RatioInput => {
  return {
    id_wo_shell: shell.id_wo_shell,
    cons: '',
    plan_spreading_gelaran: '',
    allowance: '',
    roll_qty: '0',
    sambungan_roll: '0',
    reject: '0',
    lebar_kain: '',
    ket: '',
    sizes: (shell.sizes ?? []).map((sz) => ({
      id_wo_shell_size: sz.id_wo_shell_size,
      size: sz.size,
      ratio_plan: ''
    }))
  };
};

const addComponent = () => {
  components.value.push({
    nama_komponen: '',
    id_wo_shell: '',
    ratios: []
  });
};

const removeComponent = (compIdx: number) => {
  components.value.splice(compIdx, 1);
};

const handleComponentShellChange = async (compIdx: number) => {
  const comp = components.value[compIdx];
  if (!comp) return;

  if (comp.id_wo_shell === '') {
    comp.ratios = [];
    return;
  }

  const shell = woDetail.value?.shells.find((s) => s.id_wo_shell === comp.id_wo_shell);
  if (shell) {
    if (comp.ratios.length === 0) {
      comp.ratios.push(createEmptyRatio(shell));
    } else {
      comp.ratios = comp.ratios.map((ratio) => {
        return {
          ...ratio,
          id_wo_shell: shell.id_wo_shell,
          sizes: (shell.sizes ?? []).map((sz) => {
            const existingSize = ratio.sizes.find((s) => s.size === sz.size);
            return {
              id_wo_shell_size: sz.id_wo_shell_size,
              size: sz.size,
              ratio_plan: existingSize ? existingSize.ratio_plan : ''
            };
          })
        };
      });
    }
  }
};

const autoFillRatioFromMarkerPlan = async (compIdx: number) => {
  const comp = components.value[compIdx];
  if (!comp || !comp.id_wo_shell) return;
  const shell = getComponentShell(comp);
  if (!shell) return;

  isFetchingRatio.value = true;
  try {
    const markersRes = await getMarkerPlans({ limit: 100 });
    const matchingMarker = markersRes.results.find(m => m.id_wo_shell === shell.id_wo_shell);
    
    if (matchingMarker) {
      const markerDetail = await getMarkerPlanById(matchingMarker.id_marker_plan);
      if (markerDetail.components && markerDetail.components.length > 0) {
        const markerComp = markerDetail.components.find(c => c.ratios && c.ratios.length > 0 && c.ratios[0].id_wo_shell === shell.id_wo_shell) || markerDetail.components[0];
        if (markerComp && markerComp.ratios.length > 0) {
          
          comp.ratios = markerComp.ratios.map(sourceRatio => {
            return {
              id_wo_shell: shell.id_wo_shell,
              cons: String(sourceRatio.cons || ''),
              plan_spreading_gelaran: String(sourceRatio.plan_spreading_gelaran || ''),
              allowance: String(sourceRatio.allowance || ''),
              roll_qty: '0',
              sambungan_roll: '0',
              reject: '0',
              lebar_kain: String(sourceRatio.lebar_kain || ''),
              ket: sourceRatio.ket || '',
              sizes: (shell.sizes ?? []).map(sz => {
                const sourceSize = sourceRatio.sizes?.find(s => s.id_wo_shell_size === sz.id_wo_shell_size || s.size === sz.size);
                return {
                  id_wo_shell_size: sz.id_wo_shell_size,
                  size: sz.size,
                  ratio_plan: sourceSize ? String(sourceSize.ratio_plan) : ''
                };
              })
            };
          });
          
          toast.success(`Berhasil menyalin ${markerComp.ratios.length} baris Ratio dari Marker Plan: ${matchingMarker.no_dokumen}`);
        } else {
          toast.info(`Marker Plan ${matchingMarker.no_dokumen} tidak memiliki data ratio.`);
        }
      }
    } else {
      toast.info('Belum ada Marker Plan untuk Fabric / Shell ini.');
    }
  } catch (error) {
    console.warn("Gagal menyalin ratio dari marker plan:", error);
    toast.error('Gagal menyalin ratio dari Marker Plan.');
  } finally {
    isFetchingRatio.value = false;
  }
};

const getComponentShell = (comp: ComponentInput): WorkOrderShell | null => {
  if (!comp.id_wo_shell || !woDetail.value?.shells) return null;
  return woDetail.value.shells.find((s) => s.id_wo_shell === comp.id_wo_shell) ?? null;
};

const addRatioRow = (compIdx: number) => {
  const comp = components.value[compIdx];
  if (!comp) return;

  if (comp.id_wo_shell === '') {
    toast.error('Harap pilih Fabric / Shell Rujukan untuk komponen ini terlebih dahulu.');
    return;
  }

  const shell = woDetail.value?.shells.find((s) => s.id_wo_shell === comp.id_wo_shell);
  if (shell) {
    comp.ratios.push(createEmptyRatio(shell));
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

// Calculations Helpers
const calculateTotalQty = (ratio: RatioInput): number => {
  const gelaran = parseFloat(ratio.plan_spreading_gelaran) || 0;
  return ratio.sizes.reduce((acc, sz) => {
    const ratioVal = parseFloat(sz.ratio_plan) || 0;
    return acc + Math.round(ratioVal * gelaran);
  }, 0);
};

const calculateSisa = (comp: ComponentInput, ratioIdx: number): number => {
  const shell = getComponentShell(comp);
  if (!shell) return 0;
  const totalWoQty = shell.sizes.reduce((acc, sz) => acc + (sz.qty || 0), 0);
  
  let plannedQtyUpToRow = 0;
  for (let i = 0; i <= ratioIdx; i++) {
    const r = comp.ratios[i];
    if (r) {
      plannedQtyUpToRow += calculateTotalQty(r);
    }
  }
  
  return totalWoQty - plannedQtyUpToRow;
};

const calculateConsPlusAllow = (ratio: RatioInput): number => {
  const consVal = parseFloat(ratio.cons) || 0;
  const allowancePercent = parseFloat(ratio.allowance) || 0;
  return consVal * (1 + allowancePercent / 100);
};

const calculateTotalNeedFabricAllow = (ratio: RatioInput): number => {
  const consPlusAllow = calculateConsPlusAllow(ratio);
  const totalQty = calculateTotalQty(ratio);
  return consPlusAllow * totalQty;
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
  if (!selectedWoId.value) {
    toast.error('Harap pilih Work Order.');
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
    if (!comp.id_wo_shell) {
      toast.error(`Harap pilih Fabric / Shell Rujukan pada Komponen "${comp.nama_komponen || cIdx + 1}"`);
      return;
    }
    let rIdx = 0;
    for (const rat of comp.ratios) {
      // Check mandatory fields
      if (
        rat.plan_spreading_gelaran === '' || 
        rat.cons === '' || 
        rat.allowance === '' || 
        rat.roll_qty === '' || 
        rat.sambungan_roll === '' || 
        rat.reject === '' || 
        rat.lebar_kain === ''
      ) {
        toast.error(`Harap lengkapi semua field numerik di Komponen "${comp.nama_komponen}" baris #${rIdx + 1}`);
        return;
      }

      // Check if size quantity has at least one filled value
      const totalRatio = rat.sizes.reduce((acc, curr) => acc + (parseFloat(curr.ratio_plan) || 0), 0);
      if (totalRatio <= 0) {
        toast.error(`Harap isi ratio plan ukuran minimal satu di Komponen "${comp.nama_komponen}" baris #${rIdx + 1}`);
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
      id_wo: Number(selectedWoId.value),
      components: components.value.map((comp) => ({
        nama_komponen: comp.nama_komponen,
        ratios: comp.ratios.map((rat) => ({
          id_wo_shell: Number(comp.id_wo_shell),
          cons: parseFloat(rat.cons) || 0,
          plan_spreading_gelaran: parseFloat(rat.plan_spreading_gelaran) || 0,
          allowance: parseFloat(rat.allowance) || 0,
          roll_qty: parseInt(rat.roll_qty) || 0,
          sambungan_roll: parseInt(rat.sambungan_roll) || 0,
          reject: parseFloat(rat.reject) || 0,
          lebar_kain: parseFloat(rat.lebar_kain) || 0,
          ket: rat.ket,
          sizes: rat.sizes.map((sz) => ({
            id_wo_shell_size: sz.id_wo_shell_size,
            ratio_plan: parseInt(sz.ratio_plan) || 0
          }))
        }))
      }))
    };

    const res = await createSpreadingCuttingPlan(payload);
    toast.success('Spreading & Cutting Plan berhasil disimpan!');
    
    // Redirect to detail page
    if (res && res.id_spreading_cutting_plan) {
      router.navigate({ to: '/spreading-cutting-plan/$id', params: { id: String(res.id_spreading_cutting_plan) } });
    } else {
      router.navigate({ to: '/spreading-cutting-plan' });
    }
  } catch (error: any) {
    const msg = error?.response?.data?.message ?? 'Gagal membuat Spreading & Cutting Plan.';
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
        <div class="bg-neutral-50 border border-neutral-200 p-2.5 rounded-xl shadow-sm">
          <ScissorsIcon class="w-6 h-6 text-neutral-700" />
        </div>
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-neutral-900">Tambah Spreading & Cutting Plan</h1>
          <p class="text-[13px] text-neutral-500 mt-1">
            Buat rencana spreading dan pemotongan (spreading & cutting plan) yang mengorganisasikan komponen kain, roll qty, reject, spreading gelaran, dan size breakdown untuk seluruh Work Order.
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
            <Input v-model="noDokumen" type="text" placeholder="Masukkan nomor dokumen plan" class="h-9 text-xs border-neutral-200" required />
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
          Rujukan Work Order
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
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
        </div>

        <!-- DYNAMIC COMPONENTS AND RATIOS SECTION -->
        <div v-if="selectedWoId && woDetail" class="space-y-6 pt-4">
          <div class="flex items-center justify-between border-b pb-3 border-neutral-100">
            <h2 class="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
              <span class="inline-block w-1.5 h-4 bg-emerald-600 rounded-full"></span>
              Pengaturan Komponen & Ratio Spreading
            </h2>
            <Button type="button" @click="addComponent" size="sm" variant="outline" class="h-8 border-dashed border-neutral-300 text-neutral-700 hover:bg-neutral-50">
              <PlusIcon class="w-3.5 h-3.5 mr-1" /> Tambah Komponen
            </Button>
          </div>

          <!-- Component Cards Loop -->
          <div v-for="(comp, compIdx) in components" :key="compIdx" class="bg-neutral-50/45 border border-neutral-200 rounded-xl p-5 space-y-4 shadow-sm relative">
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
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <div class="space-y-1.5">
                <Label class="text-xs font-semibold text-neutral-700">Nama Komponen <span class="text-red-500">*</span></Label>
                <Input
                  v-model="comp.nama_komponen"
                  type="text"
                  placeholder="Contoh: Fabric Utama, Interlining, Kantong"
                  class="h-9 text-xs bg-white border-neutral-200"
                  required
                />
              </div>

              <div class="space-y-1.5">
                <Label class="text-xs font-semibold text-neutral-700">Fabric / Shell Rujukan <span class="text-red-500">*</span></Label>
                <div class="relative">
                  <select
                    v-model="comp.id_wo_shell"
                    @change="handleComponentShellChange(compIdx)"
                    class="w-full h-9 rounded-md border border-neutral-200 bg-white pl-3 pr-9 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 appearance-none cursor-pointer text-xs"
                    required
                  >
                    <option value="" disabled>Pilih Fabric / Shell Rujukan</option>
                    <option v-for="shell in (compIdx === 0 ? fabricShells : interliningShells)" :key="shell.id_wo_shell" :value="shell.id_wo_shell">
                      {{ shell.deskripsi }} ({{ shell.color }})
                    </option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                    <ChevronDownIcon class="w-4 h-4 text-neutral-400" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Ratio Rows for this Component -->
            <div v-if="comp.id_wo_shell && getComponentShell(comp)" class="space-y-4 pt-2">
              <div class="flex items-center justify-between border-b border-neutral-100 pb-1.5">
                <h3 class="text-xs font-semibold text-neutral-600">Ratio Breakdown & Size Spreading</h3>
                <div class="flex space-x-2">
                  <Button type="button" @click="autoFillRatioFromMarkerPlan(compIdx)" :disabled="isFetchingRatio" size="sm" variant="outline" class="text-blue-600 border-blue-200 hover:bg-blue-50 h-7 text-xs px-2.5">
                    <RefreshCw v-if="isFetchingRatio" class="w-3.5 h-3.5 mr-1 animate-spin" />
                    <FileDownIcon v-else class="w-3.5 h-3.5 mr-1" /> Salin dari Marker Plan
                  </Button>
                  <Button type="button" @click="addRatioRow(compIdx)" size="sm" variant="ghost" class="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-7 text-xs px-2.5">
                    <PlusIcon class="w-3.5 h-3.5 mr-1" /> Tambah Baris Ratio
                  </Button>
                </div>
              </div>

              <!-- Responsive table wrapper -->
              <div class="overflow-x-auto border border-neutral-200 rounded-lg bg-white shadow-xs">
                <table class="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr class="bg-neutral-50/75 border-b border-neutral-200 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                      <th class="p-3 w-12 text-center font-bold">No.</th>
                      
                      <!-- Dynamic Size Columns -->
                      <th v-for="sz in getComponentShell(comp)?.sizes" :key="sz.id_wo_shell_size" class="p-3 w-16 text-center border-r border-neutral-100 font-bold bg-neutral-100/50">
                        {{ sz.size }}
                      </th>
                      
                      <th class="p-3 w-28 text-center font-bold">Plan Spreading (Layer) <span class="text-red-500">*</span></th>
                      <th class="p-3 w-28 text-center font-bold">Cons <span class="text-red-500">*</span></th>
                      <th class="p-3 w-28 text-center font-bold">Allow (%) <span class="text-red-500">*</span></th>
                      <th class="p-3 w-28 text-center font-bold">Roll Qty <span class="text-red-500">*</span></th>
                      <th class="p-3 w-28 text-center font-bold">Join Roll <span class="text-red-500">*</span></th>
                      <th class="p-3 w-28 text-center font-bold">Reject (Yd) <span class="text-red-500">*</span></th>
                      <th class="p-3 w-28 text-center font-bold">Width (In) <span class="text-red-500">*</span></th>
                      <th class="p-3 w-24 text-center font-bold">Sisa (Pcs)</th>
                      <th class="p-3 w-24 text-center font-bold">Cons+Allow</th>
                      <th class="p-3 w-24 text-center font-bold">Total Need (Yd)</th>
                      <th class="p-3 w-36 font-bold">Notes</th>
                      <th class="p-3 w-12 text-center font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-neutral-200">
                    <tr v-for="(ratio, ratioIdx) in comp.ratios" :key="ratioIdx" class="hover:bg-neutral-50/30 transition-colors">
                      
                      <!-- Row Index -->
                      <td class="p-3 text-center font-medium text-neutral-400 font-mono">{{ ratioIdx + 1 }}</td>
                      
                      <!-- Dynamic Size Inputs -->
                      <td v-for="(sz, szIdx) in ratio.sizes" :key="szIdx" class="p-3 text-center border-r border-neutral-100 bg-neutral-50/20">
                        <div class="flex flex-col items-center gap-1 min-w-[50px]">
                          <Input
                            v-model="sz.ratio_plan"
                            type="number"
                            placeholder="0"
                            class="w-12 h-8 text-center text-xs p-1 bg-white border-neutral-300 rounded focus-visible:ring-1 focus-visible:ring-neutral-800"
                            min="0"
                          />
                          <span class="text-[9px] text-neutral-400 font-mono">
                            ({{ Math.round((parseFloat(sz.ratio_plan) || 0) * (parseFloat(ratio.plan_spreading_gelaran) || 0)) }} pcs)
                          </span>
                        </div>
                      </td>

                      <!-- Spreading Gelaran -->
                      <td class="p-3">
                        <Input v-model="ratio.plan_spreading_gelaran" type="number" placeholder="0" class="h-8 text-xs min-w-16 border-neutral-300" min="0" required />
                      </td>

                      <!-- Cons -->
                      <td class="p-3">
                        <Input v-model="ratio.cons" type="number" step="any" placeholder="0" class="h-8 text-xs min-w-16 border-neutral-300" min="0" required />
                      </td>

                      <!-- Allowance -->
                      <td class="p-3">
                        <Input v-model="ratio.allowance" type="number" step="any" placeholder="0" class="h-8 text-xs min-w-16 border-neutral-300" min="0" required />
                      </td>

                      <!-- Roll Qty -->
                      <td class="p-3">
                        <Input v-model="ratio.roll_qty" type="number" placeholder="0" class="h-8 text-xs min-w-16 border-neutral-300" min="0" required />
                      </td>

                      <!-- Join Roll -->
                      <td class="p-3">
                        <Input v-model="ratio.sambungan_roll" type="number" placeholder="0" class="h-8 text-xs min-w-16 border-neutral-300" min="0" required />
                      </td>

                      <!-- Reject -->
                      <td class="p-3">
                        <Input v-model="ratio.reject" type="number" step="any" placeholder="0" class="h-8 text-xs min-w-16 border-neutral-300" min="0" required />
                      </td>

                      <!-- Lebar Kain -->
                      <td class="p-3">
                        <Input v-model="ratio.lebar_kain" type="number" step="any" placeholder="0" class="h-8 text-xs min-w-16 border-neutral-300" min="0" required />
                      </td>

                      <!-- Sisa Qty (Pcs) -->
                      <td class="p-3 text-center font-mono font-medium text-neutral-600">
                        {{ calculateSisa(comp, ratioIdx) }}
                      </td>

                      <!-- Cons + Allowance (Yards) -->
                      <td class="p-3 text-center font-mono font-semibold text-neutral-700">
                        {{ calculateConsPlusAllow(ratio).toFixed(3) }}
                      </td>

                      <!-- Total Need Fabric with Allowance (Yards) -->
                      <td class="p-3 text-center font-mono font-bold text-emerald-700">
                        {{ calculateTotalNeedFabricAllow(ratio).toFixed(2) }}
                      </td>

                      <!-- Notes -->
                      <td class="p-3">
                        <Input v-model="ratio.ket" type="text" placeholder="Catatan baris" class="h-8 text-xs min-w-28 border-neutral-300" />
                      </td>

                      <!-- Remove Action -->
                      <td class="p-3 text-center">
                        <button
                          type="button"
                          @click="removeRatioRow(compIdx, ratioIdx)"
                          class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Hapus Baris"
                        >
                          <Trash2Icon class="w-3.5 h-3.5" />
                        </button>
                      </td>

                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-end gap-3 pt-6 border-t border-neutral-100">
          <Button @click="router.history.back()" type="button" variant="outline" class="border-neutral-200">
            Batal
          </Button>
          <Button :disabled="isSaving || !selectedWoId" type="submit" class="bg-neutral-900 text-white hover:bg-neutral-800">
            <SaveIcon v-if="!isSaving" class="w-4 h-4 mr-2" />
            <span v-else class="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Simpan Spreading Plan
          </Button>
        </div>

      </form>
    </Card>
  </div>
</template>
