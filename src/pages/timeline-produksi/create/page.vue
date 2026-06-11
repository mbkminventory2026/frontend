<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from '@tanstack/vue-router';
import { createTimelinePlan } from '@/api/timeline-produksi/timeline-produksi';
import { getProductionLines, getProductionStatusPlans, type ProductionLine, type ProductionStatusPlan } from '@/api/production-master/production-master';
import { getPOClients, getPOClientById, type POClientListItem } from '@/api/po-clients/po-clients';
import { getWorkOrderById, type WorkOrderShell } from '@/api/work-orders/work-orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { ArrowLeftIcon, SaveIcon, CalendarIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

const router = useRouter();
const isLoading = ref(false);
const isLoadingOptions = ref(true);

const poClients = ref<POClientListItem[]>([]);
const productionLines = ref<ProductionLine[]>([]);
const productionStatusPlans = ref<ProductionStatusPlan[]>([]);

const woGroups = ref<{
    idWo: number;
    woLabel: string;
    availableShells: { shell: WorkOrderShell, label: string }[];
    shellPlans: any[];
}[]>([]);

const isLoadingWOs = ref(false);

const form = ref({
    idPoClient: '',
    tanggalDisusun: new Date().toISOString().split('T')[0],
    notes: '',
});


const fetchOptions = async () => {
    try {
        isLoadingOptions.value = true;
        const [poRes, linesRes, statusRes] = await Promise.all([
            getPOClients({ limit: 1000 }),
            getProductionLines(),
            getProductionStatusPlans()
        ]);
        poClients.value = poRes.results;
        productionLines.value = linesRes.results;
        productionStatusPlans.value = statusRes.results;
    } catch (error) {
        console.error("Failed to fetch options", error);
    } finally {
        isLoadingOptions.value = false;
    }
};


watch(() => form.value.idPoClient, async (newVal) => {
    if (!newVal) {
        woGroups.value = [];
        return;
    }
    const parsedPoId = parseInt(newVal, 10);
    if (isNaN(parsedPoId)) return;

    isLoadingWOs.value = true;
    try {
        const poDetail = await getPOClientById(parsedPoId);
        const woIds = Array.from(new Set((poDetail.items || []).map((i: any) => i.id_wo).filter(Boolean))) as number[];
        
        const groups = [];
        for (const woId of woIds) {
            try {
                const woDetail = await getWorkOrderById(woId);
                const fabricShells = (woDetail.shells || []).filter((s: any) => s.material_type?.toLowerCase() === 'fabric');
                
                groups.push({
                    idWo: woId,
                    woLabel: `${woId} - ${woDetail.model} (${woDetail.buyer})`,
                    availableShells: fabricShells.map((s: any) => ({
                        shell: s,
                        label: `${s.id_wo_shell} | ${s.deskripsi} (${s.color})`
                    })),
                    shellPlans: fabricShells.map((s: any) => ({
                        idWoShell: String(s.id_wo_shell),
                        inLine: '',
                        tglGelarCutting: '',
                        statusGelarCutting: '',
                        tglEmbroo: '',
                        statusEmbroo: '',
                        tglLoadingSewing: '',
                        statusLoadingSewing: '',
                        tglFinishingPacking: '',
                        statusFinishingPacking: ''
                    }))
                });
            } catch (e) {
                console.error("Failed to fetch WO", woId);
            }
        }
        woGroups.value = groups;
    } catch (e) {
        console.error("Failed to fetch PO details", e);
    } finally {
        isLoadingWOs.value = false;
    }
});

onMounted(() => {
    fetchOptions();
});

const submitForm = async () => {
    if (!form.value.idPoClient) {
        toast.error('ID PO Client wajib diisi.');
        return;
    }

    isLoading.value = true;
    try {
        const parsedPoId = parseInt(form.value.idPoClient, 10);
        if (isNaN(parsedPoId)) {
            toast.error('PO Client tidak valid.');
            isLoading.value = false;
            return;
        }

        const allShellPlans = woGroups.value.flatMap(g => g.shellPlans);

        if (allShellPlans.length === 0) {
            toast.error('Belum ada WO Shell Plan yang diisi.');
            isLoading.value = false;
            return;
        }

        const selectedShellIds = allShellPlans.map(sp => sp.idWoShell).filter(Boolean);
        const uniqueShellIds = new Set(selectedShellIds);
        if (selectedShellIds.length !== uniqueShellIds.size) {
            toast.error('Terdapat WO Shell Rujukan yang dipilih lebih dari satu kali. Setiap WO Shell hanya boleh memiliki 1 plan.');
            isLoading.value = false;
            return;
        }

        const payload = {
            idPoClient: parsedPoId,
            tanggalDisusun: form.value.tanggalDisusun,
            notes: form.value.notes,
            shellPlans: allShellPlans.map(sp => {
                const parsedShellId = parseInt(sp.idWoShell, 10);
                if (isNaN(parsedShellId)) {
                    throw new Error(`ID WO Shell "${sp.idWoShell}" tidak valid.`);
                }
                return {
                    id_wo_shell: parsedShellId,
                    in_line: sp.inLine,
                tgl_gelar_cutting: sp.tglGelarCutting || undefined,
                status_gelar_cutting: sp.statusGelarCutting || undefined,
                tgl_embroo: sp.tglEmbroo || undefined,
                status_embroo: sp.statusEmbroo || undefined,
                tgl_loading_sewing: sp.tglLoadingSewing || undefined,
                status_loading_sewing: sp.statusLoadingSewing || undefined,
                tgl_finishing_packing: sp.tglFinishingPacking || undefined,
                status_finishing_packing: sp.statusFinishingPacking || undefined
                };
            })
        };
        await createTimelinePlan(payload);
        toast.success('Timeline Produksi berhasil dibuat!');
        router.navigate({ to: '/timeline-produksi' });
    } catch (error: any) {
        const msg = error?.response?.data?.message ?? 'Gagal membuat Timeline Produksi.';
        toast.error(msg);
        console.error("Gagal membuat timeline produksi:", error);
    } finally {
        isLoading.value = false;
    }
};
</script>

<template>
  <div class="container mx-auto py-8 space-y-8 max-w-7xl">
    <!-- Header -->
    <div class="flex items-center gap-4 border-b pb-5 border-neutral-100 justify-between">
      <div class="flex items-center gap-3">
        <div class="bg-neutral-50 border border-neutral-200 p-2.5 rounded-xl shadow-sm animate-fade-in">
          <CalendarIcon class="w-6 h-6 text-neutral-700" />
        </div>
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-neutral-900">Tambah Timeline Produksi</h1>
          <p class="text-[13px] text-neutral-500 mt-1">
            Buat rencana penjadwalan produksi (Cutting, Embro, Sewing, Finishing) untuk setiap WO Shell yang terlibat.
          </p>
        </div>
      </div>
      <Button @click="router.history.back()" variant="outline" class="border-neutral-200">
        <ArrowLeftIcon class="w-4 h-4 mr-2" /> Kembali
      </Button>
    </div>

    <!-- MAIN FORM CARD -->
    <Card class="border border-neutral-200 bg-white p-6 shadow-sm rounded-xl">
      <form @submit.prevent="submitForm" class="space-y-6">
        
        <!-- Header Info Fields -->
        <h2 class="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
          <span class="inline-block w-1.5 h-4 bg-neutral-900 rounded-full"></span>
          Informasi Utama Dokumen
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="space-y-1.5 lg:col-span-1">
            <Label class="text-xs font-semibold text-neutral-700">PO Client <span class="text-red-500">*</span></Label>
            <select v-model="form.idPoClient" required class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition cursor-pointer h-9" :disabled="isLoadingOptions">
              <option value="">Pilih PO Client...</option>
              <option v-for="po in poClients" :key="po.id_po_client" :value="po.id_po_client">
                {{ po.po_number }} - {{ po.mitra_name }}
              </option>
            </select>
          </div>

          <div class="space-y-1.5 lg:col-span-1">
            <Label class="text-xs font-semibold text-neutral-700">Tanggal Disusun <span class="text-red-500">*</span></Label>
            <Input v-model="form.tanggalDisusun" type="date" class="h-9 text-xs border-neutral-200" required />
          </div>

          <div class="space-y-1.5 lg:col-span-3">
            <Label class="text-xs font-semibold text-neutral-700">Notes (Opsional)</Label>
            <Textarea v-model="form.notes" placeholder="Catatan tambahan..." class="min-h-[80px] text-xs border-neutral-200" />
          </div>
        </div>

        <Separator class="bg-neutral-100" />

        <!-- DYNAMIC WO GROUPS SECTION -->
        <div class="space-y-6 pt-2">
          <div class="flex items-center justify-between border-b pb-3 border-neutral-100">
            <h2 class="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
              <span class="inline-block w-1.5 h-4 bg-emerald-600 rounded-full"></span>
              Pengaturan WO Shell Plan
            </h2>
            <div v-if="isLoadingWOs" class="flex items-center text-xs text-neutral-500 gap-2">
              <Spinner class="w-4 h-4" /> Memuat data Work Order...
            </div>
          </div>

          <div v-if="form.idPoClient && !isLoadingWOs && woGroups.length === 0" class="text-center p-6 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-500 text-sm">
            Tidak ada Work Order yang ditemukan untuk PO Client ini.
          </div>

          <!-- WO Groups Loop -->
          <div v-for="group in woGroups" :key="group.idWo" class="border border-neutral-200 rounded-xl bg-white overflow-hidden shadow-sm animate-fade-in">
            <!-- Group Header -->
            <div class="bg-neutral-50 px-5 py-3.5 border-b border-neutral-200 flex justify-between items-center">
              <h3 class="font-bold text-sm text-neutral-800 flex items-center gap-2">
                <span class="p-1 bg-neutral-200 rounded-md text-neutral-600">WO</span>
                {{ group.woLabel }}
              </h3>
            </div>

            <!-- Shell Plans Loop inside Group -->
            <div class="p-5 space-y-6">
              <div v-if="group.availableShells.length === 0" class="text-center p-4 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-500 text-sm">
                Tidak ada WO Shell bertipe Fabric.
              </div>
              <div v-for="(sp, index) in group.shellPlans" :key="index" class="bg-neutral-50/45 border border-neutral-200 rounded-xl p-5 space-y-4">
                
                <h4 class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Plan #{{ index + 1 }}</h4>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-1.5">
                    <Label class="text-xs font-semibold text-neutral-700">WO Shell Rujukan <span class="text-red-500">*</span></Label>
                    <select v-model="sp.idWoShell" required disabled class="w-full rounded-lg border border-neutral-200 bg-neutral-100/70 text-neutral-500 px-3 py-2 text-xs focus:outline-none transition cursor-not-allowed h-9">
                      <option value="">Pilih WO Shell...</option>
                      <option v-for="s in group.availableShells" :key="s.shell.id_wo_shell" :value="s.shell.id_wo_shell">
                        {{ s.shell.id_wo_shell }} | {{ s.shell.deskripsi }} ({{ s.shell.color }})
                      </option>
                    </select>
                  </div>

                  <div class="space-y-1.5">
                    <Label class="text-xs font-semibold text-neutral-700">In Line <span class="text-red-500">*</span></Label>
                    <select v-model="sp.inLine" required class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition cursor-pointer h-9">
                      <option value="">Pilih Line...</option>
                      <option v-for="l in productionLines" :key="l.id_production_line" :value="l.name">
                        {{ l.name }}
                      </option>
                    </select>
                  </div>
                </div>

            <!-- Rencana Tanggal & Status Pengerjaan -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
              <div class="space-y-1.5 p-3 bg-neutral-100/50 rounded-lg border border-neutral-200">
                <Label class="text-[10px] font-bold text-neutral-600 uppercase">Gelar Cutting</Label>
                <div class="space-y-2 mt-2">
                  <Input v-model="sp.tglGelarCutting" type="date" class="h-8 text-[11px] border-neutral-200 bg-white" title="Tanggal Rencana" />
                  <select v-model="sp.statusGelarCutting" class="w-full rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition cursor-pointer h-8">
                    <option value="">Status...</option>
                    <option v-for="s in productionStatusPlans" :key="s.id_production_status_plan" :value="s.name">{{ s.name }}</option>
                  </select>
                </div>
              </div>
              <div class="space-y-1.5 p-3 bg-neutral-100/50 rounded-lg border border-neutral-200">
                <Label class="text-[10px] font-bold text-neutral-600 uppercase">Embro</Label>
                <div class="space-y-2 mt-2">
                  <Input v-model="sp.tglEmbroo" type="date" class="h-8 text-[11px] border-neutral-200 bg-white" title="Tanggal Rencana" />
                  <select v-model="sp.statusEmbroo" class="w-full rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition cursor-pointer h-8">
                    <option value="">Status...</option>
                    <option v-for="s in productionStatusPlans" :key="s.id_production_status_plan" :value="s.name">{{ s.name }}</option>
                  </select>
                </div>
              </div>
              <div class="space-y-1.5 p-3 bg-neutral-100/50 rounded-lg border border-neutral-200">
                <Label class="text-[10px] font-bold text-neutral-600 uppercase">Loading Sewing</Label>
                <div class="space-y-2 mt-2">
                  <Input v-model="sp.tglLoadingSewing" type="date" class="h-8 text-[11px] border-neutral-200 bg-white" title="Tanggal Rencana" />
                  <select v-model="sp.statusLoadingSewing" class="w-full rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition cursor-pointer h-8">
                    <option value="">Status...</option>
                    <option v-for="s in productionStatusPlans" :key="s.id_production_status_plan" :value="s.name">{{ s.name }}</option>
                  </select>
                </div>
              </div>
              <div class="space-y-1.5 p-3 bg-neutral-100/50 rounded-lg border border-neutral-200">
                <Label class="text-[10px] font-bold text-neutral-600 uppercase">Finishing</Label>
                <div class="space-y-2 mt-2">
                  <Input v-model="sp.tglFinishingPacking" type="date" class="h-8 text-[11px] border-neutral-200 bg-white" title="Tanggal Rencana" />
                  <select v-model="sp.statusFinishingPacking" class="w-full rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400 transition cursor-pointer h-8">
                    <option value="">Status...</option>
                    <option v-for="s in productionStatusPlans" :key="s.id_production_status_plan" :value="s.name">{{ s.name }}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
        </div>



        <!-- Form Submission Button -->
        <div class="flex justify-end pt-4 border-t border-neutral-100 gap-3">
          <Button
            type="button"
            variant="outline"
            @click="router.history.back()"
            :disabled="isLoading"
            class="border-neutral-200 text-neutral-600"
          >
            Batal
          </Button>
          <Button
            type="submit"
            :disabled="isLoading"
            class="bg-neutral-900 hover:bg-neutral-800 text-white font-medium transition-all shadow-sm"
          >
            <Spinner v-if="isLoading" class="w-4 h-4 mr-2" />
            <SaveIcon v-else class="w-4 h-4 mr-2" />
            {{ isLoading ? 'Menyimpan...' : 'Simpan Timeline Produksi' }}
          </Button>
        </div>
      </form>
    </Card>
  </div>
</template>
