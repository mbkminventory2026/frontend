<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useParams, useRouter } from '@tanstack/vue-router';
import { getTimelinePlanById, updateWOShellPlanStatus } from '@/api/timeline-produksi/timeline-produksi';
import { getProductionStatusPlans, type ProductionStatusPlan, getProductionLines, type ProductionLine } from '@/api/production-master/production-master';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { CalendarIcon, HashIcon, InfoIcon, ArrowLeftIcon, Layers2Icon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { formatDate } from '@/lib/formatter';

const router = useRouter();
const params = useParams({ from: '/_authenticated/timeline-produksi/$id' });
const id = computed(() => params.value.id);

const timelinePlan = ref<any>(null);
const isLoading = ref(true);
const isSaving = ref(false);
const productionStatusPlans = ref<ProductionStatusPlan[]>([]);
const productionLines = ref<ProductionLine[]>([]);

const fetchDetail = async () => {
    isLoading.value = true;
    try {
        const data = await getTimelinePlanById(id.value);
        timelinePlan.value = data;
    } catch (error) {
        console.error("Gagal mengambil detail timeline:", error);
        toast.error("Gagal memuat detail Timeline Produksi.");
    } finally {
        isLoading.value = false;
    }
};

const updateStatus = async (shellPlan: any) => {
    isSaving.value = true;
    try {
        await updateWOShellPlanStatus(shellPlan.id_wo_shell_plan, {
            inLine: shellPlan.in_line,
            statusGelarCutting: shellPlan.status_gelar_cutting,
            statusEmbroo: shellPlan.status_embroo,
            statusLoadingSewing: shellPlan.status_loading_sewing,
            statusFinishingPacking: shellPlan.status_finishing_packing,
        });
        toast.success("Status berhasil diupdate!");
    } catch (error) {
        console.error("Gagal update status:", error);
        toast.error("Gagal memperbarui status.");
        await fetchDetail(); // rollback if error
    } finally {
        isSaving.value = false;
    }
};

const fetchStatuses = async () => {
    try {
        const res = await getProductionStatusPlans();
        productionStatusPlans.value = res.results;
    } catch (e) {
        console.error("Failed to fetch production status plans", e);
    }
};

const fetchLines = async () => {
    try {
        const res = await getProductionLines();
        productionLines.value = res.results;
    } catch (e) {
        console.error("Failed to fetch production lines", e);
    }
};

onMounted(() => {
    fetchDetail();
    fetchStatuses();
    fetchLines();
});
</script>

<template>
  <div class="container mx-auto py-8 space-y-8 max-w-7xl">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Spinner class="size-8" />
      <p class="text-neutral-500 animate-pulse text-sm">Memuat dokumen Timeline Produksi...</p>
    </div>

    <!-- Detail Content -->
    <div v-else-if="timelinePlan" class="space-y-6 animate-fade-in">
      <!-- Header Section -->
      <div class="flex flex-col md:flex-row gap-6 items-center border-b pb-6 border-neutral-200 justify-between">
        <div class="flex items-center gap-4">
          <div class="bg-neutral-100 p-3.5 rounded-2xl border border-neutral-200 shadow-sm">
            <CalendarIcon class="w-10 h-10 text-neutral-700" />
          </div>
          <div>
            <div class="flex items-center gap-2.5">
              <h1 class="text-2xl font-bold tracking-tight text-neutral-900">Timeline #{{ timelinePlan.id_timeline }}</h1>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200">
                Timeline Produksi
              </span>
            </div>
            <p class="text-sm text-neutral-500 mt-1">
              Tanggal Disusun: {{ formatDate(timelinePlan.tanggal_disusun) }}
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
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        <!-- Left Side: Main WO Shell Plans Table -->
        <div class="lg:col-span-3 space-y-6">
          <Card class="overflow-hidden border border-neutral-200 shadow-sm bg-white">
            <CardHeader class="bg-neutral-50/50 border-b border-neutral-200 pb-4 flex flex-row items-center justify-between">
              <CardTitle class="text-sm font-bold flex items-center gap-2 text-neutral-900 uppercase tracking-wider">
                <Layers2Icon class="w-4 h-4 text-neutral-600" />
                Status Pengerjaan WO Shell
              </CardTitle>
              <div v-if="isSaving" class="flex items-center text-xs text-neutral-500 gap-2">
                <Spinner class="w-3.5 h-3.5" /> Menyimpan perubahan...
              </div>
            </CardHeader>
            
            <CardContent class="p-0">
              <div v-if="!timelinePlan.shell_plans || timelinePlan.shell_plans.length === 0" class="text-center py-10 text-neutral-400 text-sm">
                Tidak ada data WO Shell Plan.
              </div>
              
              <div v-else class="overflow-x-auto w-full">
                <table class="w-full text-left border-collapse text-xs min-w-[1000px]">
                  <thead class="bg-neutral-50 border-b border-neutral-200 text-[10px] uppercase font-bold text-neutral-500">
                    <tr>
                      <th class="px-4 py-3 w-[5%]">ID</th>
                      <th class="px-4 py-3 w-[15%]">Fabric & Color</th>
                      <th class="px-4 py-3 w-[10%]">In Line</th>
                      <th class="px-4 py-3 w-[15%]">Gelar Cutting</th>
                      <th class="px-4 py-3 w-[15%]">Embro</th>
                      <th class="px-4 py-3 w-[15%]">Loading Sewing</th>
                      <th class="px-4 py-3 w-[15%]">Finishing/Packing</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-neutral-150 text-neutral-800">
                    <tr v-for="sp in timelinePlan.shell_plans" :key="sp.id_wo_shell_plan" class="hover:bg-neutral-50/30 transition-colors">
                      <td class="px-4 py-4 font-mono text-neutral-500">#{{ sp.id_wo_shell_plan }}</td>
                      <td class="px-4 py-4">
                        <div class="font-semibold text-neutral-900">{{ sp.deskripsi }}</div>
                        <div class="text-neutral-500">{{ sp.color }}</div>
                        <div class="text-[10px] text-neutral-400 mt-1">WO ID: {{ sp.id_wo_shell }}</div>
                      </td>
                      <td class="px-4 py-4">
                        <select v-model="sp.in_line" @change="updateStatus(sp)" :disabled="isSaving" class="w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition cursor-pointer shadow-xs h-8">
                          <option value="">Pilih line...</option>
                          <option v-for="l in productionLines" :key="l.id_production_line" :value="l.name">{{ l.name }}</option>
                        </select>
                      </td>
                      
                      <!-- Status Gelar Cutting -->
                      <td class="px-4 py-4">
                        <div class="space-y-1">
                          <select v-model="sp.status_gelar_cutting" @change="updateStatus(sp)" :disabled="isSaving" class="w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition cursor-pointer shadow-xs h-8">
                            <option value="">Pilih status...</option>
                            <option v-for="s in productionStatusPlans" :key="s.id_production_status_plan" :value="s.name">{{ s.name }}</option>
                          </select>
                          <div class="text-[10px] text-neutral-400 flex justify-end" v-if="sp.tgl_gelar_cutting">{{ formatDate(sp.tgl_gelar_cutting) }}</div>
                        </div>
                      </td>
                      
                      <!-- Status Embro -->
                      <td class="px-4 py-4">
                        <div class="space-y-1">
                          <select v-model="sp.status_embroo" @change="updateStatus(sp)" :disabled="isSaving" class="w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition cursor-pointer shadow-xs h-8">
                            <option value="">Pilih status...</option>
                            <option v-for="s in productionStatusPlans" :key="s.id_production_status_plan" :value="s.name">{{ s.name }}</option>
                          </select>
                          <div class="text-[10px] text-neutral-400 flex justify-end" v-if="sp.tgl_embroo">{{ formatDate(sp.tgl_embroo) }}</div>
                        </div>
                      </td>

                      <!-- Status Loading Sewing -->
                      <td class="px-4 py-4">
                        <div class="space-y-1">
                          <select v-model="sp.status_loading_sewing" @change="updateStatus(sp)" :disabled="isSaving" class="w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition cursor-pointer shadow-xs h-8">
                            <option value="">Pilih status...</option>
                            <option v-for="s in productionStatusPlans" :key="s.id_production_status_plan" :value="s.name">{{ s.name }}</option>
                          </select>
                          <div class="text-[10px] text-neutral-400 flex justify-end" v-if="sp.tgl_loading_sewing">{{ formatDate(sp.tgl_loading_sewing) }}</div>
                        </div>
                      </td>

                      <!-- Status Finishing Packing -->
                      <td class="px-4 py-4">
                        <div class="space-y-1">
                          <select v-model="sp.status_finishing_packing" @change="updateStatus(sp)" :disabled="isSaving" class="w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition cursor-pointer shadow-xs h-8">
                            <option value="">Pilih status...</option>
                            <option v-for="s in productionStatusPlans" :key="s.id_production_status_plan" :value="s.name">{{ s.name }}</option>
                          </select>
                          <div class="text-[10px] text-neutral-400 flex justify-end" v-if="sp.tgl_finishing_packing">{{ formatDate(sp.tgl_finishing_packing) }}</div>
                        </div>
                      </td>

                    </tr>
                  </tbody>
                </table>

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
                  <HashIcon class="w-3.5 h-3.5 text-neutral-400" /> Timeline ID
                </span>
                <span class="font-mono font-bold text-neutral-900">#{{ timelinePlan.id_timeline }}</span>
              </div>
              <Separator class="bg-neutral-100" />
              <div class="flex items-center justify-between">
                <span class="text-neutral-500 flex items-center gap-1.5">
                  <InfoIcon class="w-3.5 h-3.5 text-neutral-400" /> PO Client
                </span>
                <span class="font-mono font-bold text-neutral-900">ID: {{ timelinePlan.id_po_client }}</span>
              </div>
              <Separator class="bg-neutral-100" />
              <div class="flex items-center justify-between">
                <span class="text-neutral-500 flex items-center gap-1.5">
                  <CalendarIcon class="w-3.5 h-3.5 text-neutral-400" /> Disusun
                </span>
                <span class="font-medium text-neutral-900">{{ formatDate(timelinePlan.tanggal_disusun) }}</span>
              </div>
              <Separator class="bg-neutral-100" />
              <div class="space-y-2">
                <span class="text-neutral-500 flex items-center gap-1.5 mb-1.5">
                  <InfoIcon class="w-3.5 h-3.5 text-neutral-400" /> Notes
                </span>
                <div class="bg-neutral-50 p-3 rounded-md border border-neutral-100 text-neutral-600 leading-relaxed min-h-[60px]">
                  {{ timelinePlan.notes || 'Tidak ada catatan.' }}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>

    <!-- Error State -->
    <div v-else class="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
      <div class="bg-neutral-100 p-4 rounded-full border border-neutral-200">
        <CalendarIcon class="w-12 h-12 text-neutral-400" />
      </div>
      <h2 class="text-2xl font-bold text-neutral-900">Timeline Produksi Tidak Ditemukan</h2>
      <p class="text-neutral-500">Maaf, data Timeline yang Anda cari tidak tersedia.</p>
      <Button @click="router.navigate({ to: '/timeline-produksi' })" class="bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm border border-neutral-800">
        Kembali ke Daftar Timeline
      </Button>
    </div>
  </div>
</template>
