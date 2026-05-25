<script setup lang="ts">
import { useAIEstimation } from '@/composables/dashboard/useAIEstimation';
import {
  Sparkles,
  RotateCcw,
  Scissors,
  Activity,
  CheckCircle,
  Calendar,
  Shirt,
  Layers,
  Info,
  Brain
} from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  jenisOptions,
  menWomenOptions,
  panjangOptions,
  embroOptions,
  furingOptions,
  cuttingInHouseOptions,
  jenisKainOptions
} from '@/schemas/ai-estimation/request';

const {
  form,
  isLoading,
  estimationResult,
  totalQty,
  jumlahSize,
  resetForm,
  calculateEstimation
} = useAIEstimation();
</script>

<template>
  <div class="space-y-6 pb-6 animate-fade-in text-slate-800">
    <!-- Page Header (Simplified, removed chips and gradients) -->
    <div class="border-b pb-4 border-slate-100">
      <h1 class="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
        AI Delivery Date Estimation
      </h1>
      <p class="text-slate-500 text-xs md:text-sm mt-1">
        Prediksikan jadwal penyelesaian produksi menggunakan model machine learning berdasarkan spesifikasi order dan detail kain.
      </p>
    </div>

    <!-- Responsive Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Left Column: Form Inputs (7 Cols) -->
      <div class="lg:col-span-7 space-y-4">
        <Card class="border-slate-200 shadow-sm bg-white">
          <CardHeader class="py-4 border-b border-slate-100">
            <CardTitle class="text-base font-bold text-slate-800 flex items-center gap-2">
              <Shirt class="w-5 h-5 text-slate-500" />
              <span>Input Spesifikasi & Kuantitas Order</span>
            </CardTitle>
            <CardDescription class="text-slate-400 text-xs">
              Masukkan kuantitas ukuran baju dan spesifikasi produksi untuk kalkulasi model.
            </CardDescription>
          </CardHeader>

          <CardContent class="py-4 space-y-4">
            <!-- 1. Size Quantities Grid -->
            <div class="space-y-2">
              <Label class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Layers class="w-3.5 h-3.5" /> Kuantitas Ukuran (Pcs)
              </Label>
              <div class="grid grid-cols-5 gap-2">
                <div class="space-y-1">
                  <Label for="qty_s" class="text-[10px] font-bold text-slate-600 block text-center">S</Label>
                  <Input
                    id="qty_s"
                    type="number"
                    v-model.number="form.qty_s"
                    min="0"
                    placeholder="0"
                    class="h-8 text-center text-xs font-medium border-slate-200"
                  />
                </div>
                <div class="space-y-1">
                  <Label for="qty_m" class="text-[10px] font-bold text-slate-600 block text-center">M</Label>
                  <Input
                    id="qty_m"
                    type="number"
                    v-model.number="form.qty_m"
                    min="0"
                    placeholder="0"
                    class="h-8 text-center text-xs font-medium border-slate-200"
                  />
                </div>
                <div class="space-y-1">
                  <Label for="qty_l" class="text-[10px] font-bold text-slate-600 block text-center">L</Label>
                  <Input
                    id="qty_l"
                    type="number"
                    v-model.number="form.qty_l"
                    min="0"
                    placeholder="0"
                    class="h-8 text-center text-xs font-medium border-slate-200"
                  />
                </div>
                <div class="space-y-1">
                  <Label for="qty_xl" class="text-[10px] font-bold text-slate-600 block text-center">XL</Label>
                  <Input
                    id="qty_xl"
                    type="number"
                    v-model.number="form.qty_xl"
                    min="0"
                    placeholder="0"
                    class="h-8 text-center text-xs font-medium border-slate-200"
                  />
                </div>
                <div class="space-y-1">
                  <Label for="qty_xxl" class="text-[10px] font-bold text-slate-600 block text-center">XXL</Label>
                  <Input
                    id="qty_xxl"
                    type="number"
                    v-model.number="form.qty_xxl"
                    min="0"
                    placeholder="0"
                    class="h-8 text-center text-xs font-medium border-slate-200"
                  />
                </div>
              </div>
            </div>

            <!-- Live Calculation Summary Panel (More compact, no rainbow bars) -->
            <div class="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs flex justify-between items-center text-slate-600">
              <span class="font-medium">Total Input:</span>
              <div class="flex gap-4">
                <span>Total Qty: <strong class="text-slate-800">{{ totalQty }} pcs</strong></span>
                <span>Ukuran Terisi: <strong class="text-slate-800">{{ jumlahSize }} Size</strong></span>
              </div>
            </div>

            <!-- 2. Specifications Inputs Grid -->
            <div class="space-y-3 pt-2">
              <Label class="text-xs font-semibold text-slate-500 uppercase tracking-wider block border-b pb-1 border-slate-100">
                Spesifikasi & Variabel Produksi
              </Label>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <!-- Jenis Pakaian -->
                <div class="space-y-1">
                  <Label for="jenis" class="text-xs font-semibold text-slate-700">Jenis Pakaian</Label>
                  <select
                    id="jenis"
                    v-model.number="form.jenis"
                    class="flex h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
                  >
                    <option v-for="opt in jenisOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </div>

                <!-- Kategori Gender -->
                <div class="space-y-1">
                  <Label for="men_women" class="text-xs font-semibold text-slate-700">Kategori Target</Label>
                  <select
                    id="men_women"
                    v-model.number="form.men_women"
                    class="flex h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
                  >
                    <option v-for="opt in menWomenOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </div>

                <!-- Sleeve Length -->
                <div class="space-y-1">
                  <Label for="panjang_01" class="text-xs font-semibold text-slate-700">Lengan / Panjang</Label>
                  <select
                    id="panjang_01"
                    v-model.number="form.panjang_01"
                    class="flex h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
                  >
                    <option v-for="opt in panjangOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </div>

                <!-- Embroidery -->
                <div class="space-y-1">
                  <Label for="embro" class="text-xs font-semibold text-slate-700">Bordir (Embroidery)</Label>
                  <select
                    id="embro"
                    v-model.number="form.embro"
                    class="flex h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
                  >
                    <option v-for="opt in embroOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </div>

                <!-- Furing / Lining -->
                <div class="space-y-1">
                  <Label for="furing" class="text-xs font-semibold text-slate-700">Furing (Lining)</Label>
                  <select
                    id="furing"
                    v-model.number="form.furing"
                    class="flex h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
                  >
                    <option v-for="opt in furingOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </div>

                <!-- Cutting in House -->
                <div class="space-y-1">
                  <Label for="cutting_in_house" class="text-xs font-semibold text-slate-700">Lokasi / Metode Cutting</Label>
                  <select
                    id="cutting_in_house"
                    v-model.number="form.cutting_in_house"
                    class="flex h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
                  >
                    <option v-for="opt in cuttingInHouseOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </div>

                <!-- Jenis Kain -->
                <div class="space-y-1">
                  <Label for="jenis_kain" class="text-xs font-semibold text-slate-700">Jenis Bahan Kain</Label>
                  <select
                    id="jenis_kain"
                    v-model.number="form.jenis_kain"
                    class="flex h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
                  >
                    <option v-for="opt in jenisKainOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </div>

                <!-- Konsumsi Kain per Pcs -->
                <div class="space-y-1">
                  <Label for="konsumsi_kain_per_pcs" class="text-xs font-semibold text-slate-700">Konsumsi Kain (meter/pcs)</Label>
                  <Input
                    id="konsumsi_kain_per_pcs"
                    type="number"
                    step="0.01"
                    v-model.number="form.konsumsi_kain_per_pcs"
                    min="0.01"
                    placeholder="Contoh: 1.25"
                    class="h-9 border-slate-200 text-xs"
                  />
                </div>
              </div>
            </div>
          </CardContent>

          <!-- Buttons Panel -->
          <div class="bg-slate-50 border-t border-slate-100 py-3.5 px-6 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              @click="resetForm"
              class="h-9 px-4 border-slate-200 text-slate-600 hover:bg-slate-100 text-xs transition-colors"
            >
              <RotateCcw class="w-3.5 h-3.5 mr-1.5" /> Reset
            </Button>
            <Button
              type="button"
              @click="calculateEstimation"
              :disabled="isLoading"
              class="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <template v-if="isLoading">
                <svg class="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Mengkalkulasi...
              </template>
              <template v-else>
                <Sparkles class="w-3.5 h-3.5 mr-1.5 inline-block text-amber-300" />
                Hitung Estimasi
              </template>
            </Button>
          </div>
        </Card>
      </div>

      <!-- Right Column: Results Display (5 Cols) -->
      <div class="lg:col-span-5 space-y-4">
        <!-- Loading State (Simplified) -->
        <Card v-if="isLoading" class="border-slate-200 shadow-sm bg-white py-12 px-4 flex flex-col justify-center items-center space-y-4">
          <div class="relative w-12 h-12">
            <span class="absolute inset-0 rounded-full bg-slate-100 animate-ping"></span>
            <div class="absolute inset-2 rounded-full bg-slate-900 flex items-center justify-center shadow">
              <Brain class="w-5 h-5 text-white animate-pulse" />
            </div>
          </div>
          <div class="text-center space-y-1">
            <h3 class="text-sm font-bold text-slate-800">Memproses Prediksi AI...</h3>
            <p class="text-slate-400 text-xs max-w-xs mx-auto">
              Menghitung estimasi hari menggunakan model ML.
            </p>
          </div>
        </Card>

        <!-- Empty State (Simplified) -->
        <Card v-else-if="!estimationResult" class="border-slate-200 border-dashed shadow-sm py-12 px-4 text-center space-y-4 bg-slate-50/50 flex flex-col items-center justify-center">
          <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
            <Brain class="w-5 h-5" />
          </div>
          <div class="space-y-1 max-w-xs mx-auto">
            <h3 class="text-sm font-bold text-slate-700">Belum Ada Estimasi</h3>
            <p class="text-slate-400 text-[11px] leading-normal">
              Isi data spesifikasi di sebelah kiri, kemudian tekan tombol <strong>Hitung Estimasi</strong> untuk memicu prediksi AI.
            </p>
          </div>
        </Card>

        <!-- Success Result (Cleaned, simplified, removed colorful gauges/hero background) -->
        <div v-else class="space-y-4 animate-fade-in-up">
          <!-- Total Time Hero Card (Clean and simplified, neutral theme) -->
          <Card class="border-slate-200 shadow-sm bg-white">
            <CardHeader class="py-4 border-b border-slate-100">
              <CardTitle class="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar class="w-4 h-4 text-slate-500" /> Hasil Estimasi Produksi
              </CardTitle>
            </CardHeader>
            <CardContent class="py-4 space-y-4">
              <!-- Large Total Number (Neutral Slate) -->
              <div class="flex items-baseline justify-between border-b pb-4 mb-2">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Total Waktu Produksi</span>
                <span class="text-3xl font-extrabold text-slate-900">
                  {{ estimationResult.estimasi_waktu_total_hari }} <span class="text-sm font-normal text-slate-500">Hari Kerja</span>
                </span>
              </div>

              <!-- Phase Breakdown List (Simplified) -->
              <div class="space-y-3.5">
                <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Detail Per Tahap:</div>
                
                <!-- Cutting Phase -->
                <div class="flex justify-between items-center text-xs">
                  <div class="flex items-center gap-2 text-slate-600">
                    <Scissors class="w-4 h-4 text-slate-400" />
                    <span>Tahap Pemotongan (Cutting)</span>
                  </div>
                  <span class="font-bold text-slate-800">{{ estimationResult.estimasi_tahap_cutting_hari }} Hari</span>
                </div>

                <!-- Sewing Phase -->
                <div class="flex justify-between items-center text-xs">
                  <div class="flex items-center gap-2 text-slate-600">
                    <Activity class="w-4 h-4 text-slate-400" />
                    <span>Tahap Penjahitan (Sewing)</span>
                  </div>
                  <span class="font-bold text-slate-800">{{ estimationResult.estimasi_tahap_sewing_hari }} Hari</span>
                </div>

                <!-- QC Phase -->
                <div class="flex justify-between items-center text-xs">
                  <div class="flex items-center gap-2 text-slate-600">
                    <CheckCircle class="w-4 h-4 text-slate-400" />
                    <span>Tahap Quality Control & Packing</span>
                  </div>
                  <span class="font-bold text-slate-800">{{ estimationResult.estimasi_tahap_qc_hari }} Hari</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Clean Info Advisory -->
          <div class="flex gap-2.5 bg-slate-50 border border-slate-100 rounded-lg p-3 text-[11px] text-slate-600 leading-normal">
            <Info class="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong class="text-slate-800 block mb-0.5">Catatan Validasi AI:</strong>
              Prediksi dihitung oleh model klasifikasi & regresi **TabPFN** berdasarkan bobot parameter input. Keakuratan estimasi dipengaruhi konsistensi kapasitas lini produksi aktual.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

.animate-fade-in-up {
  animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.65rem center;
  background-repeat: no-repeat;
  background-size: 1.1em 1.1em;
  padding-right: 2.2rem;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}
</style>
