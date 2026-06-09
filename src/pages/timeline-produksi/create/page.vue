<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from '@tanstack/vue-router';
import { createTimelinePlan } from '@/api/timeline-produksi/timeline-produksi';
import { getPOClients, type POClientListItem } from '@/api/po-clients/po-clients';
import { getWorkOrders, getWorkOrderById, type WorkOrderShell } from '@/api/work-orders/work-orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { PlusIcon, Trash2Icon, ArrowLeftIcon, SaveIcon, CalendarIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

const router = useRouter();
const isLoading = ref(false);
const isLoadingOptions = ref(true);

const poClients = ref<POClientListItem[]>([]);
const availableShells = ref<{ wo: string, shell: WorkOrderShell }[]>([]);

const form = ref({
    idPoClient: '',
    tanggalDisusun: new Date().toISOString().split('T')[0],
    notes: '',
    shellPlans: [
        {
            idWoShell: '',
            inLine: '',
            tglGelarCutting: '',
            statusGelarCutting: '',
            tglEmbroo: '',
            statusEmbroo: '',
            tglLoadingSewing: '',
            statusLoadingSewing: '',
            tglFinishingPacking: '',
            statusFinishingPacking: ''
        }
    ]
});

const addShellPlan = () => {
    form.value.shellPlans.push({
        idWoShell: '',
        inLine: '',
        tglGelarCutting: '',
        statusGelarCutting: '',
        tglEmbroo: '',
        statusEmbroo: '',
        tglLoadingSewing: '',
        statusLoadingSewing: '',
        tglFinishingPacking: '',
        statusFinishingPacking: ''
    });
};

const removeShellPlan = (index: number) => {
    if (form.value.shellPlans.length > 1) {
        form.value.shellPlans.splice(index, 1);
    } else {
        toast.error('Minimal harus ada satu WO Shell Plan.');
    }
};

const fetchOptions = async () => {
    try {
        isLoadingOptions.value = true;
        // Fetch PO Clients
        const poRes = await getPOClients({ limit: 1000 });
        poClients.value = poRes.results;

        // Fetch Work Orders and then their details to get Shells
        const woRes = await getWorkOrders({ limit: 100 });
        const shells: { wo: string, shell: WorkOrderShell }[] = [];
        for (const wo of woRes.results) {
            try {
                const detail = await getWorkOrderById(wo.id_wo);
                if (detail && detail.shells) {
                    for (const sh of detail.shells) {
                        shells.push({ wo: `${wo.id_wo} - ${wo.model}`, shell: sh });
                    }
                }
            } catch (e) {
                // ignore detail fetch error
            }
        }
        availableShells.value = shells;
    } catch (error) {
        console.error("Failed to fetch options", error);
    } finally {
        isLoadingOptions.value = false;
    }
};

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

        const payload = {
            idPoClient: parsedPoId,
            tanggalDisusun: form.value.tanggalDisusun,
            notes: form.value.notes,
            shellPlans: form.value.shellPlans.map(sp => {
                const parsedShellId = parseInt(sp.idWoShell, 10);
                if (isNaN(parsedShellId)) {
                    throw new Error(`ID WO Shell "${sp.idWoShell}" tidak valid.`);
                }
                return {
                    idWoShell: parsedShellId,
                    inLine: sp.inLine,
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
            <Input list="po-clients-list" type="text" v-model="form.idPoClient" required placeholder="Ketik atau pilih PO Client..." class="h-9 text-xs border-neutral-200" :disabled="isLoadingOptions" />
            <datalist id="po-clients-list">
                <option v-for="po in poClients" :key="po.id_po_client" :value="po.id_po_client + ' - ' + po.po_number + ' - ' + po.mitra_name" />
            </datalist>
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

        <!-- DYNAMIC WO SHELL PLANS SECTION -->
        <div class="space-y-6 pt-2">
          <div class="flex items-center justify-between border-b pb-3 border-neutral-100">
            <h2 class="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
              <span class="inline-block w-1.5 h-4 bg-emerald-600 rounded-full"></span>
              Pengaturan WO Shell Plan
            </h2>
            <Button type="button" @click="addShellPlan" size="sm" variant="outline" class="h-8 border-dashed border-neutral-300 text-neutral-700 hover:bg-neutral-50">
              <PlusIcon class="w-3.5 h-3.5 mr-1" /> Tambah WO Shell Plan
            </Button>
          </div>

          <!-- Shell Plans Loop -->
          <div v-for="(sp, index) in form.shellPlans" :key="index" class="bg-neutral-50/45 border border-neutral-200 rounded-xl p-5 space-y-4 shadow-sm relative animate-fade-in">
            <!-- Delete Button -->
            <button
              v-if="form.shellPlans.length > 1"
              type="button"
              @click="removeShellPlan(index)"
              class="absolute top-4 right-4 text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
              title="Hapus Shell Plan"
            >
              <Trash2Icon class="w-4 h-4" />
            </button>

            <h3 class="text-xs font-bold text-neutral-500 uppercase tracking-wider">Shell Plan #{{ index + 1 }}</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-1.5">
                <Label class="text-xs font-semibold text-neutral-700">WO Shell Rujukan <span class="text-red-500">*</span></Label>
                <Input list="wo-shells-list" type="text" v-model="sp.idWoShell" required placeholder="Ketik atau pilih WO Shell..." class="h-9 text-xs border-neutral-200 bg-white" :disabled="isLoadingOptions" />
                <datalist id="wo-shells-list">
                    <option v-for="s in availableShells" :key="s.shell.id_wo_shell" :value="s.shell.id_wo_shell + ' - WO: ' + s.wo + ' | ' + s.shell.deskripsi + ' (' + s.shell.color + ')'" />
                </datalist>
              </div>

              <div class="space-y-1.5">
                <Label class="text-xs font-semibold text-neutral-700">In Line <span class="text-red-500">*</span></Label>
                <Input v-model="sp.inLine" type="text" placeholder="cth: Line 1" class="h-9 text-xs border-neutral-200 bg-white" required />
              </div>
            </div>

            <!-- Rencana Tanggal & Status Pengerjaan -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
              <div class="space-y-1.5 p-3 bg-neutral-100/50 rounded-lg border border-neutral-200">
                <Label class="text-[10px] font-bold text-neutral-600 uppercase">Gelar Cutting</Label>
                <div class="space-y-2 mt-2">
                  <Input v-model="sp.tglGelarCutting" type="date" class="h-8 text-[11px] border-neutral-200 bg-white" title="Tanggal Rencana" />
                  <Input v-model="sp.statusGelarCutting" type="text" placeholder="Status..." class="h-8 text-[11px] border-neutral-200 bg-white" />
                </div>
              </div>
              <div class="space-y-1.5 p-3 bg-neutral-100/50 rounded-lg border border-neutral-200">
                <Label class="text-[10px] font-bold text-neutral-600 uppercase">Embro</Label>
                <div class="space-y-2 mt-2">
                  <Input v-model="sp.tglEmbroo" type="date" class="h-8 text-[11px] border-neutral-200 bg-white" title="Tanggal Rencana" />
                  <Input v-model="sp.statusEmbroo" type="text" placeholder="Status..." class="h-8 text-[11px] border-neutral-200 bg-white" />
                </div>
              </div>
              <div class="space-y-1.5 p-3 bg-neutral-100/50 rounded-lg border border-neutral-200">
                <Label class="text-[10px] font-bold text-neutral-600 uppercase">Loading Sewing</Label>
                <div class="space-y-2 mt-2">
                  <Input v-model="sp.tglLoadingSewing" type="date" class="h-8 text-[11px] border-neutral-200 bg-white" title="Tanggal Rencana" />
                  <Input v-model="sp.statusLoadingSewing" type="text" placeholder="Status..." class="h-8 text-[11px] border-neutral-200 bg-white" />
                </div>
              </div>
              <div class="space-y-1.5 p-3 bg-neutral-100/50 rounded-lg border border-neutral-200">
                <Label class="text-[10px] font-bold text-neutral-600 uppercase">Finishing</Label>
                <div class="space-y-2 mt-2">
                  <Input v-model="sp.tglFinishingPacking" type="date" class="h-8 text-[11px] border-neutral-200 bg-white" title="Tanggal Rencana" />
                  <Input v-model="sp.statusFinishingPacking" type="text" placeholder="Status..." class="h-8 text-[11px] border-neutral-200 bg-white" />
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
