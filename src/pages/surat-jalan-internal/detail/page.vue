<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useParams, useRouter } from '@tanstack/vue-router';
import { ArrowLeftIcon, PrinterIcon, LayersIcon, DownloadIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { downloadSuratJalanInternalExcel, getSuratJalanInternalById } from '@/api/surat-jalan-internal/surat-jalan-internal';
import type { SuratJalanInternalDetailResponse } from '@/schemas/surat-jalan-internal/response';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { formatDate } from '@/lib/formatter';

const router = useRouter();
const params = useParams({ from: '/_authenticated/surat-jalan-internal/$id' });
const id = computed(() => Number(params.value.id));

const detail = ref<SuratJalanInternalDetailResponse | null>(null);
const isLoading = ref(true);
const isExportingExcel = ref(false);

const fetchDetail = async () => {
  isLoading.value = true;
  try {
    const res = await getSuratJalanInternalById(id.value);
    detail.value = res;
  } catch (e) {
    toast.error("Gagal memuat rincian Surat Jalan Internal.");
  } finally {
    isLoading.value = false;
  }
};

const handlePrint = () => {
  window.print();
};

const handleExportExcel = async () => {
  isExportingExcel.value = true;
  try {
    const result = await downloadSuratJalanInternalExcel(id.value);
    const objectUrl = window.URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = result.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(objectUrl);
    toast.success('Export Excel Surat Jalan Internal berhasil diunduh.');
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Gagal mengunduh export Excel Surat Jalan Internal.');
  } finally {
    isExportingExcel.value = false;
  }
};

onMounted(() => {
  fetchDetail();
});
</script>

<template>
  <div class="space-y-6 w-full max-w-[1400px] mx-auto p-2 md:p-6 animate-fade-in">
    <div class="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
      <div class="flex items-center gap-3">
        <Button variant="outline" size="icon" class="rounded-xl border-slate-300 shadow-xs hover:bg-slate-100" @click="router.navigate({ to: '/surat-jalan-internal' })">
          <ArrowLeftIcon class="w-4 h-4 text-slate-700" />
        </Button>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold tracking-tight text-slate-900">Detail Surat Jalan Internal</h1>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Dokumen Terverifikasi
            </span>
          </div>
          <p class="text-sm text-slate-500 mt-0.5">Rincian pengiriman internal dan rincian barang WO Shell</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          :disabled="isExportingExcel"
          @click="handleExportExcel"
          class="rounded-xl border-emerald-300 text-emerald-700 shadow-xs flex gap-2 items-center hover:bg-emerald-50"
        >
          <DownloadIcon class="w-4 h-4" />
          {{ isExportingExcel ? 'Mengunduh...' : 'Export Excel' }}
        </Button>
        <Button variant="outline" @click="handlePrint" class="rounded-xl border-slate-300 shadow-xs flex gap-2 items-center">
          <PrinterIcon class="w-4 h-4 text-slate-700" /> Cetak Surat Jalan
        </Button>
      </div>
    </div>

    <div v-if="isLoading" class="py-16 text-center text-slate-500">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mb-2"></div>
      <p class="text-sm font-medium">Memuat rincian Surat Jalan Internal...</p>
    </div>

    <template v-else-if="detail">
      <!-- Document Header Info Card -->
      <Card class="rounded-2xl border-slate-200 shadow-xs bg-white overflow-hidden">
        <CardHeader class="border-b border-slate-100 bg-slate-50/50 py-4 px-6">
          <div class="flex items-center gap-2">
            <LayersIcon class="w-5 h-5 text-emerald-600" />
            <CardTitle class="text-base font-semibold text-slate-900">Dokumen Surat Jalan Internal #{{ detail.id_surat_jalan_internal }}</CardTitle>
          </div>
          <CardDescription>Informasi metadata dan catatan dokumen pengiriman</CardDescription>
        </CardHeader>
        <CardContent class="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <span class="text-xs font-semibold uppercase text-slate-400 tracking-wider block mb-1">No. Dokumen</span>
            <span class="font-bold text-lg text-slate-800">{{ detail.no_dokumen || '—' }}</span>
          </div>
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <span class="text-xs font-semibold uppercase text-slate-400 tracking-wider block mb-1">Work Order (WO)</span>
            <span class="font-bold text-lg text-emerald-600 block">WO #{{ detail.id_wo }}</span>
            <span class="text-xs text-slate-500 mt-0.5 block" v-if="detail.buyer || detail.model">
              {{ detail.buyer }} - {{ detail.model }}
            </span>
          </div>
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <span class="text-xs font-semibold uppercase text-slate-400 tracking-wider block mb-1">Tanggal Dibuat</span>
            <span class="font-medium text-slate-800 text-base">{{ formatDate(detail.created_at) }}</span>
          </div>
        </CardContent>
      </Card>

      <!-- WO Shell Details Table (No | Desc | QTY | Note) -->
      <Card class="rounded-2xl border-slate-200 shadow-xs bg-white overflow-hidden">
        <CardHeader class="border-b border-slate-100 bg-slate-50/50 py-4 px-6">
          <CardTitle class="text-base font-semibold text-slate-900">Rincian Barang Pengiriman</CardTitle>
          <CardDescription class="text-xs">Tabel daftar barang terkirim (No | Desc | Quantity | Note)</CardDescription>
        </CardHeader>
        <CardContent class="p-0">
          <div v-if="!detail.wo_shells || detail.wo_shells.length === 0" class="py-12 text-center text-slate-500">
            Tidak ada rincian barang WO Shell untuk Work Order ini.
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm text-left border-collapse">
              <thead class="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th class="py-3.5 px-4 w-14 text-center">No.</th>
                  <th class="py-3.5 px-4 min-w-[400px]">Desc (Deskripsi Barang)</th>
                  <th class="py-3.5 px-4 text-right w-44">Quantity</th>
                  <th class="py-3.5 px-4 w-72">Note</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 bg-white">
                <tr v-for="item in detail.wo_shells" :key="item.no" class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3.5 px-4 text-center font-bold text-slate-500">{{ item.no }}</td>
                  <td class="py-3.5 px-4 font-semibold text-slate-800">{{ item.deskripsi }}</td>
                  <td class="py-3.5 px-4 text-right font-bold text-emerald-600 text-base">{{ item.qty.toLocaleString('id-ID') }}</td>
                  <td class="py-3.5 px-4 text-slate-600">{{ item.note || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
