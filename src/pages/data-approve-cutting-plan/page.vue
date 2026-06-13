<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from '@tanstack/vue-router';
import {
  PlusIcon,
  SearchIcon,
  ClipboardCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ScissorsIcon,
  EyeIcon,
  Loader2Icon
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import {
  getDataApproveCuttingPlans,
  type DataApproveCuttingPlanListItem
} from '@/api/data-approve-cutting/data-approve-cutting';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/formatter';

const router = useRouter();

const items = ref<DataApproveCuttingPlanListItem[]>([]);
const isLoading = ref(false);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = 15;
const totalItems = ref(0);

const totalPages = () => Math.max(1, Math.ceil(totalItems.value / pageSize));

const fetchList = async () => {
  isLoading.value = true;
  try {
    const res = await getDataApproveCuttingPlans({
      page: currentPage.value,
      limit: pageSize,
      search: searchQuery.value || undefined,
    });
    items.value = res.results;
    totalItems.value = res.count;
  } catch (e) {
    toast.error('Gagal memuat daftar Data Approve Cutting Plan.');
  } finally {
    isLoading.value = false;
  }
};

let debounceTimer: ReturnType<typeof setTimeout>;
const handleSearch = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchList();
  }, 350);
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchList();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages()) {
    currentPage.value++;
    fetchList();
  }
};

onMounted(fetchList);
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between border-b pb-5 border-neutral-100 gap-4">
      <div class="flex items-center gap-3">
        <div class="bg-neutral-50 border border-neutral-200 p-2.5 rounded-xl shadow-sm">
          <ClipboardCheckIcon class="w-6 h-6 text-neutral-700" />
        </div>
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-neutral-900">Data Approve Cutting Plan</h1>
          <p class="text-[13px] text-neutral-500 mt-1">
            Daftar dokumen persetujuan pemotongan kain. Data teragregasi dari WO, Marker Plan, dan Spreading Plan.
          </p>
        </div>
      </div>
      <Button
        id="btn-buat-dacp"
        @click="router.navigate({ to: '/data-approve-cutting-plan/create' })"
        class="bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm shrink-0"
      >
        <PlusIcon class="w-4 h-4 mr-2" />
        Buat Dokumen Baru
      </Button>
    </div>

    <!-- Search + Count -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div class="relative w-full sm:max-w-xs">
        <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
        <Input
          id="search-dacp"
          v-model="searchQuery"
          @input="handleSearch"
          type="text"
          placeholder="Cari no. dokumen, buyer, model…"
          class="pl-9 h-9 text-xs border-neutral-200"
        />
      </div>
      <span class="text-xs text-neutral-400 shrink-0">Total: {{ totalItems }} dokumen</span>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2Icon class="w-7 h-7 text-neutral-400 animate-spin" />
      <span class="text-xs text-neutral-500">Memuat data...</span>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="items.length === 0"
      class="flex flex-col items-center justify-center py-16 bg-white border border-neutral-200 rounded-2xl shadow-sm"
    >
      <div class="bg-neutral-100 p-4 rounded-full mb-4">
        <ScissorsIcon class="w-8 h-8 text-neutral-400" />
      </div>
      <h3 class="text-base font-bold text-neutral-700">Belum Ada Dokumen</h3>
      <p class="text-xs text-neutral-400 mt-1 max-w-xs text-center">
        Belum ada Data Approve Cutting Plan yang dibuat. Klik tombol "+ Buat Dokumen Baru" untuk memulai.
      </p>
      <Button
        @click="router.navigate({ to: '/data-approve-cutting-plan/create' })"
        class="mt-5 bg-neutral-900 text-white hover:bg-neutral-800"
        size="sm"
      >
        <PlusIcon class="w-4 h-4 mr-1.5" /> Buat Dokumen
      </Button>
    </div>

    <!-- Table -->
    <div v-else class="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-neutral-50 border-b border-neutral-200 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
              <th class="px-4 py-3 text-left">No. Dokumen</th>
              <th class="px-4 py-3 text-left">Tanggal</th>
              <th class="px-4 py-3 text-left">Buyer</th>
              <th class="px-4 py-3 text-left">Model / Style</th>
              <th class="px-4 py-3 text-center">WO</th>
              <th class="px-4 py-3 text-left">Dibuat</th>
              <th class="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100">
            <tr
              v-for="item in items"
              :key="item.id_dacp"
              class="hover:bg-neutral-50/50 transition-colors"
            >
              <td class="px-4 py-3">
                <span class="font-mono font-semibold text-neutral-900 text-xs">{{ item.no_dokumen }}</span>
              </td>
              <td class="px-4 py-3 text-xs text-neutral-600">{{ formatDate(item.tanggal) }}</td>
              <td class="px-4 py-3 text-xs text-neutral-700 font-medium">{{ item.buyer }}</td>
              <td class="px-4 py-3 text-xs text-neutral-600">{{ item.model }}</td>
              <td class="px-4 py-3 text-center">
                <span class="inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[10px] font-bold font-mono border border-neutral-200">
                  WO #{{ item.id_wo }}
                </span>
              </td>
              <td class="px-4 py-3 text-xs text-neutral-400">{{ formatDate(item.created_at) }}</td>
              <td class="px-4 py-3 text-center">
                <Button
                  :id="`btn-detail-dacp-${item.id_dacp}`"
                  variant="outline"
                  size="sm"
                  class="h-7 text-xs border-neutral-200 hover:bg-neutral-50"
                  @click="router.navigate({ to: '/data-approve-cutting-plan/$id', params: { id: String(item.id_dacp) } })"
                >
                  <EyeIcon class="w-3.5 h-3.5 mr-1" /> Lihat
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between px-4 py-3 border-t border-neutral-100 bg-neutral-50/40">
        <span class="text-xs text-neutral-400">
          Halaman {{ currentPage }} dari {{ totalPages() }} ({{ totalItems }} total)
        </span>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            class="h-7 text-xs border-neutral-200"
            @click="prevPage"
            :disabled="currentPage <= 1 || isLoading"
          >
            <ChevronLeftIcon class="w-3.5 h-3.5 mr-1" /> Sebelumnya
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="h-7 text-xs border-neutral-200"
            @click="nextPage"
            :disabled="currentPage >= totalPages() || isLoading"
          >
            Berikutnya <ChevronRightIcon class="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
