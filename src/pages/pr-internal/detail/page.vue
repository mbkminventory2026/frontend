<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useParams, useRouter } from '@tanstack/vue-router';
import {
    ClipboardListIcon,
    Hash,
    Calendar,
    Info,
    Phone,
    Building2,
    ArrowLeftIcon,
    CheckCircleIcon,
    MapPin,
    Briefcase,
    User,
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { getPRInternalById, approvePRInternal, type PRInternalDetailResponse } from '@/api/pr-internals/pr-internals';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/formatter';
import { usePermission } from '@/composables/usePermission';

const router = useRouter();
const params = useParams({ from: '/_authenticated/pr-internal/$id' });
const id = computed(() => params.value.id);
const { hasPermission } = usePermission();

const detail = ref<PRInternalDetailResponse | null>(null);
const isLoading = ref(true);

// ─── Approve Dialog ─────────────────────────────────────
const showApproveDialog = ref(false);
const isApproving = ref(false);

const canApprove = computed(() => hasPermission('PR_INTERNAL_APPROVE') || hasPermission('ALL_ACCESS'));
const isApproved = computed(() => detail.value?.status?.toLowerCase() === 'approved');

const fetchDetail = async () => {
    isLoading.value = true;
    try {
        const data = await getPRInternalById(id.value);
        detail.value = data;
    } catch (e) {
        console.error("Gagal fetch PR Internal detail:", e);
    } finally {
        isLoading.value = false;
    }
};

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(val);
};

const grandTotal = computed(() => {
    if (!detail.value || !detail.value.items) return 0;
    return detail.value.items.reduce((acc, curr) => acc + (curr.qty * curr.est_price), 0);
});

const totalQty = computed(() => {
    if (!detail.value || !detail.value.items) return 0;
    return detail.value.items.reduce((acc, curr) => acc + curr.qty, 0);
});

const confirmApprove = async () => {
    isApproving.value = true;
    try {
        await approvePRInternal(id.value);
        toast.success('PR Internal berhasil disetujui!');
        showApproveDialog.value = false;
        await fetchDetail();
    } catch (error: any) {
        toast.error(error.response?.data?.message || 'Gagal menyetujui PR Internal.');
    } finally {
        isApproving.value = false;
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
            <p class="text-neutral-500 animate-pulse text-sm">Memuat dokumen PR Internal...</p>
        </div>

        <div v-else-if="detail">
            <!-- Header Section -->
            <div class="flex flex-col md:flex-row gap-6 items-center mb-8 border-b pb-6 border-neutral-200">
                <div class="bg-neutral-100 p-4 rounded-2xl border border-neutral-200 shadow-sm">
                    <ClipboardListIcon class="w-12 h-12 text-neutral-700" />
                </div>

                <div class="flex-1 space-y-1 text-center md:text-left">
                    <div class="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                        <h1 class="text-3xl font-bold tracking-tight text-neutral-900">{{ detail.nama }}</h1>
                        <span
                            :class="`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${isApproved ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`"
                        >
                            {{ isApproved ? 'Approved' : 'Pending Approval' }}
                        </span>
                    </div>
                    <div class="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-neutral-500">
                        <span class="flex items-center gap-1.5 font-medium">
                            Vendor: <span class="text-neutral-800">{{ detail.vendor_name }}</span>
                        </span>
                        <span>•</span>
                        <span class="flex items-center gap-1.5">
                            Tanggal: {{ formatDate(detail.tanggal) }}
                        </span>
                        <span>•</span>
                        <span class="flex items-center gap-1.5 font-semibold text-neutral-700">
                            {{ detail.departemen }}
                        </span>
                    </div>
                </div>

                <div class="flex gap-2 w-full md:w-auto">
                    <Button @click="router.history.back()" variant="outline" class="flex-1 md:flex-none border-neutral-300">
                        <ArrowLeftIcon class="w-4 h-4 mr-2" /> Kembali
                    </Button>
                    <Button
                        v-if="canApprove && !isApproved"
                        @click="showApproveDialog = true"
                        class="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm"
                    >
                        <CheckCircleIcon class="w-4 h-4 mr-2" /> Setujui PR
                    </Button>
                </div>
            </div>

            <!-- Content Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Main Info and Items Table -->
                <div class="md:col-span-2 space-y-6">
                    <!-- PR Header Info Card -->
                    <Card class="overflow-hidden border border-neutral-200 shadow-sm bg-white">
                        <CardHeader class="bg-neutral-50/50 border-b border-neutral-200 pb-4">
                            <CardTitle class="text-sm font-bold flex items-center gap-2 text-neutral-900 uppercase tracking-wider">
                                <Info class="w-4 h-4 text-neutral-600" />
                                Informasi PR
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="pt-6">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                                <div class="space-y-1">
                                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Nama PR</p>
                                    <p class="text-lg font-bold text-neutral-950">{{ detail.nama }}</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Departemen</p>
                                    <p class="font-medium text-neutral-900">{{ detail.departemen }}</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tanggal</p>
                                    <p class="font-medium text-neutral-900">{{ formatDate(detail.tanggal) }}</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Projek</p>
                                    <p class="font-medium text-neutral-900">{{ detail.projek }}</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">ID Work Order</p>
                                    <p class="font-mono font-bold text-neutral-900">#{{ detail.id_wo }}</p>
                                </div>
                                <div class="space-y-1" v-if="detail.approved_at">
                                    <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tanggal Disetujui</p>
                                    <p class="font-medium text-emerald-700">{{ formatDate(detail.approved_at) }}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <!-- Items List Card -->
                    <Card class="overflow-hidden border border-neutral-200 shadow-sm bg-white">
                        <CardHeader class="bg-neutral-50/50 border-b border-neutral-200 pb-4">
                            <CardTitle class="text-sm font-bold flex items-center gap-2 text-neutral-900 uppercase tracking-wider">
                                <Briefcase class="w-4 h-4 text-neutral-600" />
                                Daftar Item ({{ detail.items?.length || 0 }})
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="p-0 border-t border-neutral-200">
                            <div class="overflow-x-auto">
                                <table class="w-full text-left border-collapse text-xs">
                                    <thead class="bg-neutral-50/50 text-neutral-600 font-semibold border-b border-neutral-200">
                                        <tr>
                                            <th class="p-4 w-[30%]">Nama Item</th>
                                            <th class="p-4 w-[12%]">Satuan</th>
                                            <th class="p-4 text-center w-[10%]">Qty</th>
                                            <th class="p-4 text-right w-[20%]">Est. Harga</th>
                                            <th class="p-4 text-right w-[20%]">Total Est.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="item in detail.items" :key="item.id_pr_internal_item" class="border-b border-neutral-200 last:border-0 hover:bg-neutral-50/20 text-neutral-900">
                                            <td class="p-4 font-semibold">
                                                <div>{{ item.item }}</div>
                                                <div class="text-[10px] text-neutral-500 font-normal mt-0.5" v-if="item.description">
                                                    {{ item.description }}
                                                </div>
                                            </td>
                                            <td class="p-4 text-neutral-700">{{ item.unit }}</td>
                                            <td class="p-4 text-center font-mono font-medium">{{ item.qty }}</td>
                                            <td class="p-4 text-right font-mono">{{ formatCurrency(item.est_price) }}</td>
                                            <td class="p-4 text-right font-mono font-semibold">{{ formatCurrency(item.qty * item.est_price) }}</td>
                                        </tr>
                                        <!-- Subtotals -->
                                        <tr class="bg-neutral-50/55 border-t-2 border-neutral-200 font-semibold text-neutral-950">
                                            <td colspan="2" class="p-4 text-right text-xs uppercase tracking-wider border-r border-neutral-200">Grand Totals:</td>
                                            <td class="p-4 text-center font-mono border-r border-neutral-200">{{ totalQty }} Items</td>
                                            <td class="border-r border-neutral-200"></td>
                                            <td class="p-4 text-right font-mono text-sm font-bold">{{ formatCurrency(grandTotal) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <!-- Sidebar: Vendor Info + Metadata -->
                <div class="space-y-6">
                    <!-- Vendor Info Card -->
                    <Card class="border border-neutral-200 shadow-sm bg-white">
                        <CardHeader class="bg-neutral-50/50 border-b border-neutral-200 pb-4">
                            <CardTitle class="text-xs font-bold text-neutral-950 uppercase tracking-wider flex items-center gap-2">
                                <Building2 class="w-4 h-4 text-neutral-600" />
                                Informasi Vendor
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="pt-6 space-y-4 text-sm">
                            <div class="space-y-1">
                                <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Nama Vendor</p>
                                <p class="font-bold text-neutral-900">{{ detail.vendor_name }}</p>
                            </div>
                            <div class="space-y-1" v-if="detail.vendor_address">
                                <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Alamat</p>
                                <div class="flex items-start gap-1.5 text-xs text-neutral-700">
                                    <MapPin class="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" />
                                    <span>{{ detail.vendor_address }}</span>
                                </div>
                            </div>
                            <div class="space-y-1" v-if="detail.vendor_telp">
                                <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">No. Telepon</p>
                                <div class="flex items-center gap-1.5 text-xs text-neutral-700">
                                    <Phone class="w-3.5 h-3.5 text-neutral-400" />
                                    <span>{{ detail.vendor_telp }}</span>
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
                                <span class="font-mono text-neutral-900">#{{ detail.id_pr_internal }}</span>
                            </div>
                            <Separator />
                            <div class="flex items-center justify-between">
                                <span class="text-neutral-500 flex items-center gap-2">
                                    <User class="w-3.5 h-3.5 text-neutral-400" /> User ID
                                </span>
                                <span class="font-mono text-neutral-900">#{{ detail.id_user }}</span>
                            </div>
                            <template v-if="detail.approved_by_user_id">
                                <Separator />
                                <div class="flex items-center justify-between">
                                    <span class="text-neutral-500 flex items-center gap-2">
                                        <CheckCircleIcon class="w-3.5 h-3.5 text-emerald-500" /> Approved By
                                    </span>
                                    <span class="font-mono text-emerald-700">#{{ detail.approved_by_user_id }}</span>
                                </div>
                            </template>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>

        <div v-else class="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
            <div class="bg-neutral-100 p-4 rounded-full border border-neutral-200">
                <ClipboardListIcon class="w-12 h-12 text-neutral-400" />
            </div>
            <h2 class="text-2xl font-bold text-neutral-900">Dokumen Tidak Ditemukan</h2>
            <p class="text-neutral-500">Maaf, data PR Internal yang Anda cari tidak tersedia.</p>
            <Button @click="router.navigate({ to: '/pr-internal' })" class="bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm border border-neutral-800">
                Kembali ke Daftar PR Internal
            </Button>
        </div>

        <!-- Approve Confirm Dialog -->
        <Teleport to="body">
            <Transition name="modal-fade">
                <div v-if="showApproveDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <!-- Backdrop -->
                    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showApproveDialog = false" />

                    <!-- Dialog -->
                    <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-neutral-200/80 p-6 z-10">
                        <div class="flex flex-col items-center text-center gap-4">
                            <div class="bg-emerald-100 border border-emerald-200 rounded-full p-4">
                                <CheckCircleIcon class="w-8 h-8 text-emerald-600" />
                            </div>
                            <div>
                                <h2 class="text-lg font-bold text-neutral-900">Konfirmasi Persetujuan</h2>
                                <p class="text-sm text-neutral-500 mt-2">
                                    Apakah Anda yakin ingin menyetujui PR Internal
                                    <span class="font-semibold text-neutral-800">{{ detail?.nama }}</span>?
                                    Tindakan ini tidak dapat dibatalkan.
                                </p>
                            </div>
                            <div class="flex gap-3 w-full pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    class="flex-1 border-neutral-300"
                                    @click="showApproveDialog = false"
                                    :disabled="isApproving"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="button"
                                    class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm"
                                    @click="confirmApprove"
                                    :disabled="isApproving"
                                >
                                    <CheckCircleIcon class="w-4 h-4 mr-2" v-if="!isApproving" />
                                    {{ isApproving ? 'Memproses...' : 'Ya, Setujui' }}
                                </Button>
                            </div>
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
