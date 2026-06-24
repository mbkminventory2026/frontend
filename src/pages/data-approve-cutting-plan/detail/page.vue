<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useParams, useRouter } from '@tanstack/vue-router';
import {
  ArrowLeftIcon,
  ClipboardCheckIcon,
  CalendarIcon,
  HashIcon,
  UserIcon,
  InfoIcon,
  CheckCircle2Icon,
  XCircleIcon,
  Loader2Icon,
  MessageSquareIcon,
  FileTextIcon
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import {
  getDataApproveCuttingPlanById,
  type DataApproveCuttingPlanDetail,
  type DataApproveCuttingPlanRow
} from '@/api/data-approve-cutting/data-approve-cutting';
import {
  getDocumentAuditTrail,
  submitApprovalAction,
  type DocumentAuditTrail
} from '@/api/approvals/approvals';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { formatDate } from '@/lib/formatter';

const router = useRouter();
const params = useParams({ from: '/_authenticated/data-approve-cutting-plan/$id' });
const docId = computed(() => params.value.id);

// ── Document state ─────────────────────────────────────────────
const isLoading = ref(false);
const detail = ref<DataApproveCuttingPlanDetail | null>(null);

// ── Approval state ─────────────────────────────────────────────
const auditTrail = ref<DocumentAuditTrail | null>(null);
const isLoadingAudit = ref(false);
const isSubmitting = ref(false);
const approvalNote = ref('');
const showApprovalForm = ref(false);

// ── Computed totals ─────────────────────────────────────────────
const rows = computed<DataApproveCuttingPlanRow[]>(() => detail.value?.rows ?? []);
const totalQtyOrder = computed(() => rows.value.reduce((s, r) => s + r.qty_order, 0));
const totalCuttingPlan = computed(() => rows.value.reduce((s, r) => s + Number(r.qty_cutting_plan), 0));
const totalCuttingActual = computed(() => rows.value.reduce((s, r) => s + Number(r.qty_cutting_actual), 0));
const totalCuttingReport = computed(() => rows.value.reduce((s, r) => s + Number(r.cutting_report), 0));
const totalBalance = computed(() => rows.value.reduce((s, r) => s + Number(r.balance_allowance), 0));

// ── Pending step detection ──────────────────────────────────────
const pendingStep = computed(() => {
  if (!auditTrail.value?.steps) return null;
  return auditTrail.value.steps.find(s => !s.done) ?? null;
});

// ── Fetch ───────────────────────────────────────────────────────
const fetchDetail = async () => {
  isLoading.value = true;
  try {
    detail.value = await getDataApproveCuttingPlanById(docId.value);
  } catch (e) {
    toast.error('Gagal memuat Data Approve Cutting Plan.');
  } finally {
    isLoading.value = false;
  }
};

const fetchAuditTrail = async () => {
  if (!docId.value) return;
  isLoadingAudit.value = true;
  try {
    auditTrail.value = await getDocumentAuditTrail('DATA_APPROVE_CUTTING_PLAN', Number(docId.value));
  } catch (e) {
    console.warn('Gagal memuat audit trail:', e);
  } finally {
    isLoadingAudit.value = false;
  }
};

// ── Approval action ─────────────────────────────────────────────
const handleAction = async (action: 'approve' | 'reject') => {
  if (!pendingStep.value) return;
  if (action === 'reject' && !approvalNote.value.trim()) {
    toast.error('Catatan wajib diisi jika menolak dokumen.');
    return;
  }
  isSubmitting.value = true;
  try {
    await submitApprovalAction({
      id_otoritas_detail: pendingStep.value.id_otoritas_detail,
      action,
      catatan: approvalNote.value.trim()
    });
    toast.success(action === 'approve' ? 'Dokumen berhasil disetujui!' : 'Dokumen berhasil ditolak.');
    approvalNote.value = '';
    showApprovalForm.value = false;
    await fetchAuditTrail();
  } catch (err: any) {
    toast.error(err?.response?.data?.message || `Gagal memproses aksi ${action}.`);
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  fetchDetail();
  fetchAuditTrail();
});
</script>

<template>
  <div class="container mx-auto py-8 space-y-8 max-w-7xl">

    <!-- Loading -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Spinner class="size-8" />
      <p class="text-neutral-500 animate-pulse text-sm">Memuat dokumen...</p>
    </div>

    <!-- Detail -->
    <div v-else-if="detail" class="space-y-6">

      <!-- Header -->
      <div class="flex flex-col md:flex-row items-start md:items-center gap-4 border-b pb-5 border-neutral-200 justify-between">
        <div class="flex items-center gap-4">
          <div class="bg-neutral-100 p-3.5 rounded-2xl border border-neutral-200 shadow-sm">
            <ClipboardCheckIcon class="w-9 h-9 text-neutral-700" />
          </div>
          <div>
            <div class="flex items-center gap-2.5 flex-wrap">
              <h1 class="text-2xl font-bold tracking-tight text-neutral-900">{{ detail.no_dokumen }}</h1>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200">
                Data Approve Cutting Plan
              </span>
            </div>
            <p class="text-sm text-neutral-500 mt-1">
              {{ detail.buyer }} · {{ detail.model }}
              <span v-if="detail.style" class="ml-2 text-neutral-400">Style: {{ detail.style }}</span>
            </p>
          </div>
        </div>
        <Button @click="router.history.back()" variant="outline" class="border-neutral-300 shrink-0">
          <ArrowLeftIcon class="w-4 h-4 mr-2" /> Kembali
        </Button>
      </div>

      <!-- 2 column layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- LEFT: Main Table -->
        <div class="lg:col-span-2 space-y-4">
          <Card class="overflow-hidden border border-neutral-200 shadow-sm bg-white">
            <CardHeader class="bg-neutral-50/60 border-b border-neutral-200 pb-4">
              <CardTitle class="text-sm font-bold flex items-center gap-2 text-neutral-900 uppercase tracking-wider">
                <ClipboardCheckIcon class="w-4 h-4 text-neutral-600" />
                Tabel Approve Cutting Plan
              </CardTitle>
            </CardHeader>
            <CardContent class="p-0">
              <!-- Excel-like table -->
              <div class="overflow-x-auto">
                <table class="w-full text-xs border-collapse">
                  <thead>
                    <tr class="bg-neutral-900 text-white text-[11px] font-bold uppercase tracking-wider">
                      <th class="px-4 py-3 text-left border-r border-neutral-700">SIZE</th>
                      <th class="px-4 py-3 text-center border-r border-neutral-700">QTY ORDER</th>
                      <th class="px-4 py-3 text-center border-r border-neutral-700">QTY CUTTING PLAN</th>
                      <th class="px-4 py-3 text-center border-r border-neutral-700">QTY CUTTING ACTUAL</th>
                      <th class="px-4 py-3 text-center border-r border-neutral-700">CUTTING REPORT</th>
                      <th class="px-4 py-3 text-center">BALANCE ALLOWANCE</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-neutral-100">
                    <!-- Data rows -->
                    <tr
                      v-for="(row, idx) in rows"
                      :key="row.size"
                      class="hover:bg-blue-50/20 transition-colors"
                      :class="idx % 2 === 1 ? 'bg-neutral-50/40' : 'bg-white'"
                    >
                      <td class="px-4 py-3 font-bold text-neutral-800 border-r border-neutral-100">{{ row.size }}</td>
                      <td class="px-4 py-3 text-center font-mono text-neutral-700 border-r border-neutral-100">
                        {{ row.qty_order.toLocaleString('id-ID') }}
                      </td>
                      <td class="px-4 py-3 text-center font-mono text-neutral-700 border-r border-neutral-100">
                        {{ Number(row.qty_cutting_plan).toLocaleString('id-ID') }}
                      </td>
                      <td class="px-4 py-3 text-center font-mono text-neutral-700 border-r border-neutral-100">
                        {{ Number(row.qty_cutting_actual).toLocaleString('id-ID') }}
                      </td>
                      <td class="px-4 py-3 text-center font-mono text-neutral-700 border-r border-neutral-100">
                        {{ Number(row.cutting_report).toLocaleString('id-ID') }}
                      </td>
                      <td
                        class="px-4 py-3 text-center font-mono font-semibold border-neutral-100"
                        :class="Number(row.balance_allowance) < 0 ? 'text-red-600' : 'text-emerald-700'"
                      >
                        {{ Number(row.balance_allowance).toLocaleString('id-ID') }}
                      </td>
                    </tr>

                    <!-- Empty state -->
                    <tr v-if="rows.length === 0">
                      <td colspan="6" class="px-4 py-10 text-center text-neutral-400 text-xs">
                        Tidak ada data ukuran untuk Work Order ini.
                      </td>
                    </tr>
                  </tbody>

                  <!-- TOTAL row -->
                  <tfoot v-if="rows.length > 0">
                    <tr class="bg-neutral-900 text-white font-bold text-xs">
                      <td class="px-4 py-3 border-r border-neutral-700">TOTAL</td>
                      <td class="px-4 py-3 text-center font-mono border-r border-neutral-700">
                        {{ totalQtyOrder.toLocaleString('id-ID') }}
                      </td>
                      <td class="px-4 py-3 text-center font-mono border-r border-neutral-700">
                        {{ totalCuttingPlan.toLocaleString('id-ID') }}
                      </td>
                      <td class="px-4 py-3 text-center font-mono border-r border-neutral-700">
                        {{ totalCuttingActual.toLocaleString('id-ID') }}
                      </td>
                      <td class="px-4 py-3 text-center font-mono border-r border-neutral-700">
                        {{ totalCuttingReport.toLocaleString('id-ID') }}
                      </td>
                      <td class="px-4 py-3 text-center font-mono" :class="totalBalance < 0 ? 'text-red-300' : 'text-emerald-300'">
                        {{ totalBalance.toLocaleString('id-ID') }}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          <!-- Approval Trail Card -->
          <Card class="border border-neutral-200 shadow-sm bg-white overflow-hidden">
            <CardHeader class="bg-neutral-50/60 border-b border-neutral-200 pb-4">
              <CardTitle class="text-sm font-bold flex items-center gap-2 text-neutral-900 uppercase tracking-wider">
                <CheckCircle2Icon class="w-4 h-4 text-neutral-600" />
                Alur Persetujuan
              </CardTitle>
            </CardHeader>
            <CardContent class="p-5 space-y-4">
              <!-- Loading audit -->
              <div v-if="isLoadingAudit" class="flex items-center gap-2 py-4 justify-center">
                <Loader2Icon class="w-5 h-5 animate-spin text-neutral-400" />
                <span class="text-xs text-neutral-500">Memuat alur persetujuan...</span>
              </div>

              <div v-else-if="auditTrail?.steps && auditTrail.steps.length > 0" class="space-y-3">
                <div
                  v-for="step in auditTrail.steps"
                  :key="step.id_otoritas_detail"
                  class="p-4 border rounded-xl transition-colors"
                  :class="[
                    !step.done && pendingStep?.id_otoritas_detail === step.id_otoritas_detail
                      ? 'border-blue-300 bg-blue-50/20'
                      : 'border-neutral-200/60 bg-white'
                  ]"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-xs font-bold uppercase tracking-wider text-neutral-800">{{ step.tipe_peran }}</span>
                        <span
                          v-if="!step.done && pendingStep?.id_otoritas_detail === step.id_otoritas_detail"
                          class="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-sm"
                        >
                          Menunggu Tindakan
                        </span>
                      </div>
                      <p class="text-xs text-neutral-500 mt-1.5 flex items-center gap-1">
                        <UserIcon class="w-3.5 h-3.5 opacity-60" />
                        {{ step.nama_user || 'Belum Ditugaskan' }}
                      </p>
                    </div>
                    <div class="text-right flex flex-col items-end gap-1">
                      <span
                        class="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                        :class="step.done
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-neutral-100 text-neutral-500 border-neutral-200'"
                      >
                        {{ step.done ? 'Disetujui' : 'Menunggu' }}
                      </span>
                      <span v-if="step.waktu_aksi" class="text-[9px] text-neutral-400">
                        {{ formatDate(step.waktu_aksi) }}
                      </span>
                    </div>
                  </div>
                  <div
                    v-if="step.catatan"
                    class="mt-3 text-xs text-neutral-600 bg-neutral-50/60 p-2.5 rounded-lg border border-neutral-100 flex items-start gap-1.5"
                  >
                    <MessageSquareIcon class="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" />
                    <span class="italic">"{{ step.catatan }}"</span>
                  </div>
                </div>

                <!-- Action buttons for pending step -->
                <div v-if="pendingStep" class="pt-3 border-t border-neutral-100 space-y-3">
                  <button
                    class="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                    type="button"
                    @click="showApprovalForm = !showApprovalForm"
                  >
                    <CheckCircle2Icon class="w-3.5 h-3.5" />
                    {{ showApprovalForm ? 'Sembunyikan Form' : 'Tindak Lanjuti (Approve / Reject)' }}
                  </button>

                  <div v-if="showApprovalForm" class="space-y-3 animate-fade-in">
                    <textarea
                      v-model="approvalNote"
                      rows="2"
                      class="w-full text-xs border border-neutral-200 rounded-lg p-2.5 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-neutral-400"
                      placeholder="Catatan (wajib jika menolak)..."
                      :disabled="isSubmitting"
                    />
                    <div class="flex gap-2">
                      <Button
                        type="button"
                        @click="handleAction('reject')"
                        :disabled="isSubmitting"
                        class="flex-1 text-xs bg-red-600 hover:bg-red-700 text-white border-red-600"
                        size="sm"
                      >
                        <XCircleIcon class="w-3.5 h-3.5 mr-1.5" v-if="!isSubmitting" />
                        <Loader2Icon class="w-3.5 h-3.5 mr-1.5 animate-spin" v-else />
                        Tolak
                      </Button>
                      <Button
                        type="button"
                        @click="handleAction('approve')"
                        :disabled="isSubmitting"
                        class="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                        size="sm"
                      >
                        <CheckCircle2Icon class="w-3.5 h-3.5 mr-1.5" v-if="!isSubmitting" />
                        <Loader2Icon class="w-3.5 h-3.5 mr-1.5 animate-spin" v-else />
                        Setujui
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-6 text-neutral-400 text-xs">
                Tidak ada data alur persetujuan.
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- RIGHT: Metadata -->
        <div class="space-y-4">
          <Card class="border border-neutral-200 shadow-sm bg-white">
            <CardHeader class="bg-neutral-50/60 border-b border-neutral-200 pb-4">
              <CardTitle class="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <InfoIcon class="w-4 h-4 text-neutral-600" />
                Metadata Dokumen
              </CardTitle>
            </CardHeader>
            <CardContent class="pt-5 space-y-3 text-xs text-neutral-700">
              <div class="flex justify-between items-center py-1 border-b border-neutral-100">
                <span class="text-neutral-400 flex items-center gap-1.5"><HashIcon class="w-3.5 h-3.5" /> ID Dokumen</span>
                <span class="font-mono font-bold text-neutral-900">#{{ detail.id_dacp }}</span>
              </div>
              <div class="flex justify-between items-center py-1 border-b border-neutral-100">
                <span class="text-neutral-400 flex items-center gap-1.5"><CalendarIcon class="w-3.5 h-3.5" /> Tanggal</span>
                <span class="font-medium">{{ formatDate(detail.tanggal) }}</span>
              </div>
              <div class="flex justify-between items-center py-1 border-b border-neutral-100">
                <span class="text-neutral-400 flex items-center gap-1.5"><InfoIcon class="w-3.5 h-3.5" /> Work Order</span>
                <span class="font-mono font-bold text-neutral-900">WO #{{ detail.id_wo }}</span>
              </div>
              <div class="flex justify-between items-center py-1 border-b border-neutral-100">
                <span class="text-neutral-400">Buyer</span>
                <span class="font-medium text-right max-w-[150px] truncate" :title="detail.buyer">{{ detail.buyer }}</span>
              </div>
              <div class="flex justify-between items-center py-1 border-b border-neutral-100">
                <span class="text-neutral-400">Model</span>
                <span class="font-medium text-right max-w-[150px] truncate" :title="detail.model">{{ detail.model }}</span>
              </div>
              <div v-if="detail.style" class="flex justify-between items-center py-1 border-b border-neutral-100">
                <span class="text-neutral-400">Style</span>
                <span class="font-medium">{{ detail.style }}</span>
              </div>
              <div class="flex justify-between items-center py-1">
                <span class="text-neutral-400 flex items-center gap-1.5"><CalendarIcon class="w-3.5 h-3.5" /> Dibuat</span>
                <span>{{ formatDate(detail.created_at) }}</span>
              </div>
            </CardContent>
          </Card>

          <!-- Summary Card -->
          <Card class="border border-neutral-200 shadow-sm bg-white">
            <CardHeader class="bg-neutral-50/60 border-b border-neutral-200 pb-4">
              <CardTitle class="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <FileTextIcon class="w-4 h-4 text-neutral-600" />
                Ringkasan Total
              </CardTitle>
            </CardHeader>
            <CardContent class="pt-5 space-y-3 text-xs">
              <div class="flex justify-between items-center py-1 border-b border-neutral-100">
                <span class="text-neutral-500">QTY Order</span>
                <span class="font-mono font-bold text-neutral-900">{{ totalQtyOrder.toLocaleString('id-ID') }}</span>
              </div>
              <div class="flex justify-between items-center py-1 border-b border-neutral-100">
                <span class="text-neutral-500">QTY Cutting Plan</span>
                <span class="font-mono font-semibold text-neutral-800">{{ totalCuttingPlan.toLocaleString('id-ID') }}</span>
              </div>
              <div class="flex justify-between items-center py-1 border-b border-neutral-100">
                <span class="text-neutral-500">QTY Cutting Actual</span>
                <span class="font-mono font-semibold text-neutral-800">{{ totalCuttingActual.toLocaleString('id-ID') }}</span>
              </div>
              <div class="flex justify-between items-center py-1 border-b border-neutral-100">
                <span class="text-neutral-500">Cutting Report</span>
                <span class="font-mono font-semibold text-neutral-800">{{ totalCuttingReport.toLocaleString('id-ID') }}</span>
              </div>
              <div class="flex justify-between items-center py-1">
                <span class="font-semibold text-neutral-700">Balance Allowance</span>
                <span
                  class="font-mono font-bold text-base"
                  :class="totalBalance < 0 ? 'text-red-600' : 'text-emerald-600'"
                >
                  {{ totalBalance.toLocaleString('id-ID') }}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>

    <!-- Error -->
    <div v-else class="text-center py-20 bg-white border border-neutral-200 rounded-2xl shadow-sm max-w-md mx-auto">
      <InfoIcon class="w-12 h-12 text-red-500 mx-auto mb-3" />
      <h3 class="text-lg font-bold text-neutral-800">Dokumen Tidak Ditemukan</h3>
      <p class="text-neutral-500 text-xs mt-1 px-4">ID dokumen tidak valid atau belum dibuat.</p>
      <Button
        @click="router.navigate({ to: '/data-approve-cutting-plan' })"
        class="mt-5 bg-neutral-900 text-white hover:bg-neutral-800"
      >
        Kembali ke Daftar
      </Button>
    </div>

  </div>
</template>
