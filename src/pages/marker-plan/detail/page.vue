<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useParams, useRouter } from '@tanstack/vue-router';
import { CalendarIcon, HashIcon, InfoIcon, ArrowLeftIcon, Layers2Icon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { useMarkerPlan } from '@/composables/useMarkerPlan';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/formatter';

const router = useRouter();
const params = useParams({ from: '/_authenticated/marker-plan/$id' });
const id = computed(() => params.value.id);

const { isLoading, detail, fetchDetail: loadDetail } = useMarkerPlan();

const fetchDetail = async () => {
    try {
        await loadDetail(id.value);
    } catch (e) {
        toast.error("Gagal memuat rincian Marker Plan.");
    }
};

// Get all unique size names across all components/ratios to define columns
const uniqueSizes = computed(() => {
    if (!detail.value || !detail.value.components) return [];
    const sizesSet = new Set<string>();
    detail.value.components.forEach(comp => {
        if (comp.ratios) {
            comp.ratios.forEach(ratio => {
                if (ratio.sizes) {
                    ratio.sizes.forEach(sz => {
                        if (sz.size) sizesSet.add(sz.size);
                    });
                }
            });
        }
    });
    // Standard order (XS, S, M, L, XL, etc.)
    const standardSizeOrder = [
        'os', 'onesize', 'one size',
        '3xs', 'xxxs',
        '2xs', 'xxs',
        'xs',
        's',
        'm',
        'l',
        'xl',
        '2xl', 'xxl',
        '3xl', 'xxxl',
        '4xl', 'xxxxl',
        '5xl', 'xxxxxl'
    ];

    const getSizeWeight = (sizeStr: string): number => {
        const clean = sizeStr.trim().toLowerCase();
        const num = parseFloat(clean);
        if (!isNaN(num)) return num;
        const idx = standardSizeOrder.indexOf(clean);
        return idx !== -1 ? idx - 100 : 999;
    };

    return Array.from(sizesSet).sort((a, b) => {
        const wA = getSizeWeight(a);
        const wB = getSizeWeight(b);
        if (wA !== wB) return wA - wB;
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
});

// Helper to look up Ratio Plan for a specific size in a ratio
const getSizeQty = (ratioSizes: any[], sizeName: string) => {
    const found = ratioSizes.find(s => s.size === sizeName);
    return found ? found.ratio_plan : 0;
};

// Calculate total planned qty for a single ratio row (ratio * gelaran)
const getRatioTotalQty = (ratioSizes: any[], planSpreadingGelaran: number) => {
    return ratioSizes.reduce((acc, curr) => acc + Math.round((curr.ratio_plan || 0) * planSpreadingGelaran), 0);
};

// Calculate Sisa
const calculateDetailSisa = (ratios: any[], ratioIdx: number) => {
    if (ratios.length === 0) return 0;
    const firstRatio = ratios[0];
    const totalWoQty = firstRatio.sizes.reduce((acc: number, sz: any) => acc + (sz.size_qty || 0), 0);
    
    let plannedQtyUpToRow = 0;
    for (let i = 0; i <= ratioIdx; i++) {
        const r = ratios[i];
        if (r) {
            plannedQtyUpToRow += getRatioTotalQty(r.sizes, r.plan_spreading_gelaran);
        }
    }
    return totalWoQty - plannedQtyUpToRow;
};

// Calculate Cons+Allow
const getConsPlusAllow = (ratio: any) => {
    return ratio.cons * (1 + (ratio.allowance || 0) / 100);
};

// Calculate Diff
const getDiff = (ratio: any) => {
    if (ratio.cons_buyer === null || ratio.cons_buyer === undefined) return null;
    const consAllow = getConsPlusAllow(ratio);
    return consAllow - ratio.cons_buyer;
};

// Calculate Total Need Fabric
const getTotalNeedFabric = (ratio: any) => {
    const totalQty = getRatioTotalQty(ratio.sizes, ratio.plan_spreading_gelaran);
    return ratio.cons * totalQty;
};

// Calculate Total Need Fabric + Allow
const getTotalNeedPlusAllow = (ratio: any) => {
    const totalQty = getRatioTotalQty(ratio.sizes, ratio.plan_spreading_gelaran);
    return getConsPlusAllow(ratio) * totalQty;
};

// Calculate total cut qty for a specific size in a component across all its ratios
const getComponentSizeTotalCut = (ratios: any[], sizeName: string) => {
    if (!ratios) return 0;
    return ratios.reduce((acc, ratio) => {
        const found = ratio.sizes.find((s: any) => s.size === sizeName);
        const ratioPlan = found ? found.ratio_plan : 0;
        return acc + Math.round(ratioPlan * ratio.plan_spreading_gelaran);
    }, 0);
};

// Calculate total component cut qty across all sizes and ratios
const getComponentTotalCut = (ratios: any[]) => {
    if (!ratios) return 0;
    return ratios.reduce((acc, ratio) => {
        return acc + getRatioTotalQty(ratio.sizes, ratio.plan_spreading_gelaran);
    }, 0);
};

// Get QTY Order for a specific size from the shell
const getComponentSizeOrderQty = (ratios: any[], sizeName: string) => {
    if (!ratios || ratios.length === 0) return 0;
    for (const ratio of ratios) {
        const found = ratio.sizes.find((s: any) => s.size === sizeName);
        if (found) {
            return found.size_qty || 0;
        }
    }
    return 0;
};

// Get Total QTY Order for the component
const getComponentTotalOrderQty = (ratios: any[]) => {
    if (!ratios || ratios.length === 0) return 0;
    let total = 0;
    uniqueSizes.value.forEach(sizeName => {
        total += getComponentSizeOrderQty(ratios, sizeName);
    });
    return total;
};

// Calculate size-wise difference and percentage
const getSizeDiffAndPercent = (ratios: any[], sizeName: string) => {
    const order = getComponentSizeOrderQty(ratios, sizeName);
    const aktual = getComponentSizeTotalCut(ratios, sizeName);
    const diff = aktual - order;
    const pct = order > 0 ? (diff / order) * 100 : 0;
    return { diff, pct };
};

// Calculate overall component difference and percentage
const getTotalDiffAndPercent = (ratios: any[]) => {
    const order = getComponentTotalOrderQty(ratios);
    const aktual = getComponentTotalCut(ratios);
    const diff = aktual - order;
    const pct = order > 0 ? (diff / order) * 100 : 0;
    return { diff, pct };
};

// Format difference and percentage output
const formatDiffAndPercent = (diff: number, pct: number) => {
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff.toLocaleString('id-ID')} (${sign}${pct.toFixed(1)}%)`;
};

// Sum QTY Total Need + Allowance across all ratios in a component
const getComponentTotalNeedPlusAllow = (ratios: any[]) => {
    if (!ratios) return 0;
    return ratios.reduce((acc, ratio) => {
        return acc + getTotalNeedPlusAllow(ratio);
    }, 0);
};

// Calculate difference and percentage of received fabric quantity against total planned need
const getComponentFabricDiff = (comp: any) => {
    const received = comp.ratios?.[0]?.qty_fabric_received || 0;
    const needPlusAllow = getComponentTotalNeedPlusAllow(comp.ratios);
    const diff = received - needPlusAllow;
    const pct = needPlusAllow > 0 ? (diff / needPlusAllow) * 100 : 0;
    return { received, needPlusAllow, diff, pct };
};

onMounted(() => {
    fetchDetail();
});
</script>

<template>
  <div class="container mx-auto py-8 space-y-8 max-w-7xl">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Spinner class="size-8" />
      <p class="text-neutral-500 animate-pulse text-sm">Memuat dokumen Marker Plan...</p>
    </div>

    <!-- Detail Content -->
    <div v-else-if="detail" class="space-y-6 animate-fade-in">
      <!-- Header Section -->
      <div class="flex flex-col md:flex-row gap-6 items-center border-b pb-6 border-neutral-200 justify-between">
        <div class="flex items-center gap-4">
          <div class="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 shadow-md text-white">
            <Layers2Icon class="w-10 h-10" />
          </div>
          <div>
            <div class="flex items-center gap-2.5">
              <span class="text-[10px] uppercase font-bold tracking-wider text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">Dokumen</span>
              <h1 class="text-3xl font-extrabold tracking-tight text-neutral-955 font-mono">{{ detail.no_dokumen }}</h1>
            </div>
            <!-- Quick Metadata Badges/Row -->
            <div class="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-xs text-neutral-600">
              <div class="flex items-center gap-1.5">
                <span class="font-semibold text-neutral-400 uppercase tracking-wider text-[10px]">Tgl Efektif:</span>
                <span class="font-medium text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">{{ formatDate(detail.tanggal_efektif) }}</span>
              </div>
              <div class="flex items-center gap-1.5 border-l border-neutral-200 pl-6">
                <span class="font-semibold text-neutral-400 uppercase tracking-wider text-[10px]">Tgl Pembuatan:</span>
                <span class="font-medium text-neutral-900">{{ formatDate(detail.created_at) }}</span>
              </div>
              <div class="flex items-center gap-1.5 border-l border-neutral-200 pl-6">
                <span class="font-semibold text-neutral-400 uppercase tracking-wider text-[10px]">Style:</span>
                <span class="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{{ detail.style }}</span>
              </div>
              <div class="flex items-center gap-1.5 border-l border-neutral-200 pl-6">
                <span class="font-semibold text-neutral-400 uppercase tracking-wider text-[10px]">Model:</span>
                <span class="font-medium text-neutral-900">{{ detail.model }}</span>
              </div>
              <div class="flex items-center gap-1.5 border-l border-neutral-200 pl-6">
                <span class="font-semibold text-neutral-400 uppercase tracking-wider text-[10px]">Warna:</span>
                <span class="font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">{{ detail.color }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-2 w-full md:w-auto">
          <Button @click="router.history.back()" variant="outline" class="flex-1 md:flex-none border-neutral-300 shadow-xs">
            <ArrowLeftIcon class="w-4 h-4 mr-2" /> Kembali
          </Button>
        </div>
      </div>

      <!-- Detail Grid Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Left Side: Main components & ratios -->
        <div class="lg:col-span-2 space-y-6">
          
          <Card class="overflow-hidden border border-neutral-200 shadow-sm bg-white">
            <CardHeader class="bg-neutral-50/50 border-b border-neutral-200 pb-4">
              <CardTitle class="text-sm font-bold flex items-center gap-2 text-neutral-900 uppercase tracking-wider">
                <Layers2Icon class="w-4 h-4 text-neutral-600" />
                Daftar Komponen & Ratio
              </CardTitle>
            </CardHeader>
            <CardContent class="p-6 space-y-8">
              <div v-if="!detail.components || detail.components.length === 0" class="text-center py-10 text-neutral-400 text-sm">
                Tidak ada data komponen marker plan.
              </div>
              
              <div v-else v-for="comp in detail.components" :key="comp.id_komponen_marker" class="space-y-3">
                <div class="flex items-center justify-between border-b pb-2 border-neutral-100">
                  <h3 class="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-2">
                    <span class="inline-block w-1.5 h-3.5 bg-neutral-900 rounded-full"></span>
                    Komponen: {{ comp.nama_komponen }}
                    <span v-if="comp.ratios && comp.ratios.length > 0" class="text-xs font-normal text-neutral-500 normal-case ml-2">
                      (QTY Fabric RCVD: {{ comp.ratios[0]?.qty_fabric_received?.toLocaleString('id-ID') || 0 }} yds)
                    </span>
                  </h3>
                  <span class="text-[10px] text-neutral-400 font-mono">ID: #{{ comp.id_komponen_marker }}</span>
                </div>

                <!-- Ratio Table -->
                <div class="overflow-x-auto border border-neutral-150 rounded-lg shadow-xs bg-white">
                  <table class="w-full text-left border-collapse border-spacing-0 text-xs min-w-[1700px]">
                    <thead class="bg-neutral-50/60 border-b border-neutral-200 text-[10px] uppercase font-bold text-neutral-500">
                      <tr>
                        <th class="px-3 py-2.5 w-[3%]">No</th>
                        <!-- Dynamic size headers -->
                        <th v-for="sizeName in uniqueSizes" :key="sizeName" class="px-3 py-2.5 text-center w-[5%] bg-neutral-50">
                          Sz {{ sizeName }}
                        </th>
                        <th class="px-3 py-2.5 w-[6%]">Total QTY</th>
                        <th class="px-3 py-2.5 w-[6%]">Gelaran</th>
                        <th class="px-3 py-2.5 w-[6%]">Sisa</th>
                        <th class="px-3 py-2.5 w-[4%]">Plot</th>
                        <th class="px-3 py-2.5 w-[6%]">Lebar Kain</th>
                        <th class="px-3 py-2.5 w-[9%]">Panjang Marker</th>
                        <th class="px-3 py-2.5 w-[6%]">Net Cons</th>
                        <th class="px-3 py-2.5 w-[6%]">Efficiency (%)</th>
                        <th class="px-3 py-2.5 w-[6%]">Allowance (%)</th>
                        <th class="px-3 py-2.5 w-[7%]">Cons+Allow (Yds)</th>
                        <th class="px-3 py-2.5 w-[6%]">Cons Buyer</th>
                        <th class="px-3 py-2.5 w-[6%]">Diff</th>
                        <th class="px-3 py-2.5 w-[7%]">Total Need Fabric</th>
                        <th class="px-3 py-2.5 w-[7%]">Total Need+Allow</th>
                        <th class="px-3 py-2.5 w-[8%]">Ket</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-neutral-150 text-neutral-700 font-mono">
                      <tr v-for="(ratio, ratioIdx) in comp.ratios" :key="ratio.id_ratio_marker" class="hover:bg-neutral-50/25 transition-colors">
                        <!-- No -->
                        <td class="px-3 py-3 text-center font-medium">{{ ratioIdx + 1 }}</td>
                        
                        <!-- Dynamic size values -->
                        <td v-for="sizeName in uniqueSizes" :key="sizeName" class="px-3 py-3 text-center text-neutral-600 bg-neutral-50/20">
                          {{ getSizeQty(ratio.sizes, sizeName) || '—' }}
                        </td>
                        
                        <!-- Total QTY -->
                        <td class="px-3 py-3 text-right font-bold text-neutral-950 bg-neutral-50/45">
                          {{ getRatioTotalQty(ratio.sizes, ratio.plan_spreading_gelaran).toLocaleString('id-ID') }}
                        </td>
                        
                        <!-- Gelaran -->
                        <td class="px-3 py-3 text-right">{{ ratio.plan_spreading_gelaran.toFixed(2) }}</td>
                        
                        <!-- Sisa -->
                        <td class="px-3 py-3 text-right bg-neutral-50/20">{{ calculateDetailSisa(comp.ratios, ratioIdx).toLocaleString('id-ID') }}</td>
                        
                        <!-- Plot -->
                        <td class="px-3 py-3 text-right">{{ ratio.plot }}</td>
                        
                        <!-- Lebar Kain -->
                        <td class="px-3 py-3 text-right">{{ ratio.lebar_kain.toFixed(3) }}</td>
                        
                        <!-- Panjang Marker -->
                        <td class="px-3 py-3 text-right">{{ ratio.panjang_marker.toFixed(3) }} {{ ratio.panjang_marker_unit }}</td>
                        
                        <!-- Net Cons -->
                        <td class="px-3 py-3 text-right">{{ ratio.cons.toFixed(3) }}</td>
                        
                        <!-- Efficiency -->
                        <td class="px-3 py-3 text-right">{{ ratio.efficiency_marker.toFixed(2) }}%</td>
                        
                        <!-- Allowance -->
                        <td class="px-3 py-3 text-right">{{ ratio.allowance.toFixed(2) }}%</td>
                        
                        <!-- Cons+Allow (Yds) -->
                        <td class="px-3 py-3 text-right font-medium text-neutral-900 bg-neutral-50/30">{{ getConsPlusAllow(ratio).toFixed(3) }}</td>
                        
                        <!-- Cons Buyer -->
                        <td class="px-3 py-3 text-right">
                          {{ ratio.cons_buyer !== undefined && ratio.cons_buyer !== null ? ratio.cons_buyer.toFixed(3) : '—' }}
                        </td>
                        
                        <!-- Diff -->
                        <td class="px-3 py-3 text-right" :class="[getDiff(ratio) !== null && getDiff(ratio)! < 0 ? 'text-red-600 font-semibold' : '']">
                          {{ getDiff(ratio) !== null ? getDiff(ratio)!.toFixed(3) : '—' }}
                        </td>
                        
                        <!-- Total Need Fabric -->
                        <td class="px-3 py-3 text-right">{{ getTotalNeedFabric(ratio).toFixed(3) }}</td>
                        
                        <!-- Total Need+Allow -->
                        <td class="px-3 py-3 text-right font-medium text-neutral-900 bg-neutral-50/30">{{ getTotalNeedPlusAllow(ratio).toFixed(3) }}</td>
                        
                        <!-- Ket -->
                        <td class="px-3 py-3 text-left font-sans truncate max-w-[150px]" :title="ratio.ket">{{ ratio.ket || '—' }}</td>
                      </tr>
                      <!-- Footer Row 1: QTY Order (Shell) -->
                      <tr class="bg-neutral-50 font-bold border-t border-neutral-200">
                        <td class="px-3 py-3 text-center text-[10px] uppercase tracking-wider text-neutral-500 font-sans">QTY Order</td>
                        <td v-for="sizeName in uniqueSizes" :key="sizeName" class="px-3 py-3 text-center text-neutral-600 bg-neutral-50/40">
                          {{ getComponentSizeOrderQty(comp.ratios, sizeName).toLocaleString('id-ID') }}
                        </td>
                        <td class="px-3 py-3 text-right text-neutral-700 bg-neutral-100/40">
                          {{ getComponentTotalOrderQty(comp.ratios).toLocaleString('id-ID') }}
                        </td>
                        <td colspan="14" class="bg-neutral-50/20"></td>
                      </tr>

                      <!-- Footer Row 2: QTY Aktual (Jumlah Cut) -->
                      <tr class="bg-neutral-50 font-bold border-t border-neutral-200">
                        <td class="px-3 py-3 text-center text-[10px] uppercase tracking-wider text-neutral-500 font-sans">QTY Aktual</td>
                        <td v-for="sizeName in uniqueSizes" :key="sizeName" class="px-3 py-3 text-center text-neutral-900 bg-neutral-50/40">
                          {{ getComponentSizeTotalCut(comp.ratios, sizeName).toLocaleString('id-ID') }}
                        </td>
                        <td class="px-3 py-3 text-right text-neutral-900 bg-neutral-100/40">
                          {{ getComponentTotalCut(comp.ratios).toLocaleString('id-ID') }}
                        </td>
                        <td colspan="14" class="bg-neutral-50/20"></td>
                      </tr>

                      <!-- Footer Row 3: Perbedaan (Diff %) -->
                      <tr class="bg-neutral-100 font-bold border-t-2 border-neutral-300">
                        <td class="px-3 py-3 text-center text-[10px] uppercase tracking-wider text-neutral-600 font-sans">Selisih (%)</td>
                        <td v-for="sizeName in uniqueSizes" :key="sizeName" class="px-3 py-3 text-center bg-neutral-100/60 font-mono"
                            :class="[getSizeDiffAndPercent(comp.ratios, sizeName).diff < 0 ? 'text-red-600' : getSizeDiffAndPercent(comp.ratios, sizeName).diff > 0 ? 'text-green-600' : 'text-neutral-500']">
                          {{ formatDiffAndPercent(getSizeDiffAndPercent(comp.ratios, sizeName).diff, getSizeDiffAndPercent(comp.ratios, sizeName).pct) }}
                        </td>
                        <td class="px-3 py-3 text-right bg-neutral-150/80 font-mono"
                            :class="[getTotalDiffAndPercent(comp.ratios).diff < 0 ? 'text-red-700' : getTotalDiffAndPercent(comp.ratios).diff > 0 ? 'text-green-700' : 'text-neutral-700']">
                          {{ formatDiffAndPercent(getTotalDiffAndPercent(comp.ratios).diff, getTotalDiffAndPercent(comp.ratios).pct) }}
                        </td>
                        <td colspan="14" class="bg-neutral-100/40"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Fabric Reconciliation Card -->
                <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                  <div class="flex flex-col gap-1">
                    <span class="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Total Fabric Received</span>
                    <span class="text-xs font-bold text-neutral-900 font-mono">{{ getComponentFabricDiff(comp).received.toLocaleString('id-ID') }} yds</span>
                  </div>
                  <div class="flex flex-col gap-1 border-t md:border-t-0 md:border-l border-neutral-200 pt-2 md:pt-0 md:pl-4">
                    <span class="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Total Need + Allowance</span>
                    <span class="text-xs font-bold text-neutral-900 font-mono">{{ getComponentFabricDiff(comp).needPlusAllow.toFixed(3) }} yds</span>
                  </div>
                  <div class="flex flex-col gap-1 border-t md:border-t-0 md:border-l border-neutral-200 pt-2 md:pt-0 md:pl-4">
                    <span class="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Balance (Received - Needed)</span>
                    <span class="text-xs font-bold font-mono" :class="[getComponentFabricDiff(comp).diff < 0 ? 'text-red-600' : 'text-green-600']">
                      {{ getComponentFabricDiff(comp).diff >= 0 ? '+' : '' }}{{ getComponentFabricDiff(comp).diff.toFixed(3) }} yds 
                      <span class="text-[10px] font-normal">({{ getComponentFabricDiff(comp).diff >= 0 ? '+' : '' }}{{ getComponentFabricDiff(comp).pct.toFixed(1) }}%)</span>
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        <!-- Right Side: Metadata info -->
        <div class="space-y-6">
          <Card class="border border-neutral-200 shadow-sm bg-white">
            <CardHeader class="bg-neutral-50/50 border-b border-neutral-200 pb-4">
              <CardTitle class="text-xs font-bold text-neutral-950 uppercase tracking-wider flex items-center gap-2">
                <InfoIcon class="w-4 h-4 text-neutral-600" />
                Metadata Dokumen
              </CardTitle>
            </CardHeader>
            <CardContent class="pt-6 space-y-4 text-xs text-neutral-700">
              <div class="flex items-center justify-between">
                <span class="text-neutral-500 flex items-center gap-1.5">
                  <HashIcon class="w-3.5 h-3.5 text-neutral-400" /> Marker Plan ID
                </span>
                <span class="font-mono font-bold text-neutral-900">#{{ detail.id_marker_plan }}</span>
              </div>
              <Separator class="bg-neutral-100" />
              <div class="flex items-center justify-between">
                <span class="text-neutral-500 flex items-center gap-1.5">
                  <HashIcon class="w-3.5 h-3.5 text-neutral-400" /> ID WO Shell
                </span>
                <span class="font-mono font-bold text-neutral-900">#{{ detail.id_wo_shell }}</span>
              </div>
              <Separator class="bg-neutral-100" />
              <div class="flex items-center justify-between">
                <span class="text-neutral-500 flex items-center gap-1.5">
                  <Layers2Icon class="w-3.5 h-3.5 text-neutral-400" /> QTY Fabric RCVD (Main)
                </span>
                <span class="font-mono font-bold text-neutral-900">{{ detail.qty_fabric_received?.toLocaleString('id-ID') || 0 }} yds</span>
              </div>
              <Separator class="bg-neutral-100" />
              <div class="flex items-center justify-between">
                <span class="text-neutral-500 flex items-center gap-1.5">
                  <CalendarIcon class="w-3.5 h-3.5 text-neutral-400" /> Created At
                </span>
                <span class="font-medium text-neutral-900">{{ formatDate(detail.created_at) }}</span>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>

    <!-- Error State -->
    <div v-else class="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
      <div class="bg-neutral-100 p-4 rounded-full border border-neutral-200">
        <Layers2Icon class="w-12 h-12 text-neutral-400" />
      </div>
      <h2 class="text-2xl font-bold text-neutral-900">Marker Plan Tidak Ditemukan</h2>
      <p class="text-neutral-500">Maaf, data Marker Plan yang Anda cari tidak tersedia.</p>
      <Button @click="router.navigate({ to: '/work-order' })" class="bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm border border-neutral-800">
        Kembali ke Daftar Work Order
      </Button>
    </div>
  </div>
</template>
