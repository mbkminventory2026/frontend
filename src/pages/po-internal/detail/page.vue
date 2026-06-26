<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useParams, useRouter } from '@tanstack/vue-router';
import {
    FileTextIcon,
    Hash,
    Calendar,
    Info,
    Mail,
    Phone,
    DollarSign,
    Building2,
    ArrowLeftIcon,
    DownloadIcon,
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { downloadPOInternalExcel, getPOInternalById, type POInternalDetailResponse } from '@/api/po-internals/po-internals';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/formatter';

const router = useRouter();
const params = useParams({ from: '/_authenticated/po-internal/$id' });
const id = computed(() => params.value.id);

const detail = ref<POInternalDetailResponse | null>(null);
const isLoading = ref(true);
const isExportingExcel = ref(false);

const fetchDetail = async () => {
    isLoading.value = true;
    try {
        const data = await getPOInternalById(id.value);
        detail.value = data;
    } catch (e) {
        console.error("Gagal fetch PO Internal detail:", e);
    } finally {
        isLoading.value = false;
    }
};

const formatCurrency = (val: number, currency = 'IDR') => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: currency || 'IDR',
        minimumFractionDigits: 0
    }).format(val);
};

const grandTotal = computed(() => {
    if (!detail.value || !detail.value.items) return 0;
    return detail.value.items.reduce((acc, curr) => acc + (curr.qty * curr.unit_price), 0);
});

const totalQty = computed(() => {
    if (!detail.value || !detail.value.items) return 0;
    return detail.value.items.reduce((acc, curr) => acc + curr.qty, 0);
});

const handleExportExcel = async () => {
    isExportingExcel.value = true;
    try {
        const result = await downloadPOInternalExcel(id.value);
        const objectUrl = window.URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = result.fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(objectUrl);
        toast.success('Export Excel PO Internal berhasil diunduh.');
    } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Gagal mengunduh export Excel PO Internal.');
    } finally {
        isExportingExcel.value = false;
    }
};

onMounted(() => {
    fetchDetail();
});
</script>

<template>
    <div class="container mx-auto py-8 max-w-5xl">
        <div v-if="isLoading" class="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <Spinner class="size-8" />
            <p class="text-neutral-500 animate-pulse text-sm">Memuat dokumen PO Internal...</p>
        </div>

        <div v-else-if="detail">
            <!-- Header Section -->
            <div class="flex flex-col md:flex-row gap-6 items-center mb-8 border-b pb-6 border-neutral-200">
                <div class="bg-neutral-100 p-4 rounded-2xl border border-neutral-200 shadow-sm">
                    <FileTextIcon class="w-12 h-12 text-neutral-700" />
                </div>

                <div class="flex-1 space-y-1 text-center md:text-left">
                    <div class="flex items-center justify-center md:justify-start gap-2">
                        <h1 class="text-3xl font-bold tracking-tight text-neutral-900">{{ detail.nama_po }}</h1>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200">
                            Purchase Order Internal
                        </span>
                    </div>
                    <div class="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-neutral-500">
                        <span class="flex items-center gap-1.5 font-medium">
                            Supplier: <span class="text-neutral-800">{{ detail.supplier_name }}</span>
                        </span>
                        <span>•</span>
                        <span class="flex items-center gap-1.5">
                            Tanggal: {{ formatDate(detail.tanggal) }}
                        </span>
                        <span>•</span>
                        <span class="flex items-center gap-1.5 font-semibold text-neutral-700">
                            {{ detail.currency }}
                        </span>
                    </div>
                </div>

                <div class="flex gap-2 w-full md:w-auto">
                    <Button @click="router.history.back()" variant="outline" class="flex-1 md:flex-none border-neutral-300">
                        <ArrowLeftIcon class="w-4 h-4 mr-2" /> Kembali
                    </Button>
                    <Button
                        :disabled="isExportingExcel"
                        @click="handleExportExcel"
                        variant="outline"
                        class="flex-1 md:flex-none border-emerald-300 text-emerald-700 hover:bg-emerald-50 shadow-xs"
                    >
                        <DownloadIcon class="w-4 h-4 mr-2" />
                        {{ isExportingExcel ? 'Mengunduh...' : 'Export Excel' }}
                    </Button>
                </div>
            </div>

            <!-- Content Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Main Info and Items Table -->
                <div class="md:col-span-2 space-y-6">
                    <!-- PO Header Info Card -->
                    <Card class="overflow-hidden border border-neutral-200 shadow-sm bg-white">
                        <CardHeader class="bg-neutral-50/50 border-b border-neutral-200 pb-4">
                            <CardTitle class="text-sm font-bold flex items-center gap-2 text-neutral-900 uppercase tracking-wider">
                                <Info class="w-4 h-4 text-neutral-600" />
                                Informasi PO
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="pt-6">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                                <div class="space-y-1">
                                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Nama PO</p>
                                    <p class="text-lg font-bold text-neutral-950">{{ detail.nama_po }}</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Currency</p>
                                    <p class="text-lg font-medium text-neutral-900">{{ detail.currency }}</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tanggal Order</p>
                                    <p class="font-medium text-neutral-900">{{ formatDate(detail.tanggal) }}</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Ship Date</p>
                                    <p class="font-medium text-neutral-900">{{ formatDate(detail.ship_date) }}</p>
                                </div>
                                <div class="space-y-1" v-if="detail.cpo">
                                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">CPO</p>
                                    <p class="font-medium text-neutral-900">{{ detail.cpo }}</p>
                                </div>
                                <div class="space-y-1" v-if="detail.term">
                                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Term</p>
                                    <p class="font-medium text-neutral-900">{{ detail.term }}</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">ID PR Internal</p>
                                    <p class="font-mono font-bold text-neutral-900">#{{ detail.id_pr_internal }}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <!-- Items List Card -->
                    <Card class="overflow-hidden border border-neutral-200 shadow-sm bg-white">
                        <CardHeader class="bg-neutral-50/50 border-b border-neutral-200 pb-4">
                            <CardTitle class="text-sm font-bold flex items-center gap-2 text-neutral-900 uppercase tracking-wider">
                                <DollarSign class="w-4 h-4 text-neutral-600" />
                                Daftar Item ({{ detail.items?.length || 0 }})
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="p-0 border-t border-neutral-200">
                            <div class="overflow-x-auto">
                                <table class="w-full text-left border-collapse text-xs">
                                    <thead class="bg-neutral-50/50 text-neutral-600 font-semibold border-b border-neutral-200">
                                        <tr>
                                            <th class="p-4 w-[25%]">Nama Item</th>
                                            <th class="p-4 w-[12%]">Satuan</th>
                                            <th class="p-4 text-center w-[10%]">Qty</th>
                                            <th class="p-4 text-right w-[18%]">Harga Satuan</th>
                                            <th class="p-4 text-right w-[18%]">Total Harga</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="item in detail.items" :key="item.id_po_internal_item" class="border-b border-neutral-200 last:border-0 hover:bg-neutral-50/20 text-neutral-900">
                                            <td class="p-4 font-semibold">
                                                <div>{{ item.item }}</div>
                                                <div class="text-[10px] text-neutral-500 font-normal mt-0.5" v-if="item.description">
                                                    {{ item.description }}
                                                </div>
                                            </td>
                                            <td class="p-4 text-neutral-700">{{ item.unit }}</td>
                                            <td class="p-4 text-center font-mono font-medium">{{ item.qty }}</td>
                                            <td class="p-4 text-right font-mono">{{ formatCurrency(item.unit_price, detail.currency) }}</td>
                                            <td class="p-4 text-right font-mono font-semibold">{{ formatCurrency(item.qty * item.unit_price, detail.currency) }}</td>
                                        </tr>
                                        <!-- Subtotals -->
                                        <tr class="bg-neutral-50/55 border-t-2 border-neutral-200 font-semibold text-neutral-950">
                                            <td colspan="2" class="p-4 text-right text-xs uppercase tracking-wider border-r border-neutral-200">Grand Totals:</td>
                                            <td class="p-4 text-center font-mono border-r border-neutral-200">{{ totalQty }} Items</td>
                                            <td class="border-r border-neutral-200"></td>
                                            <td class="p-4 text-right font-mono text-sm font-bold">{{ formatCurrency(grandTotal, detail.currency) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <!-- Sidebar: Supplier Info + Metadata -->
                <div class="space-y-6">
                    <!-- Supplier Info Card -->
                    <Card class="border border-neutral-200 shadow-sm bg-white">
                        <CardHeader class="bg-neutral-50/50 border-b border-neutral-200 pb-4">
                            <CardTitle class="text-xs font-bold text-neutral-950 uppercase tracking-wider flex items-center gap-2">
                                <Building2 class="w-4 h-4 text-neutral-600" />
                                Informasi Supplier
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="pt-6 space-y-4 text-sm">
                            <div class="space-y-1">
                                <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Nama Supplier</p>
                                <p class="font-bold text-neutral-900">{{ detail.supplier_name }}</p>
                            </div>
                            <div class="space-y-1" v-if="detail.supplier_addr">
                                <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Alamat</p>
                                <p class="text-xs text-neutral-700">{{ detail.supplier_addr }}</p>
                            </div>
                            <div class="space-y-1" v-if="detail.supplier_contact">
                                <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Contact Person</p>
                                <p class="text-xs text-neutral-700">{{ detail.supplier_contact }}</p>
                            </div>
                            <div class="space-y-1" v-if="detail.supplier_telp">
                                <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">No. Telepon</p>
                                <div class="flex items-center gap-1.5 text-xs text-neutral-700">
                                    <Phone class="w-3.5 h-3.5 text-neutral-400" />
                                    <span>{{ detail.supplier_telp }}</span>
                                </div>
                            </div>
                            <div class="space-y-1" v-if="detail.supplier_email">
                                <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Email</p>
                                <div class="flex items-center gap-1.5 text-xs text-neutral-700">
                                    <Mail class="w-3.5 h-3.5 text-neutral-400" />
                                    <span>{{ detail.supplier_email }}</span>
                                </div>
                            </div>
                            <div class="space-y-1" v-if="detail.supplier_fax">
                                <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">No. Fax</p>
                                <p class="text-xs text-neutral-700">{{ detail.supplier_fax }}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <!-- Metadata Card -->
                    <Card class="border border-neutral-200 shadow-sm bg-white">
                        <CardHeader class="bg-neutral-50/50 border-b border-neutral-200 pb-4">
                            <CardTitle class="text-xs font-bold text-neutral-900 uppercase tracking-wider">Document Metadata</CardTitle>
                        </CardHeader>
                        <CardContent class="pt-6 space-y-4 text-xs text-neutral-700">
                            <div class="flex items-center justify-between">
                                <span class="text-neutral-500 flex items-center gap-2">
                                    <Calendar class="w-3.5 h-3.5 text-neutral-400" /> Created At
                                </span>
                                <span class="font-medium text-neutral-900">{{ formatDate(detail.created_at) }}</span>
                            </div>
                            <Separator />
                            <div class="flex items-center justify-between">
                                <span class="text-neutral-500 flex items-center gap-2">
                                    <Hash class="w-3.5 h-3.5 text-neutral-400" /> Document ID
                                </span>
                                <span class="font-mono text-neutral-900">#{{ detail.id_po_internal }}</span>
                            </div>
                            <Separator />
                            <div class="flex items-center justify-between">
                                <span class="text-neutral-500 flex items-center gap-2">
                                    <Hash class="w-3.5 h-3.5 text-neutral-400" /> PR Internal ID
                                </span>
                                <span class="font-mono text-neutral-900">#{{ detail.id_pr_internal }}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>

        <div v-else class="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
            <div class="bg-neutral-100 p-4 rounded-full border border-neutral-200">
                <FileTextIcon class="w-12 h-12 text-neutral-400" />
            </div>
            <h2 class="text-2xl font-bold text-neutral-900">Dokumen Tidak Ditemukan</h2>
            <p class="text-neutral-500">Maaf, data PO Internal yang Anda cari tidak tersedia.</p>
            <Button @click="router.navigate({ to: '/po-internal' })" class="bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm border border-neutral-800">
                Kembali ke Daftar PO Internal
            </Button>
        </div>
    </div>
</template>
