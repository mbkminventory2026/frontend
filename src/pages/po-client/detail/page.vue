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
    UserIcon,
    ArrowLeftIcon,
    PencilIcon,
    ImageIcon,
    PaperclipIcon
} from 'lucide-vue-next';

import { getPOClientById, type POClientDetailResponse } from '@/api/po-clients/po-clients';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/formatter';
import { useAuthStore } from '@/store/authStore';

import { usePermission } from '@/composables/usePermission';

const router = useRouter();
const authStore = useAuthStore();
const { hasPermission } = usePermission();
const params = useParams({ from: '/_authenticated/po-client/$id' });
const id = computed(() => params.value.id);

const canCreateOrEdit = computed(() => {
    if (authStore.isMitra) return true;
    return hasPermission('PO_CLIENT_CREATE') || hasPermission('PO_CLIENT_UPDATE');
});

const detail = ref<POClientDetailResponse | null>(null);
const isLoading = ref(true);

const fetchDetail = async () => {
    isLoading.value = true;
    try {
        const data = await getPOClientById(id.value);
        detail.value = data;
    } catch (e) {
        console.error("Gagal fetch PO Client detail:", e);
    } finally {
        isLoading.value = false;
    }
};

const formatPrice = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(val);
};

const grandTotal = computed(() => {
    if (!detail.value || !detail.value.items) return 0;
    return detail.value.items.reduce((acc, curr) => acc + (curr.qty * curr.price), 0);
});

const totalQty = computed(() => {
    if (!detail.value || !detail.value.items) return 0;
    return detail.value.items.reduce((acc, curr) => acc + curr.qty, 0);
});

onMounted(() => {
    fetchDetail();
});
</script>

<template>
    <div class="container mx-auto py-8 max-w-5xl">
        <div v-if="isLoading" class="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <Spinner class="size-8" />
            <p class="text-neutral-500 animate-pulse text-sm">Memuat dokumen PO Client...</p>
        </div>

        <div v-else-if="detail">
            <!-- Header Section -->
            <div class="flex flex-col md:flex-row gap-6 items-center mb-8 border-b pb-6 border-neutral-200">
                <div class="bg-neutral-100 p-4 rounded-2xl border border-neutral-200 shadow-sm">
                    <FileTextIcon class="w-12 h-12 text-neutral-700" />
                </div>
                
                <div class="flex-1 space-y-1 text-center md:text-left">
                    <div class="flex items-center justify-center md:justify-start gap-2">
                        <h1 class="text-3xl font-bold tracking-tight text-neutral-900">{{ detail.po_number }}</h1>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200">
                            Purchase Order Client
                        </span>
                    </div>
                    <div class="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-neutral-500">
                        <span class="flex items-center gap-1.5 font-medium">
                            Mitra: <span class="text-neutral-800">{{ detail.mitra_name }}</span>
                        </span>
                        <span>•</span>
                        <span class="flex items-center gap-1.5">
                            Tanggal: {{ formatDate(detail.tanggal) }}
                        </span>
                    </div>
                </div>

                <div class="flex gap-2 w-full md:w-auto">
                    <Button @click="router.history.back()" variant="outline" class="flex-1 md:flex-none border-neutral-300">
                        <ArrowLeftIcon class="w-4 h-4 mr-2" /> Kembali
                    </Button>
                    <Button 
                        v-if="canCreateOrEdit" 
                        @click="router.navigate({ to: '/po-client/edit/$id', params: { id: String(detail.id_po_client) } })" 
                        class="flex-1 md:flex-none bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-800 flex items-center gap-2"
                    >
                        <PencilIcon class="w-4 h-4" /> Edit PO
                    </Button>
                </div>
            </div>

            <!-- Content Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Main Info and Nested Tables -->
                <div class="md:col-span-2 space-y-6">
                    <!-- PO Header Info Card -->
                    <Card class="overflow-hidden border border-neutral-200 shadow-sm bg-white">
                        <CardHeader class="bg-neutral-50/50 border-b border-neutral-200 pb-4">
                            <CardTitle class="text-sm font-bold flex items-center gap-2 text-neutral-900 uppercase tracking-wider">
                                <Info class="w-4 h-4 text-neutral-600" />
                                Header Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="pt-6">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                                <div class="space-y-1">
                                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">PO Number</p>
                                    <p class="text-lg font-bold text-neutral-950">{{ detail.po_number }}</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Season</p>
                                    <p class="text-lg font-medium text-neutral-900">{{ detail.season || '-' }}</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tanggal Order</p>
                                    <p class="font-medium text-neutral-900">{{ formatDate(detail.tanggal) }}</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Delivery Date</p>
                                    <p class="font-medium text-neutral-900">{{ formatDate(detail.delivery) }}</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Payment Term</p>
                                    <p class="font-medium text-neutral-900">{{ detail.payment_term || '-' }}</p>
                                </div>
                                <div class="space-y-1" v-if="detail.file">
                                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Attached File</p>
                                    
                                    <!-- PDF base64 format -->
                                    <div v-if="detail.file.startsWith('data:application/pdf;base64,')" class="flex items-center gap-2 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-250">
                                        <a :href="detail.file" download="attached_po_document.pdf" class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100/80 border border-red-200/60 rounded-lg shadow-xs transition-all">
                                            <FileTextIcon class="w-4 h-4 text-red-600 animate-pulse" /> Download PDF Document
                                        </a>
                                    </div>
                                    
                                    <!-- Image base64 format -->
                                    <div v-else-if="detail.file.startsWith('data:image/')" class="mt-2 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-250">
                                        <a :href="detail.file" download="attached_po_image.png" class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/60 rounded-lg shadow-xs transition-all mb-1">
                                            <ImageIcon class="w-4 h-4 text-blue-600" /> Download Attachment Image
                                        </a>
                                        <div class="relative group max-w-[280px] rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50 shadow-sm transition-all hover:shadow-md">
                                            <img :src="detail.file" alt="Attached PO Document" class="w-full h-auto object-cover max-h-[180px] group-hover:scale-[1.02] transition-all duration-300" />
                                        </div>
                                    </div>
                                    
                                    <!-- Generic Fallback generic file string -->
                                    <div v-else class="flex items-center gap-2 mt-1.5">
                                        <a :href="detail.file" download class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg shadow-xs transition-all">
                                            <PaperclipIcon class="w-3.5 h-3.5 text-neutral-500" /> Download File
                                        </a>
                                        <span class="text-xs text-neutral-500 truncate max-w-[200px]">{{ detail.file }}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <!-- Nested Items List Card -->
                    <Card class="overflow-hidden border border-neutral-200 shadow-sm bg-white">
                        <CardHeader class="bg-neutral-50/50 border-b border-neutral-200 pb-4">
                            <CardTitle class="text-sm font-bold flex items-center gap-2 text-neutral-900 uppercase tracking-wider">
                                <DollarSign class="w-4 h-4 text-neutral-600" />
                                Ordered Items ({{ detail.items?.length || 0 }})
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="p-0 border-t border-neutral-200">
                            <div class="overflow-x-auto">
                                <table class="w-full text-left border-collapse text-xs">
                                    <thead class="bg-neutral-50/50 text-neutral-600 font-semibold border-b border-neutral-200">
                                        <tr>
                                            <th class="p-4 w-[25%]">Style / Model</th>
                                            <th class="p-4 w-[20%]">Colour</th>
                                            <th class="p-4 text-center w-[12%]">Qty</th>
                                            <th class="p-4 text-right w-[18%]">Unit Price</th>
                                            <th class="p-4 text-right w-[20%]">Total Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="item in detail.items" :key="item.id_po_client_item" class="border-b border-neutral-200 last:border-0 hover:bg-neutral-50/20 text-neutral-900">
                                            <td class="p-4 font-semibold">
                                                <div>{{ item.style }}</div>
                                                <div class="text-[10px] text-neutral-500 font-normal mt-0.5" v-if="item.description">
                                                    {{ item.description }}
                                                </div>
                                            </td>
                                            <td class="p-4">{{ item.colour }}</td>
                                            <td class="p-4 text-center font-mono font-medium">{{ item.qty }}</td>
                                            <td class="p-4 text-right font-mono">{{ formatPrice(item.price) }}</td>
                                            <td class="p-4 text-right font-mono font-semibold">{{ formatPrice(item.qty * item.price) }}</td>
                                        </tr>
                                        <!-- Subtotals -->
                                        <tr class="bg-neutral-50/55 border-t-2 border-neutral-200 font-semibold text-neutral-950">
                                            <td colspan="2" class="p-4 text-right text-xs uppercase tracking-wider border-r border-neutral-200">Grand Totals:</td>
                                            <td class="p-4 text-center font-mono border-r border-neutral-200">{{ totalQty }} Items</td>
                                            <td class="border-r border-neutral-200"></td>
                                            <td class="p-4 text-right font-mono text-sm font-bold">{{ formatPrice(grandTotal) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <!-- Sidebar / PIC Info and metadata -->
                <div class="space-y-6">
                    <!-- Penanggung Jawab CARD -->
                    <Card class="border border-neutral-200 shadow-sm bg-white">
                        <CardHeader class="bg-neutral-50/50 border-b border-neutral-200 pb-4">
                            <CardTitle class="text-xs font-bold text-neutral-950 uppercase tracking-wider flex items-center gap-2">
                                <UserIcon class="w-4 h-4 text-neutral-600" />
                                Penanggung Jawab (PIC)
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="pt-6 space-y-6">
                            <div v-for="(pic, idx) in detail.penanggung_jawab" :key="idx" class="space-y-3 bg-neutral-50/50 p-3 rounded-lg border border-neutral-200">
                                <div class="space-y-1">
                                    <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Nama Lengkap</p>
                                    <p class="text-sm font-bold text-neutral-900">{{ pic.nama }}</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">No. Telepon</p>
                                    <div class="flex items-center gap-1.5 text-xs text-neutral-700">
                                        <Phone class="w-3.5 h-3.5 text-neutral-400" />
                                        <span>{{ pic.no_telp }}</span>
                                    </div>
                                </div>
                                <div class="space-y-1" v-if="pic.email">
                                    <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Email</p>
                                    <div class="flex items-center gap-1.5 text-xs text-neutral-700">
                                        <Mail class="w-3.5 h-3.5 text-neutral-400" />
                                        <span>{{ pic.email }}</span>
                                    </div>
                                </div>
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
                                <span class="font-mono text-neutral-900">#{{ detail.id_po_client }}</span>
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
            <p class="text-neutral-500">Maaf, data dokumen Purchase Order yang Anda cari tidak tersedia.</p>
            <Button @click="router.navigate({ to: '/po-client' })" class="bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm border border-neutral-800">
                Kembali ke Daftar PO
            </Button>
        </div>
    </div>
</template>
