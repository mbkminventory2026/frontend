<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useParams, useRouter } from '@tanstack/vue-router';
import { CalendarIcon, HashIcon, InfoIcon, ArrowLeftIcon, ScissorsIcon, CheckCircle2Icon, XCircleIcon, ClockIcon, ShieldCheckIcon, UserIcon, ExternalLinkIcon, Loader2Icon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { useSpreadingCuttingPlan } from '@/composables/useSpreadingCuttingPlan';
import { getDocumentAuditTrail, type DocumentAuditTrail } from '@/api/approvals/approvals';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/formatter';

const router = useRouter();
const params = useParams({ from: '/_authenticated/spreading-cutting-plan/$id' });
const id = computed(() => params.value.id);

const { isLoading, detail, fetchDetail: loadDetail } = useSpreadingCuttingPlan();

const fetchDetail = async () => {
    try {
        await loadDetail(id.value);
    } catch (e) {
        toast.error("Gagal memuat rincian Spreading & Cutting Plan.");
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

// Calculate Total Need Fabric + Allow
const getTotalNeedPlusAllow = (ratio: any) => {
    const totalQty = getRatioTotalQty(ratio.sizes, ratio.plan_spreading_gelaran);
    return getConsPlusAllow(ratio) * totalQty;
};

// ─── Approval State ────────────────────────────────────
const auditTrail = ref<DocumentAuditTrail | null>(null);
const isLoadingApproval = ref(false);

const approvalStatusClass = computed(() => {
  const status = auditTrail.value?.status_global?.toLowerCase();
  if (status === 'approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/30';
  if (status === 'rejected') return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/30';
  return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/30';
});

const approvalStatusLabel = computed(() => {
  const status = auditTrail.value?.status_global?.toLowerCase();
  if (status === 'approved') return 'APPROVED';
  if (status === 'rejected') return 'REJECTED';
  if (auditTrail.value) return 'PENDING';
  return 'MEMUAT...';
});

const fetchApprovalStatus = async (docId: string) => {
  isLoadingApproval.value = true;
  try {
    auditTrail.value = await getDocumentAuditTrail('SPREADING_CUTTING_PLAN', docId);
  } catch {
    // Silent fail — dokumen mungkin belum masuk alur approval
    auditTrail.value = null;
  } finally {
    isLoadingApproval.value = false;
  }
};

onMounted(() => {
  fetchDetail();
  fetchApprovalStatus(id.value);
});
</script>

<template>
  <div class="container mx-auto py-8 space-y-8 max-w-7xl">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Spinner class="size-8" />
      <p class="text-neutral-500 animate-pulse text-sm">Memuat dokumen Spreading Plan...</p>
    </div>

    <!-- Detail Content -->
    <div v-else-if="detail" class="space-y-6 animate-fade-in">
      <!-- Header Section -->
      <div class="flex flex-col md:flex-row gap-6 items-center border-b pb-6 border-neutral-200 justify-between">
        <div class="flex items-center gap-4">
          <div class="bg-neutral-100 p-3.5 rounded-2xl border border-neutral-200 shadow-sm">
            <ScissorsIcon class="w-10 h-10 text-neutral-700" />
          </div>
          <div>
            <div class="flex items-center gap-2.5">
              <h1 class="text-2xl font-bold tracking-tight text-neutral-900">{{ detail.no_dokumen }}</h1>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200">
                Spreading & Cutting Plan
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
                <ScissorsIcon class="w-4 h-4 text-neutral-600" />
                Daftar Komponen & Ratio Spreading
              </CardTitle>
            </CardHeader>
            <CardContent class="p-6 space-y-8">
              <div v-if="!detail.components || detail.components.length === 0" class="text-center py-10 text-neutral-400 text-sm">
                Tidak ada data komponen plan.
              </div>
              
              <div v-else v-for="comp in detail.components" :key="comp.id_komponen_spreading" class="space-y-3">
                <div class="flex items-center justify-between border-b pb-2 border-neutral-100">
                  <h3 class="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-2">
                    <span class="inline-block w-1.5 h-3.5 bg-neutral-900 rounded-full"></span>
                    Komponen: {{ comp.nama_komponen }}
                  </h3>
                  <span class="text-[10px] text-neutral-400 font-mono">ID: #{{ comp.id_komponen_spreading }}</span>
                </div>

                <!-- Ratio Table -->
                <div class="overflow-x-auto border border-neutral-150 rounded-lg shadow-xs bg-white">
                  <table class="w-full text-left border-collapse border-spacing-0 text-xs min-w-[1200px]">
                    <thead class="bg-neutral-50/60 border-b border-neutral-200 text-[10px] uppercase font-bold text-neutral-500">
                      <tr>
                        <th class="px-3 py-2.5 w-[3%]">No.</th>
                        <!-- Dynamic size headers -->
                        <th v-for="sizeName in uniqueSizes" :key="sizeName" class="px-3 py-2.5 text-center w-[5%] bg-neutral-50">
                          {{ sizeName }}
                        </th>
                        <th class="px-3 py-2.5 w-[6%]">Total QTY</th>
                        <th class="px-3 py-2.5 w-[6%]">Plan Spreading (Layer)</th>
                        <th class="px-3 py-2.5 w-[6%]">Sisa</th>
                        <th class="px-3 py-2.5 w-[6%]">Lebar Kain</th>
                        <th class="px-3 py-2.5 w-[6%]">Cons</th>
                        <th class="px-3 py-2.5 w-[6%]">Allowance (%)</th>
                        <th class="px-3 py-2.5 w-[6%]">Roll Qty</th>
                        <th class="px-3 py-2.5 w-[6%]">Join Roll</th>
                        <th class="px-3 py-2.5 w-[6%]">Reject (Yd)</th>
                        <th class="px-3 py-2.5 w-[7%]">Cons+Allow (Yds)</th>
                        <th class="px-3 py-2.5 w-[7%]">Total Need (Yd)</th>
                        <th class="px-3 py-2.5 w-[8%]">Ket</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-neutral-150 text-neutral-700 font-mono">
                      <tr v-for="(ratio, ratioIdx) in comp.ratios" :key="ratio.id_ratio_spreading" class="hover:bg-neutral-50/25 transition-colors">
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
                        
                        <!-- Plan Spreading (Layer) -->
                        <td class="px-3 py-3 text-right">{{ ratio.plan_spreading_gelaran }}</td>
                        
                        <!-- Sisa -->
                        <td class="px-3 py-3 text-right bg-neutral-50/20">{{ calculateDetailSisa(comp.ratios, ratioIdx).toLocaleString('id-ID') }}</td>
                        
                        <!-- Lebar Kain -->
                        <td class="px-3 py-3 text-right">{{ ratio.lebar_kain.toFixed(2) }}</td>
                        
                        <!-- Cons -->
                        <td class="px-3 py-3 text-right">{{ ratio.cons.toFixed(3) }}</td>
                        
                        <!-- Allowance -->
                        <td class="px-3 py-3 text-right">{{ ratio.allowance.toFixed(2) }}%</td>
 
                        <!-- Roll Qty -->
                        <td class="px-3 py-3 text-right">{{ ratio.roll_qty }}</td>
 
                        <!-- Join Roll -->
                        <td class="px-3 py-3 text-right">{{ ratio.sambungan_roll }}</td>
 
                        <!-- Reject -->
                        <td class="px-3 py-3 text-right text-red-600">{{ ratio.reject.toFixed(3) }}</td>
                        
                        <!-- Cons+Allow (Yds) -->
                        <td class="px-3 py-3 text-right font-medium text-neutral-900 bg-neutral-50/30">{{ getConsPlusAllow(ratio).toFixed(3) }}</td>
                        
                        <!-- Total Need (Yd) -->
                        <td class="px-3 py-3 text-right font-medium text-neutral-900 bg-neutral-50/30">{{ getTotalNeedPlusAllow(ratio).toFixed(3) }}</td>
                        
                        <!-- Ket -->
                        <td class="px-3 py-3 text-left font-sans truncate max-w-[150px]" :title="ratio.ket">{{ ratio.ket || '—' }}</td>
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
              <div class="flex justify-between items-center py-1 border-b border-neutral-100">
                <span class="text-neutral-400 flex items-center gap-1.5">
                  <HashIcon class="w-3.5 h-3.5" /> ID Plan
                </span>
                <span class="font-mono font-bold text-neutral-900">#{{ detail.id_spreading_cutting_plan }}</span>
              </div>
              <div class="flex justify-between items-center py-1 border-b border-neutral-100">
                <span class="text-neutral-400 flex items-center gap-1.5">
                  <CalendarIcon class="w-3.5 h-3.5" /> Tanggal Dibuat
                </span>
                <span class="font-medium text-neutral-900">{{ formatDate(detail.created_at) }}</span>
              </div>
              <div class="flex justify-between items-center py-1">
                <span class="text-neutral-400 flex items-center gap-1.5">
                  <InfoIcon class="w-3.5 h-3.5" /> Rujukan Work Order
                </span>
                <span class="font-mono font-bold text-neutral-900">WO #{{ detail.id_wo }}</span>
              </div>
            </CardContent>
            </Card>

          <!-- Approval Status Card -->
          <Card class="border border-neutral-200 shadow-sm bg-white">
            <CardHeader class="bg-neutral-50/50 border-b border-neutral-200 pb-4">
              <CardTitle class="text-xs font-bold text-neutral-950 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheckIcon class="w-4 h-4 text-neutral-600" />
                Status Approval
              </CardTitle>
            </CardHeader>
            <CardContent class="pt-5 space-y-4">

              <!-- Loading -->
              <div v-if="isLoadingApproval" class="flex items-center justify-center py-4 gap-2">
                <Loader2Icon class="w-4 h-4 text-neutral-400 animate-spin" />
                <span class="text-xs text-neutral-400">Memuat status...</span>
              </div>

              <!-- No approval data -->
              <div v-else-if="!auditTrail" class="text-center py-4">
                <span class="text-[11px] text-neutral-400">Belum ada data approval untuk dokumen ini.</span>
              </div>

              <!-- Approval status -->
              <div v-else class="space-y-4">
                <!-- Global Status Badge -->
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Status Dokumen</span>
                  <span
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                    :class="approvalStatusClass"
                  >
                    <CheckCircle2Icon v-if="auditTrail.status_global?.toLowerCase() === 'approved'" class="w-3 h-3" />
                    <XCircleIcon v-else-if="auditTrail.status_global?.toLowerCase() === 'rejected'" class="w-3 h-3" />
                    <ClockIcon v-else class="w-3 h-3" />
                    {{ approvalStatusLabel }}
                  </span>
                </div>

                <!-- Steps List -->
                <div class="space-y-2">
                  <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Alur Persetujuan</p>
                  <div
                    v-for="step in auditTrail.steps"
                    :key="step.id_otoritas_detail"
                    class="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0"
                  >
                    <div class="flex items-center gap-2">
                      <div
                        class="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                        :class="step.done ? 'bg-emerald-100 text-emerald-600' : 'bg-neutral-100 text-neutral-400'"
                      >
                        <CheckCircle2Icon v-if="step.done" class="w-3 h-3" />
                        <ClockIcon v-else class="w-3 h-3" />
                      </div>
                      <div>
                        <p class="text-[11px] font-semibold text-neutral-700">{{ step.tipe_peran }}</p>
                        <p class="text-[10px] text-neutral-400 flex items-center gap-1">
                          <UserIcon class="w-2.5 h-2.5" />
                          {{ step.nama_user || 'Belum Ditugaskan' }}
                        </p>
                      </div>
                    </div>
                    <div class="text-right">
                      <span
                        class="text-[9px] font-bold px-1.5 py-0.5 rounded"
                        :class="step.done ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'"
                      >
                        {{ step.done ? 'Selesai' : 'Menunggu' }}
                      </span>
                      <p v-if="step.waktu_aksi" class="text-[9px] text-neutral-400 mt-0.5">
                        {{ formatDate(step.waktu_aksi) }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Link to Approvals page if still pending -->
                <Button
                  v-if="auditTrail.status_global?.toLowerCase() !== 'approved'"
                  variant="outline"
                  size="sm"
                  class="w-full text-[11px] border-neutral-300 shadow-xs h-8"
                  @click="router.navigate({ to: '/approvals' })"
                >
                  <ExternalLinkIcon class="w-3.5 h-3.5 mr-1.5" />
                  Proses di Halaman Approval
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>

    <!-- Error State -->
    <div v-else class="text-center py-20 bg-white border border-neutral-200 rounded-2xl shadow-sm max-w-md mx-auto">
      <InfoIcon class="w-12 h-12 text-red-500 mx-auto mb-3" />
      <h3 class="text-lg font-bold text-neutral-800">Dokumen Tidak Ditemukan</h3>
      <p class="text-neutral-500 text-xs mt-1 px-4">Pastikan ID dokumen Spreading & Cutting Plan yang Anda akses sudah benar.</p>
      <Button @click="router.navigate({ to: '/spreading-cutting-plan' })" class="mt-5 bg-neutral-900 text-white hover:bg-neutral-800">
        Kembali ke Daftar
      </Button>
    </div>
  </div>
</template>
