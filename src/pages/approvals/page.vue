<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useSearch } from '@tanstack/vue-router';
import { toast } from 'vue-sonner';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  User, 
  Loader2, 
  ArrowRight, 
  MessageSquare,
  FileText,
  Layers,
  FileSpreadsheet,
  CalendarDays,
  PackageOpen,
  Eye,
  History,
  ChevronLeft,
  ChevronRight,
  Scissors as ScissorsIcon
} from 'lucide-vue-next';

import { 
  getPendingApprovals, 
  submitApprovalAction, 
  getDocumentAuditTrail,
  getApprovalHistory,
  type ApprovalPendingItem, 
  type DocumentAuditTrail,
  type ApprovalHistoryItem
} from '@/api/approvals/approvals';

import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { formatDate } from '@/lib/formatter';

// ─── Pending State ─────────────────────────────────────
const pendingItems = ref<ApprovalPendingItem[]>([]);
const isLoadingPending = ref(false);

// ─── History State ─────────────────────────────────────
const historyItems = ref<ApprovalHistoryItem[]>([]);
const historyTotal = ref(0);
const isLoadingHistory = ref(false);
const historyPage = ref(1);
const historyLimit = 10;

const search = useSearch({ strict: false }) as any;

// Filters
const selectedTableFilter = ref(search.value?.table || '');
const selectedStatusFilter = ref(search.value?.status || ''); // Default to all history

const filteredPendingItems = computed(() => {
  if (!selectedTableFilter.value) return pendingItems.value;
  return pendingItems.value.filter(item => item.nama_tabel_dokumen === selectedTableFilter.value);
});

watch(() => search.value?.table, (newTable) => {
  selectedTableFilter.value = newTable || '';
});

// ─── Modal State ───────────────────────────────────────
const showReviewModal = ref(false);
const selectedItem = ref<ApprovalPendingItem | ApprovalHistoryItem | null>(null);
const auditTrail = ref<DocumentAuditTrail | null>(null);
const isLoadingAudit = ref(false);
const isSubmitting = ref(false);
const approvalNote = ref('');

// Check if current item opened in modal is from history (read-only)
const isReadOnly = computed(() => {
  if (!selectedItem.value) return true;
  // If it doesn't have id_otoritas_detail, it's a history item (read-only)
  return !('id_otoritas_detail' in selectedItem.value) || !selectedItem.value.id_otoritas_detail;
});

const formattedDocumentDate = computed(() => {
  if (!selectedItem.value) return '';
  const dateStr = 'created_at' in selectedItem.value 
    ? selectedItem.value.created_at 
    : (selectedItem.value as ApprovalPendingItem).requested_at;
  return formatDate(dateStr);
});

// ─── Fetch Data Functions ──────────────────────────────
const fetchPendingList = async () => {
  isLoadingPending.value = true;
  try {
    const data = await getPendingApprovals();
    pendingItems.value = data;
  } catch (error: any) {
    console.error("Gagal memuat antrean pending:", error);
    toast.error("Gagal mengambil daftar pending approval.");
  } finally {
    isLoadingPending.value = false;
  }
};

const fetchHistoryList = async () => {
  isLoadingHistory.value = true;
  try {
    const offset = (historyPage.value - 1) * historyLimit;
    const data = await getApprovalHistory({
      status: selectedStatusFilter.value,
      table: selectedTableFilter.value,
      limit: historyLimit,
      offset,
    });
    historyItems.value = data.items || [];
    historyTotal.value = data.total_items || 0;
  } catch (error: any) {
    console.error("Gagal memuat histori:", error);
    toast.error("Gagal mengambil histori approval.");
  } finally {
    isLoadingHistory.value = false;
  }
};

// ─── Watchers for History Filters ──────────────────────
watch([selectedStatusFilter, selectedTableFilter], () => {
  historyPage.value = 1;
  fetchHistoryList();
});

watch(historyPage, () => {
  fetchHistoryList();
});

// ─── Document Detail Nav URL ───────────────────────────
const getDetailUrl = (tableName: string, id: number) => {
  const pathMap: Record<string, string> = {
    'PR_INTERNAL': '/pr-internal',
    'WORK_ORDER': '/work-order',
    'PO_INTERNAL': '/po-internal',
    'MARKER_PLAN': '/marker-plan',
    'TIMELINE_PRODUKSI': '/timeline-produksi',
    'PACKING_LIST': '/packing-list',
    'SPREADING_CUTTING_PLAN': '/spreading-cutting-plan',
    'DATA_APPROVE_CUTTING_PLAN': '/data-approve-cutting-plan'
  };
  const basePath = pathMap[tableName] || `/${tableName.toLowerCase().replace('_', '-')}`;
  return `${basePath}/${id}`;
};

const openDocumentDetail = (tableName: string, id: number) => {
  const url = getDetailUrl(tableName, id);
  window.open(url, '_blank');
};

// ─── Open Review Modal ─────────────────────────────────
const openReview = async (item: ApprovalPendingItem | ApprovalHistoryItem) => {
  selectedItem.value = item;
  showReviewModal.value = true;
  isLoadingAudit.value = true;
  auditTrail.value = null;
  approvalNote.value = '';
  
  try {
    const data = await getDocumentAuditTrail(item.nama_tabel_dokumen, item.id_dokumen);
    auditTrail.value = data;
  } catch (error: any) {
    console.error("Gagal memuat riwayat dokumen:", error);
    toast.error("Gagal memuat riwayat persetujuan dokumen.");
  } finally {
    isLoadingAudit.value = false;
  }
};

const closeReview = () => {
  showReviewModal.value = false;
  selectedItem.value = null;
  auditTrail.value = null;
  approvalNote.value = '';
};

// ─── Handle Action ─────────────────────────────────────
const handleAction = async (action: 'approve' | 'reject') => {
  if (!selectedItem.value || isReadOnly.value) return;
  
  const pendingItem = selectedItem.value as ApprovalPendingItem;
  
  if (action === 'reject' && !approvalNote.value.trim()) {
    toast.error("Catatan wajib diisi jika Anda menolak (Reject) dokumen.");
    return;
  }
  
  isSubmitting.value = true;
  try {
    await submitApprovalAction({
      id_otoritas_detail: pendingItem.id_otoritas_detail,
      action,
      catatan: approvalNote.value.trim()
    });
    
    toast.success(action === 'approve' 
      ? 'Dokumen berhasil disetujui!' 
      : 'Dokumen berhasil ditolak.'
    );
    closeReview();
    await fetchPendingList();
    await fetchHistoryList();
  } catch (error: any) {
    console.error("Gagal melakukan aksi approval:", error);
    toast.error(error.response?.data?.message || `Gagal memproses aksi ${action}.`);
  } finally {
    isSubmitting.value = false;
  }
};

// ─── Helpers: Type Classes & Icons ─────────────────────
const getDocTypeName = (tableName: string) => {
  switch (tableName) {
    case 'PR_INTERNAL': return 'PR Internal';
    case 'WORK_ORDER': return 'Work Order';
    case 'PO_INTERNAL': return 'PO Internal';
    case 'MARKER_PLAN': return 'Marker Plan';
    case 'TIMELINE_PRODUKSI': return 'Timeline Produksi';
    case 'PACKING_LIST': return 'Packing List';
    case 'SPREADING_CUTTING_PLAN': return 'Spreading & Cutting Plan';
    case 'DATA_APPROVE_CUTTING_PLAN': return 'Data Approve Cutting Plan';
    default: return tableName;
  }
};

const getDocTypeClass = (tableName: string) => {
  switch (tableName) {
    case 'PR_INTERNAL': 
      return 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30';
    case 'WORK_ORDER': 
      return 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/30';
    case 'PO_INTERNAL': 
      return 'bg-indigo-50 text-indigo-700 border-indigo-200/60 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/30';
    case 'MARKER_PLAN': 
      return 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30';
    case 'TIMELINE_PRODUKSI': 
      return 'bg-pink-50 text-pink-700 border-pink-200/60 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-800/30';
    case 'PACKING_LIST': 
      return 'bg-teal-50 text-teal-700 border-teal-200/60 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800/30';
    case 'SPREADING_CUTTING_PLAN':
      return 'bg-orange-50 text-orange-700 border-orange-200/60 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/30';
    case 'DATA_APPROVE_CUTTING_PLAN':
      return 'bg-green-50 text-green-700 border-green-200/60 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30';
    default: 
      return 'bg-neutral-50 text-neutral-700 border-neutral-200/60 dark:bg-neutral-900/20 dark:text-neutral-400 dark:border-neutral-800/30';
  }
};

const getDocTypeIcon = (tableName: string) => {
  switch (tableName) {
    case 'PR_INTERNAL': return FileText;
    case 'WORK_ORDER': return Layers;
    case 'PO_INTERNAL': return FileSpreadsheet;
    case 'MARKER_PLAN': return ClipboardCheck;
    case 'TIMELINE_PRODUKSI': return CalendarDays;
    case 'PACKING_LIST': return PackageOpen;
    case 'SPREADING_CUTTING_PLAN': return ScissorsIcon;
    case 'DATA_APPROVE_CUTTING_PLAN': return ClipboardCheck;
    default: return FileText;
  }
};

const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case 'PEMBUAT': return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200';
    case 'PENGECEK': return 'bg-cyan-50 text-cyan-800 border border-cyan-100 dark:bg-cyan-950/35 dark:text-cyan-400 dark:border-cyan-900/40';
    case 'PENYETUJU': return 'bg-orange-50 text-orange-800 border border-orange-100 dark:bg-orange-950/35 dark:text-orange-400 dark:border-orange-900/40';
    case 'RELEASE': return 'bg-emerald-50 text-emerald-800 border border-emerald-100 dark:bg-emerald-950/35 dark:text-emerald-400 dark:border-emerald-900/40';
    default: return 'bg-neutral-100 text-neutral-800';
  }
};

onMounted(() => {
  fetchPendingList();
  fetchHistoryList();
});
</script>

<template>
  <div class="space-y-10">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between border-b pb-5 border-neutral-100 dark:border-neutral-800 gap-4">
      <div class="flex items-center gap-3">
        <div class="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-2.5 rounded-xl shadow-xs">
          <ClipboardCheck class="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
        </div>
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Cek & Approval Dokumen</h1>
          <p class="text-[13px] text-neutral-500 mt-1">
            Verifikasi dokumen transaksi secara sekuensial dan pantau riwayat persetujuan terpusat.
          </p>
        </div>
      </div>
    </div>

    <!-- SECTION 1: PENDING APPROVALS -->
    <div class="space-y-4">
      <h2 class="text-base font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
        Dokumen Menunggu Approval Anda
      </h2>

      <!-- Loading State -->
      <div v-if="isLoadingPending" class="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 class="w-7 h-7 text-neutral-400 animate-spin" />
        <span class="text-xs text-neutral-500">Memuat antrean pending...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredPendingItems.length === 0" class="flex flex-col items-center justify-center py-10 px-4 text-center bg-white/50 dark:bg-neutral-950/30 border border-neutral-200/60 dark:border-neutral-800/80 rounded-xl shadow-xs">
        <div class="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 p-3 rounded-full mb-3">
          <CheckCircle2 class="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
        </div>
        <h3 class="text-sm font-bold text-neutral-800 dark:text-neutral-200">Semua Beres!</h3>
        <p class="text-xs text-neutral-500 max-w-sm mt-1">
          Tidak ada dokumen pending yang menunggu verifikasi atau persetujuan Anda saat ini.
        </p>
      </div>

      <!-- Table Pending Approvals -->
      <div v-else class="bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader class="bg-neutral-50/50 dark:bg-neutral-900/40">
            <TableRow>
              <TableHead class="font-semibold text-neutral-700 dark:text-neutral-300">Tipe Dokumen</TableHead>
              <TableHead class="font-semibold text-neutral-700 dark:text-neutral-300 text-center">ID</TableHead>
              <TableHead class="font-semibold text-neutral-700 dark:text-neutral-300">Ringkasan Dokumen</TableHead>
              <TableHead class="font-semibold text-neutral-700 dark:text-neutral-300 text-center">Peran Anda</TableHead>
              <TableHead class="font-semibold text-neutral-700 dark:text-neutral-300">Diajukan Oleh</TableHead>
              <TableHead class="font-semibold text-neutral-700 dark:text-neutral-300">Tanggal Masuk</TableHead>
              <TableHead class="font-semibold text-neutral-700 dark:text-neutral-300 text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="item in filteredPendingItems" :key="item.id_otoritas_detail" class="hover:bg-neutral-50/40 dark:hover:bg-neutral-900/20">
              <TableCell>
                <div class="flex items-center gap-2">
                  <span class="p-1.5 rounded-lg border" :class="getDocTypeClass(item.nama_tabel_dokumen)">
                    <component :is="getDocTypeIcon(item.nama_tabel_dokumen)" class="w-4 h-4" />
                  </span>
                  <span class="font-semibold text-neutral-800 dark:text-neutral-200 text-xs">
                    {{ getDocTypeName(item.nama_tabel_dokumen) }}
                  </span>
                </div>
              </TableCell>
              <TableCell class="text-center font-bold text-xs text-neutral-600 dark:text-neutral-400">
                #{{ item.id_dokumen }}
              </TableCell>
              <TableCell class="max-w-xs truncate text-neutral-700 dark:text-neutral-300 text-xs">
                {{ item.doc_summary || '-' }}
              </TableCell>
              <TableCell class="text-center">
                <span class="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold" :class="getRoleBadgeClass(item.tipe_peran)">
                  {{ item.tipe_peran }}
                </span>
              </TableCell>
              <TableCell class="text-neutral-600 dark:text-neutral-400 text-xs">
                <div class="flex items-center gap-1">
                  <User class="w-3.5 h-3.5 opacity-60" />
                  <span>{{ item.requested_by || 'System' }}</span>
                </div>
              </TableCell>
              <TableCell class="text-neutral-500 dark:text-neutral-400 text-xs">
                <div class="flex items-center gap-1">
                  <Calendar class="w-3.5 h-3.5 opacity-60" />
                  <span>{{ formatDate(item.requested_at) }}</span>
                </div>
              </TableCell>
              <TableCell class="text-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  class="hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] font-semibold border-neutral-300 shadow-xs"
                  @click="openReview(item)"
                >
                  Tinjau Dokumen
                  <ArrowRight class="w-3 h-3 ml-1" />
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>

    <!-- SECTION 2: HISTORY APPROVALS -->
    <div class="space-y-4 border-t pt-8 border-neutral-100 dark:border-neutral-800">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 class="text-base font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
          <History class="w-5 h-5 text-neutral-500" />
          Histori Status Dokumen
        </h2>

        <!-- Filters Bar -->
        <div class="flex flex-wrap items-center gap-3">
          <!-- Filter Jenis Dokumen -->
          <div class="flex items-center gap-1.5">
            <span class="text-xs text-neutral-500">Jenis:</span>
            <select 
              v-model="selectedTableFilter"
              class="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Semua Dokumen</option>
              <option value="PR_INTERNAL">PR Internal</option>
              <option value="WORK_ORDER">Work Order</option>
              <option value="PO_INTERNAL">PO Internal</option>
              <option value="MARKER_PLAN">Marker Plan</option>
              <option value="TIMELINE_PRODUKSI">Timeline Produksi</option>
              <option value="PACKING_LIST">Packing List</option>
              <option value="SPREADING_CUTTING_PLAN">Spreading &amp; Cutting Plan</option>
              <option value="DATA_APPROVE_CUTTING_PLAN">Data Approve Cutting Plan</option>
            </select>
          </div>

          <!-- Filter Status -->
          <div class="flex items-center gap-1.5">
            <span class="text-xs text-neutral-500">Status:</span>
            <select 
              v-model="selectedStatusFilter"
              class="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Semua Status</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingHistory" class="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 class="w-7 h-7 text-neutral-400 animate-spin" />
        <span class="text-xs text-neutral-500">Memuat histori dokumen...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="historyItems.length === 0" class="flex flex-col items-center justify-center py-10 px-4 text-center bg-white/50 dark:bg-neutral-950/30 border border-neutral-200/60 dark:border-neutral-800/80 rounded-xl shadow-xs">
        <h3 class="text-xs font-semibold text-neutral-500">Tidak ada histori dokumen ditemukan dengan filter ini.</h3>
      </div>

      <!-- Table History Approvals -->
      <div v-else class="space-y-4">
        <div class="bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs">
          <Table>
            <TableHeader class="bg-neutral-50/50 dark:bg-neutral-900/40">
              <TableRow>
                <TableHead class="font-semibold text-neutral-700 dark:text-neutral-300">Tipe Dokumen</TableHead>
                <TableHead class="font-semibold text-neutral-700 dark:text-neutral-300 text-center">ID</TableHead>
                <TableHead class="font-semibold text-neutral-700 dark:text-neutral-300">Ringkasan Dokumen</TableHead>
                <TableHead class="font-semibold text-neutral-700 dark:text-neutral-300">Diajukan Oleh</TableHead>
                <TableHead class="font-semibold text-neutral-700 dark:text-neutral-300 text-center">Status Akhir</TableHead>
                <TableHead class="font-semibold text-neutral-700 dark:text-neutral-300">Tanggal Pengajuan</TableHead>
                <TableHead class="font-semibold text-neutral-700 dark:text-neutral-300 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="item in historyItems" :key="item.id_otoritas" class="hover:bg-neutral-50/40 dark:hover:bg-neutral-900/20">
                <TableCell>
                  <div class="flex items-center gap-2">
                    <span class="p-1.5 rounded-lg border" :class="getDocTypeClass(item.nama_tabel_dokumen)">
                      <component :is="getDocTypeIcon(item.nama_tabel_dokumen)" class="w-4 h-4" />
                    </span>
                    <span class="font-semibold text-neutral-800 dark:text-neutral-200 text-xs">
                      {{ getDocTypeName(item.nama_tabel_dokumen) }}
                    </span>
                  </div>
                </TableCell>
                <TableCell class="text-center font-bold text-xs text-neutral-600 dark:text-neutral-400">
                  #{{ item.id_dokumen }}
                </TableCell>
                <TableCell class="max-w-xs truncate text-neutral-700 dark:text-neutral-300 text-xs">
                  {{ item.doc_summary || '-' }}
                </TableCell>
                <TableCell class="text-neutral-600 dark:text-neutral-400 text-xs">
                  <div class="flex items-center gap-1">
                    <User class="w-3.5 h-3.5 opacity-60" />
                    <span>{{ item.requested_by || 'System' }}</span>
                  </div>
                </TableCell>
                <TableCell class="text-center">
                  <span 
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border"
                    :class="[
                      item.status_global.toLowerCase() === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/30'
                        : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/30'
                    ]"
                  >
                    {{ item.status_global.toUpperCase() }}
                  </span>
                </TableCell>
                <TableCell class="text-neutral-500 dark:text-neutral-400 text-xs">
                  <div class="flex items-center gap-1">
                    <Calendar class="w-3.5 h-3.5 opacity-60" />
                    <span>{{ formatDate(item.created_at) }}</span>
                  </div>
                </TableCell>
                <TableCell class="text-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    class="text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px]"
                    @click="openReview(item)"
                  >
                    <Eye class="w-3.5 h-3.5 mr-1" />
                    Detail
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- Pagination Bar -->
        <div class="flex items-center justify-between px-2">
          <span class="text-xs text-neutral-500">
            Total Histori: {{ historyTotal }} dokumen
          </span>
          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              class="border-neutral-300 text-xs shadow-xs"
              @click="historyPage--"
              :disabled="historyPage <= 1"
            >
              <ChevronLeft class="w-4 h-4 mr-1" />
              Sebelumnya
            </Button>
            <span class="text-xs text-neutral-600 dark:text-neutral-400 font-medium px-2">
              Halaman {{ historyPage }} dari {{ Math.ceil(historyTotal / historyLimit) || 1 }}
            </span>
            <Button
              variant="outline"
              size="sm"
              class="border-neutral-300 text-xs shadow-xs"
              @click="historyPage++"
              :disabled="historyPage >= Math.ceil(historyTotal / historyLimit)"
            >
              Berikutnya
              <ChevronRight class="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Review & Action Dialog -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showReviewModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/55 backdrop-blur-xs" @click="!isSubmitting && closeReview()" />

          <!-- Dialog Box -->
          <div class="relative bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[85vh] z-10 overflow-hidden">
            
            <!-- Modal Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
              <div class="flex items-center gap-2.5">
                <span v-if="selectedItem" class="p-2 rounded-xl border shadow-xs" :class="getDocTypeClass(selectedItem.nama_tabel_dokumen)">
                  <component :is="getDocTypeIcon(selectedItem.nama_tabel_dokumen)" class="w-5 h-5" />
                </span>
                <div>
                  <h2 class="text-base font-bold text-neutral-900 dark:text-white">
                    {{ isReadOnly ? 'Riwayat' : 'Tinjau' }} {{ selectedItem ? getDocTypeName(selectedItem.nama_tabel_dokumen) : 'Dokumen' }}
                  </h2>
                  <p class="text-xs text-neutral-500">
                    ID Dokumen: #{{ selectedItem?.id_dokumen }}
                  </p>
                </div>
              </div>
              <button 
                v-if="!isReadOnly"
                class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-sm font-semibold p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                @click="closeReview"
                :disabled="isSubmitting"
              >
                Tutup
              </button>
            </div>

            <!-- Modal Body (Scrollable) -->
            <div class="flex-1 overflow-y-auto p-6 space-y-6">
              
              <!-- Document Info Summary -->
              <div class="bg-neutral-50/60 dark:bg-neutral-900/25 border border-neutral-200/40 dark:border-neutral-800/50 rounded-xl p-4 space-y-2.5">
                <div class="flex justify-between items-start">
                  <div>
                    <span class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Ringkasan Konten</span>
                    <p class="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mt-1">
                      {{ selectedItem?.doc_summary || '-' }}
                    </p>
                    
                    <!-- Detail Asli Button -->
                    <Button 
                      v-if="selectedItem"
                      variant="outline" 
                      size="sm" 
                      class="mt-3 text-[11px] font-semibold border-neutral-300 shadow-xs h-7 px-2.5"
                      @click="openDocumentDetail(selectedItem!.nama_tabel_dokumen, selectedItem!.id_dokumen)"
                    >
                      <FileText class="w-3.5 h-3.5 mr-1" />
                      Detail Dokumen Bawaan
                    </Button>
                  </div>

                  <div class="text-right" v-if="!isReadOnly">
                    <span class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Peran Verifikasi Anda</span>
                    <span class="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold rounded-md" :class="getRoleBadgeClass((selectedItem as ApprovalPendingItem)?.tipe_peran || '')">
                      {{ (selectedItem as ApprovalPendingItem)?.tipe_peran }}
                    </span>
                  </div>
                  <div class="text-right" v-else>
                    <span class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Status Dokumen</span>
                    <span 
                      class="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold rounded-full border"
                      :class="[
                        (selectedItem as ApprovalHistoryItem)?.status_global.toLowerCase() === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/30'
                          : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/30'
                      ]"
                    >
                      {{ (selectedItem as ApprovalHistoryItem)?.status_global.toUpperCase() }}
                    </span>
                  </div>
                </div>
                <div class="flex items-center justify-between text-[11px] text-neutral-500 border-t border-neutral-200/40 dark:border-neutral-800/40 pt-2.5">
                  <span>Diajukan: {{ selectedItem?.requested_by || 'System' }}</span>
                  <span>Pengajuan: {{ formattedDocumentDate }}</span>
                </div>
              </div>

              <!-- Steps List (Clean Card Stack, NO circles/lines) -->
              <div class="space-y-3">
                <h3 class="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 mb-1">
                  <ClipboardCheck class="w-4 h-4 text-neutral-500" />
                  Alur Persetujuan & Tinjauan
                </h3>

                <!-- Loader Audit Trail -->
                <div v-if="isLoadingAudit" class="flex flex-col items-center justify-center py-6 gap-2">
                  <Loader2 class="w-6 h-6 text-neutral-400 animate-spin" />
                  <span class="text-xs text-neutral-500">Memuat riwayat persetujuan...</span>
                </div>

                <!-- Steps Stack -->
                <div v-else-if="auditTrail" class="space-y-3">
                  <div 
                    v-for="step in auditTrail.steps" 
                    :key="step.id_otoritas_detail" 
                    class="p-4 border rounded-xl"
                    :class="[
                      !isReadOnly && step.id_otoritas_detail === (selectedItem as ApprovalPendingItem)?.id_otoritas_detail
                        ? 'border-blue-400 bg-blue-50/15 dark:border-blue-800/30 dark:bg-blue-950/5'
                        : 'border-neutral-200/60 dark:border-neutral-800 bg-white/20 dark:bg-neutral-950/5'
                    ]"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <div class="flex items-center gap-2">
                          <!-- Tipe Peran -->
                          <span class="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                            {{ step.tipe_peran }}
                          </span>
                          
                          <!-- Active User Indicator -->
                          <span 
                            v-if="!isReadOnly && step.id_otoritas_detail === (selectedItem as ApprovalPendingItem)?.id_otoritas_detail"
                            class="text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 font-bold px-1.5 py-0.5 rounded-sm"
                          >
                            Menunggu Aksi Anda
                          </span>
                        </div>
                        
                        <p class="text-xs text-neutral-500 mt-1.5 flex items-center gap-1">
                          <User class="w-3.5 h-3.5 opacity-65" />
                          <span>Verifikator: {{ step.nama_user || 'Belum Ditugaskan' }}</span>
                        </p>
                      </div>
                      
                      <!-- Status Badge -->
                      <div class="text-right flex flex-col items-end gap-1">
                        <span 
                          class="text-[10px] font-bold px-2 py-0.5 rounded-md"
                          :class="[
                            step.done 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40' 
                              : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                          ]"
                        >
                          {{ step.done ? 'Disetujui' : 'Belum' }}
                        </span>
                        <span v-if="step.waktu_aksi" class="text-[9px] text-neutral-400 mt-0.5">
                          {{ formatDate(step.waktu_aksi) }}
                        </span>
                      </div>
                    </div>

                    <!-- Catatan / Review Note -->
                    <div 
                      v-if="step.catatan" 
                      class="mt-3 text-xs text-neutral-600 dark:text-neutral-300 bg-neutral-50/50 dark:bg-neutral-900/40 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-850 flex items-start gap-1.5"
                    >
                      <MessageSquare class="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" />
                      <span class="italic">"{{ step.catatan }}"</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Form: Action & Note (ONLY IF NOT READ ONLY) -->
              <div v-if="!isReadOnly" class="border-t border-neutral-100 dark:border-neutral-800 pt-5 space-y-3">
                <label 
                  for="approval-note" 
                  class="block text-sm font-bold text-neutral-800 dark:text-neutral-200"
                >
                  Catatan / Alasan Verifikasi
                </label>
                <textarea
                  id="approval-note"
                  rows="3"
                  class="w-full text-sm border border-neutral-300 dark:border-neutral-750 rounded-xl p-3 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-neutral-400"
                  placeholder="Berikan catatan persetujuan atau detail penolakan (Wajib diisi jika menolak/reject)..."
                  v-model="approvalNote"
                  :disabled="isSubmitting"
                />
              </div>

            </div>

            <!-- Modal Footer (Actions) -->
            <div class="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 flex gap-3">
              <!-- Read-only footer button -->
              <Button
                v-if="isReadOnly"
                variant="outline"
                class="w-full border-neutral-300 shadow-xs text-sm"
                @click="closeReview"
              >
                Tutup
              </Button>
              
              <!-- Pending action footer buttons -->
              <template v-else>
                <Button
                  variant="outline"
                  class="flex-1 border-neutral-300 shadow-xs text-sm"
                  @click="closeReview"
                  :disabled="isSubmitting"
                >
                  Batal
                </Button>
                
                <Button
                  class="flex-1 text-sm bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-1.5 shadow-sm border-red-600"
                  @click="handleAction('reject')"
                  :disabled="isSubmitting || isLoadingAudit"
                >
                  <XCircle class="w-4 h-4" v-if="!isSubmitting" />
                  <Loader2 class="w-4 h-4 animate-spin" v-else />
                  Tolak (Reject)
                </Button>

                <Button
                  class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm text-sm flex items-center justify-center gap-1.5"
                  @click="handleAction('approve')"
                  :disabled="isSubmitting || isLoadingAudit"
                >
                  <CheckCircle2 class="w-4 h-4" v-if="!isSubmitting" />
                  <Loader2 class="w-4 h-4 animate-spin" v-else />
                  Setujui (Approve)
                </Button>
              </template>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
