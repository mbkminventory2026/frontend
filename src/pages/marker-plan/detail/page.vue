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
          <div class="bg-neutral-100 p-3.5 rounded-2xl border border-neutral-200 shadow-sm">
            <Layers2Icon class="w-10 h-10 text-neutral-700" />
          </div>
          <div>
            <div class="flex items-center gap-2.5">
              <h1 class="text-2xl font-bold tracking-tight text-neutral-900">{{ detail.no_dokumen }}</h1>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200">
                Marker Plan
              </span>
            </div>
            <p class="text-sm text-neutral-500 mt-1">
              Tanggal Efektif: {{ formatDate(detail.tanggal_efektif) }}
            </p>
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
                  </h3>
                  <span class="text-[10px] text-neutral-400 font-mono">ID: #{{ comp.id_komponen_marker }}</span>
                </div>

                <!-- Ratio Table -->
                <div class="overflow-x-auto border border-neutral-150 rounded-lg shadow-xs bg-white">
                  <table class="w-full text-left border-collapse border-spacing-0 text-xs min-w-[950px]">
                    <thead class="bg-neutral-50/60 border-b border-neutral-200 text-[10px] uppercase font-bold text-neutral-500">
                      <tr>
                        <th class="px-3 py-2.5 w-[7%]">Cons (yd)</th>
                        <th class="px-3 py-2.5 w-[9%]">Spreading Gelaran</th>
                        <th class="px-3 py-2.5 w-[8%]">Pjg Marker (yd)</th>
                        <th class="px-3 py-2.5 w-[8%]">Efficiency</th>
                        <th class="px-3 py-2.5 w-[8%]">Allowance</th>
                        <th class="px-3 py-2.5 w-[8%]">Cons Buyer</th>
                        <th class="px-3 py-2.5 w-[7%]">Roll Qty</th>
                        <th class="px-3 py-2.5 w-[7%]">Sambungan</th>
                        <!-- Dynamic size headers -->
                        <th v-for="sizeName in uniqueSizes" :key="sizeName" class="px-3 py-2.5 text-center w-[6%] bg-neutral-50">
                          Sz {{ sizeName }}
                        </th>
                        <th class="px-3 py-2.5 text-right w-[8%] font-bold text-neutral-900 bg-neutral-50">Total Plan</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-neutral-150 text-neutral-700 font-mono">
                      <tr v-for="ratio in comp.ratios" :key="ratio.id_ratio_marker" class="hover:bg-neutral-50/25 transition-colors">
                        <td class="px-3 py-3 text-right">{{ ratio.cons.toFixed(3) }}</td>
                        <td class="px-3 py-3 text-right">{{ ratio.plan_spreading_gelaran.toFixed(2) }}</td>
                        <td class="px-3 py-3 text-right">{{ ratio.panjang_marker.toFixed(3) }}</td>
                        <td class="px-3 py-3 text-right">{{ ratio.efficiency_marker.toFixed(2) }}%</td>
                        <td class="px-3 py-3 text-right">{{ ratio.allowance.toFixed(2) }}%</td>
                        <td class="px-3 py-3 text-right">
                          {{ ratio.cons_buyer !== undefined && ratio.cons_buyer !== null ? ratio.cons_buyer.toFixed(3) : '—' }}
                        </td>
                        <td class="px-3 py-3 text-right">{{ ratio.roll_qty }}</td>
                        <td class="px-3 py-3 text-right">{{ ratio.sambungan_roll }}</td>
                        
                        <!-- Dynamic size values -->
                        <td v-for="sizeName in uniqueSizes" :key="sizeName" class="px-3 py-3 text-center text-neutral-600 bg-neutral-50/20">
                          {{ getSizeQty(ratio.sizes, sizeName) || '—' }}
                        </td>
                        
                        <!-- Total Plan Qty for ratio row -->
                        <td class="px-3 py-3 text-right font-bold text-neutral-950 bg-neutral-50/45">
                          {{ getRatioTotalQty(ratio.sizes, ratio.plan_spreading_gelaran).toLocaleString('id-ID') }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
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
