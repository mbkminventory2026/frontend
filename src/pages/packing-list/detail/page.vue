<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useParams, useRouter } from '@tanstack/vue-router';
import {
    ArrowLeftIcon,
    LayersIcon,
    InfoIcon,
    PackageIcon,
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { usePackingList } from '@/composables/usePackingList';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/formatter';

const router = useRouter();
const params = useParams({ from: '/_authenticated/packing-list/$id' });
const id = computed(() => params.value.id);

const { isLoading: isLoadingPl, detail, fetchDetail: loadPlDetail } = usePackingList();

const isLoading = computed(() => isLoadingPl.value);

const fetchAllDetails = async () => {
    try {
        await loadPlDetail(id.value);
    } catch (e) {
        toast.error("Gagal memuat rincian Packing List.");
    }
};

// Build display size catalog from packing list detail payload itself.
const packingSizes = computed(() => {
    if (!detail.value) return [];

    const catalog = new Map<number, { id_wo_shell_size: number; id_size?: number | null; size: string }>();

    detail.value.items?.forEach((item) => {
        item.sizes?.forEach((sizeItem) => {
            if (!catalog.has(sizeItem.id_wo_shell_size)) {
                catalog.set(sizeItem.id_wo_shell_size, {
                    id_wo_shell_size: sizeItem.id_wo_shell_size,
                    id_size: sizeItem.id_size,
                    size: sizeItem.size,
                });
            }
        });
    });

    detail.value.reject_sizes?.forEach((sizeItem) => {
        if (!catalog.has(sizeItem.id_wo_shell_size)) {
            catalog.set(sizeItem.id_wo_shell_size, {
                id_wo_shell_size: sizeItem.id_wo_shell_size,
                id_size: sizeItem.id_size,
                size: sizeItem.size,
            });
        }
    });

    return Array.from(catalog.values());
});

// Calculate total boxes
const totalBoxes = computed(() => {
    if (!detail.value || !detail.value.items) return 0;
    return detail.value.items.reduce((acc, item) => acc + (item.qty_box || 0), 0);
});

// Calculate grand total garments (Sum of Qty Box * Qty Per Box)
const totalGarments = computed(() => {
    if (!detail.value || !detail.value.items) return 0;
    return detail.value.items.reduce((acc, item) => acc + ((item.qty_box || 0) * (item.qty_per_box || 0)), 0);
});

onMounted(() => {
    fetchAllDetails();
});
</script>

<template>
    <div class="container mx-auto py-8 space-y-8 max-w-7xl">
        <!-- Loading State -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <div class="w-8 h-8 border-4 border-neutral-200 border-t-neutral-700 rounded-full animate-spin" />
            <p class="text-neutral-500 animate-pulse text-sm">Memuat dokumen Packing List...</p>
        </div>

        <!-- Detail Content -->
        <div v-else-if="detail" class="space-y-6 animate-fade-in">
            <!-- Header Section -->
            <div class="flex flex-col md:flex-row gap-6 items-center border-b pb-6 border-neutral-200 justify-between">
                <div class="flex items-center gap-4">
                    <div class="bg-neutral-100 p-3.5 rounded-2xl border border-neutral-200 shadow-sm">
                        <PackageIcon class="w-10 h-10 text-neutral-700" />
                    </div>
                    <div>
                        <div class="flex items-center gap-2.5">
                            <h1 class="text-2xl font-bold tracking-tight text-neutral-900">Packing List #{{ detail.id_packing_list }}</h1>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200">
                                PL Document
                            </span>
                        </div>
                        <p class="text-sm text-neutral-500 mt-1">
                            Tanggal Dibuat: {{ formatDate(detail.created_at) }}
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
                <!-- Left Side: Summary and Header Info -->
                <div class="space-y-6">
                    <Card class="border border-neutral-200 shadow-sm bg-white overflow-hidden">
                        <CardHeader class="bg-neutral-50/50 border-b border-neutral-200 pb-4">
                            <CardTitle class="text-sm font-bold flex items-center gap-2 text-neutral-900 uppercase tracking-wider">
                                <InfoIcon class="w-4 h-4 text-neutral-600" />
                                Informasi Rujukan WO
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="p-5 space-y-4 text-sm">
                            <div class="flex justify-between items-center py-1.5 border-b border-neutral-100">
                                <span class="text-neutral-500 font-medium">Model / Style</span>
                                <span class="font-bold text-neutral-900">{{ detail.model }}</span>
                            </div>
                            <div class="flex justify-between items-center py-1.5 border-b border-neutral-100">
                                <span class="text-neutral-500 font-medium">Buyer</span>
                                <span class="font-bold text-neutral-900">{{ detail.buyer }}</span>
                            </div>
                            <div class="flex justify-between items-center py-1.5 border-b border-neutral-100">
                                <span class="text-neutral-500 font-medium">ID Work Order</span>
                                <span class="font-mono font-bold text-neutral-900">#{{ detail.id_wo }}</span>
                            </div>
                            <div class="flex justify-between items-center py-1.5 border-b border-neutral-100">
                                <span class="text-neutral-500 font-medium">No. SJ Internal</span>
                                <span class="font-bold text-neutral-900">{{ detail.id_surat_jalan_internal ? `#${detail.id_surat_jalan_internal}` : '—' }}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card class="border border-neutral-200 shadow-sm bg-white overflow-hidden">
                        <CardHeader class="bg-neutral-50/50 border-b border-neutral-200 pb-4">
                            <CardTitle class="text-sm font-bold flex items-center gap-2 text-neutral-900 uppercase tracking-wider">
                                <PackageIcon class="w-4 h-4 text-neutral-600" />
                                Ringkasan Kuantitas
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="p-5 space-y-4 text-sm">
                            <div class="flex justify-between items-center py-1.5 border-b border-neutral-100">
                                <span class="text-neutral-500 font-medium">Total Box</span>
                                <span class="font-bold text-neutral-900 font-mono">{{ totalBoxes.toLocaleString('id-ID') }} Box</span>
                            </div>
                            <div class="flex justify-between items-center py-1.5 border-b border-neutral-100">
                                <span class="text-neutral-500 font-medium">Total Qty Garment</span>
                                <span class="font-bold text-neutral-950 font-mono text-base">{{ totalGarments.toLocaleString('id-ID') }} Pcs</span>
                            </div>
                            <div class="flex justify-between items-center py-1.5 border-b border-neutral-100">
                                <span class="text-neutral-500 font-medium">Total Reject</span>
                                <span class="font-bold text-red-600 font-mono">{{ detail.total_reject.toLocaleString('id-ID') }} Pcs</span>
                            </div>
                        </CardContent>
                    </Card>

                    <!-- Rincian Reject per Ukuran Card -->
                    <Card v-if="detail.reject_sizes && detail.reject_sizes.length > 0" class="border border-neutral-200 shadow-sm bg-white overflow-hidden">
                        <CardHeader class="bg-neutral-50/50 border-b border-neutral-200 pb-4">
                            <CardTitle class="text-sm font-bold flex items-center gap-2 text-neutral-900 uppercase tracking-wider">
                                <InfoIcon class="w-4 h-4 text-neutral-600" />
                                Rincian Reject per Ukuran
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="p-5 space-y-3 text-sm">
                            <div v-for="sz in packingSizes" :key="sz.id_wo_shell_size" class="flex justify-between items-center py-1.5 border-b border-neutral-100 last:border-0">
                                <span class="text-neutral-500 font-medium">Size {{ sz.size }}</span>
                                <span class="font-bold text-neutral-900 font-mono">{{ (detail.reject_sizes?.find(r => r.id_wo_shell_size === sz.id_wo_shell_size)?.qty || 0).toLocaleString('id-ID') }} Pcs</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <!-- Right Side: Box Items Table -->
                <div class="lg:col-span-2 space-y-6">
                    <Card class="overflow-hidden border border-neutral-200 shadow-sm bg-white">
                        <CardHeader class="bg-neutral-50/50 border-b border-neutral-200 pb-4">
                            <CardTitle class="text-sm font-bold flex items-center gap-2 text-neutral-900 uppercase tracking-wider">
                                <LayersIcon class="w-4 h-4 text-neutral-600" />
                                Rincian Karton / Box & Breakdown Size
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="p-6">
                            <div v-if="!detail.items || detail.items.length === 0" class="text-center py-10 text-neutral-400 text-sm">
                                Tidak ada rincian item karton.
                            </div>
                            
                            <div v-else class="overflow-x-auto border border-neutral-150 rounded-lg shadow-xs bg-white">
                                <table class="w-full text-left border-collapse border-spacing-0 text-xs min-w-[900px]">
                                    <thead class="bg-neutral-50/60 border-b border-neutral-200 text-[10px] uppercase font-bold text-neutral-500">
                                        <tr>
                                            <th class="px-3 py-2.5 w-[12%]">Karton No</th>
                                            <th class="px-3 py-2.5 w-[15%]">Warna</th>
                                            <!-- Dynamic size headers from WO sizes -->
                                            <th v-for="sz in packingSizes" :key="sz.id_wo_shell_size" class="px-3 py-2.5 text-center bg-neutral-50/30">
                                                Sz {{ sz.size }}
                                            </th>
                                            <th class="px-3 py-2.5 w-[12%] text-center">Qty / Box</th>
                                            <th class="px-3 py-2.5 w-[10%] text-center">Jml Box</th>
                                            <th class="px-3 py-2.5 w-[12%] text-right bg-neutral-50">Total Qty</th>
                                            <th class="px-3 py-2.5 w-[15%]">Keterangan</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-neutral-150 text-neutral-700 font-mono">
                                        <tr v-for="item in detail.items" :key="item.id_packing_list_item" class="hover:bg-neutral-50/25 transition-colors">
                                            <!-- Box No Range -->
                                            <td class="px-3 py-3 font-semibold text-neutral-900">
                                                {{ item.box_no_start }} - {{ item.box_no_end }}
                                            </td>
                                            
                                            <!-- Color -->
                                            <td class="px-3 py-3 font-sans">{{ item.color }}</td>
                                            
                                            <!-- Dynamic size quantities mapping -->
                                            <td v-for="sz in packingSizes" :key="sz.id_wo_shell_size" class="px-3 py-3 text-center text-neutral-600">
                                                {{ item.sizes?.find(s => s.id_wo_shell_size === sz.id_wo_shell_size)?.qty || 0 }}
                                            </td>
                                            
                                            <!-- Qty per Box -->
                                            <td class="px-3 py-3 text-center font-bold text-neutral-800">{{ item.qty_per_box.toLocaleString('id-ID') }}</td>
                                            
                                            <!-- Qty Box (Jml Box) -->
                                            <td class="px-3 py-3 text-center font-bold text-neutral-800">{{ item.qty_box.toLocaleString('id-ID') }}</td>
                                            
                                            <!-- Total Pcs (calculated) -->
                                            <td class="px-3 py-3 text-right font-bold text-neutral-950 bg-neutral-50/45">
                                                {{ (item.qty_box * item.qty_per_box).toLocaleString('id-ID') }}
                                            </td>
                                            
                                            <!-- Note -->
                                            <td class="px-3 py-3 font-sans text-neutral-500 max-w-[120px] truncate" :title="item.note">
                                                {{ item.note || '—' }}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    </div>
</template>
