<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useParams, useRouter } from '@tanstack/vue-router';
import {
    ArrowLeftIcon,
    FileTextIcon,
    Layers2Icon,
    ScissorsIcon,
    ClipboardListIcon,
    CheckCircleIcon,
    CalendarIcon,
    HashIcon,
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { getWorkOrderById, closeWorkOrder, type WorkOrderDetailResponse, type WorkOrderShell } from '@/api/work-orders/work-orders';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/formatter';
import WOShellSizeSheet from './WOShellSizeSheet.vue';

import { usePermission } from '@/composables/usePermission';

const router = useRouter();
const { hasPermission } = usePermission();
const params = useParams({ from: '/_authenticated/work-order/$id' });
const id = computed(() => params.value.id);

const detail = ref<WorkOrderDetailResponse | null>(null);
const isLoading = ref(true);

// Sheet state untuk sizes
const isSheetOpen = ref(false);
const selectedShell = ref<WorkOrderShell | null>(null);

const canClose = computed(() => {
    return hasPermission('WO_CLOSE');
});

const isWOOpen = computed(() => detail.value?.status?.toLowerCase() === 'open');

const fetchDetail = async () => {
    isLoading.value = true;
    try {
        detail.value = await getWorkOrderById(id.value);
    } catch (e) {
        console.error('Gagal fetch Work Order detail:', e);
        toast.error('Gagal memuat data Work Order.');
    } finally {
        isLoading.value = false;
    }
};

const handleCloseWO = async () => {
    if (!confirm('Apakah Anda yakin ingin menyelesaikan/menutup Work Order ini? Status penutupan tidak dapat diubah.')) return;
    try {
        await closeWorkOrder(id.value);
        toast.success('Work Order berhasil diselesaikan/ditutup.');
        await fetchDetail();
    } catch (error: any) {
        toast.error(error.response?.data?.message || 'Gagal menutup Work Order.');
    }
};

const openShellSizes = (shell: WorkOrderShell) => {
    selectedShell.value = shell;
    isSheetOpen.value = true;
};

onMounted(fetchDetail);
</script>

<template>
    <div class="container mx-auto py-8 max-w-6xl">
        <!-- Loading State -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <div class="w-8 h-8 border-4 border-neutral-200 border-t-neutral-700 rounded-full animate-spin" />
            <p class="text-neutral-500 animate-pulse text-sm">Memuat data Work Order...</p>
        </div>

        <!-- Detail Content -->
        <div v-else-if="detail">
            <!-- Page Header -->
            <div class="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8 border-b pb-6 border-neutral-200">
                <div class="flex items-center gap-4">
                    <div class="bg-neutral-100 p-3.5 rounded-2xl border border-neutral-200 shadow-sm">
                        <FileTextIcon class="w-8 h-8 text-neutral-700" />
                    </div>
                    <div>
                        <div class="flex items-center gap-2.5">
                            <h1 class="text-2xl font-bold tracking-tight text-neutral-900">
                                WO #{{ detail.id_wo }}
                            </h1>
                            <span
                                :class="[
                                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                    isWOOpen
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                                ]"
                            >
                                {{ detail.status }}
                            </span>
                        </div>
                        <p class="text-sm text-neutral-500 mt-0.5">
                            {{ detail.buyer }} · {{ detail.model }}
                        </p>
                    </div>
                </div>

                <div class="flex gap-2.5 w-full md:w-auto">
                    <Button
                        @click="router.navigate({ to: '/work-order' })"
                        variant="outline"
                        class="flex-1 md:flex-none border-neutral-300 shadow-xs"
                    >
                        <ArrowLeftIcon class="w-4 h-4 mr-2" />
                        Kembali
                    </Button>
                    <Button
                        v-if="canClose && isWOOpen"
                        @click="handleCloseWO"
                        class="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 shadow-xs"
                    >
                        <CheckCircleIcon class="w-4 h-4 mr-2" />
                        Selesaikan WO
                    </Button>
                </div>
            </div>

            <!-- Two-column layout -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

                <!-- LEFT SIDEBAR — Info Utama -->
                <div class="space-y-4">
                    <!-- Info Card -->
                    <div class="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                        <div class="bg-neutral-50 border-b border-neutral-200 px-4 py-3">
                            <h2 class="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
                                <FileTextIcon class="w-3.5 h-3.5 text-neutral-500" />
                                Informasi Work Order
                            </h2>
                        </div>
                        <div class="p-4 space-y-4">
                            <div class="space-y-1">
                                <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Buyer</p>
                                <p class="font-semibold text-neutral-900 text-sm">{{ detail.buyer }}</p>
                            </div>
                            <Separator />
                            <div class="space-y-1">
                                <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Model / Style</p>
                                <p class="font-semibold text-neutral-900 text-sm">{{ detail.model }}</p>
                            </div>
                            <Separator />
                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-1">
                                    <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Qty</p>
                                    <p class="font-mono font-bold text-neutral-900 text-sm">{{ detail.qty.toLocaleString('id-ID') }} pcs</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Maklon</p>
                                    <span
                                        :class="[
                                            'inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold',
                                            detail.fob_cmt
                                                ? 'bg-indigo-100 text-indigo-800'
                                                : 'bg-orange-100 text-orange-800'
                                        ]"
                                    >
                                        {{ detail.fob_cmt ? 'FOB' : 'CMT' }}
                                    </span>
                                </div>
                            </div>
                            <Separator />
                            <div class="space-y-1">
                                <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                                    <CalendarIcon class="w-3 h-3" /> Delivery Date
                                </p>
                                <p class="font-semibold text-neutral-900 text-sm">{{ formatDate(detail.delivery) }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- PO Info Card -->
                    <div class="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                        <div class="bg-neutral-50 border-b border-neutral-200 px-4 py-3">
                            <h2 class="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
                                <HashIcon class="w-3.5 h-3.5 text-neutral-500" />
                                Referensi PO Client
                            </h2>
                        </div>
                        <div class="p-4 space-y-4">
                            <div class="space-y-1">
                                <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">PO Number</p>
                                <p class="font-mono font-bold text-neutral-900 text-sm">{{ detail.po_number }}</p>
                            </div>
                            <Separator />
                            <div class="space-y-1">
                                <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">PO Item Style</p>
                                <p class="font-semibold text-neutral-900 text-sm">{{ detail.po_client_item_style }}</p>
                            </div>
                            <Separator />
                            <div class="space-y-1">
                                <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                                    <CalendarIcon class="w-3 h-3" /> Created At
                                </p>
                                <p class="text-neutral-700 text-xs">{{ formatDate(detail.created_at) }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- RIGHT — Main Content -->
                <div class="md:col-span-2 space-y-6">

                    <!-- WO Shells Table -->
                    <div class="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                        <div class="bg-neutral-50 border-b border-neutral-200 px-5 py-3.5 flex items-center justify-between">
                            <h2 class="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
                                <Layers2Icon class="w-3.5 h-3.5 text-neutral-500" />
                                WO Shells — Kain Utama ({{ detail.shells?.length || 0 }})
                            </h2>
                            <span class="text-[10px] font-semibold text-neutral-400">Klik baris untuk melihat Sizes</span>
                        </div>

                        <div v-if="!detail.shells || detail.shells.length === 0" class="text-center py-10 text-neutral-400 text-sm">
                            Tidak ada data shell kain.
                        </div>
                        <div v-else class="overflow-x-auto">
                            <table class="w-full text-left border-collapse text-xs">
                                <thead class="bg-neutral-50/50 border-b border-neutral-200">
                                    <tr>
                                        <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Fabric</th>
                                        <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Color</th>
                                        <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider text-right">Cons (yd)</th>
                                        <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider text-right">Allow</th>
                                        <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider text-right">Berat/yd</th>
                                        <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider text-center">Sizes</th>
                                        <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-neutral-100">
                                    <tr
                                        v-for="shell in detail.shells"
                                        :key="shell.id_wo_shell"
                                        class="hover:bg-neutral-50 cursor-pointer transition-colors group"
                                        @click="openShellSizes(shell)"
                                    >
                                        <td class="px-4 py-3.5 font-semibold text-neutral-800">{{ shell.fabric }}</td>
                                        <td class="px-4 py-3.5">
                                            <span class="inline-flex items-center gap-1.5 font-medium text-neutral-700">
                                                <span
                                                    class="w-2.5 h-2.5 rounded-full border border-neutral-300 flex-shrink-0"
                                                    :style="{ backgroundColor: shell.color.toLowerCase() === 'white' ? '#f5f5f5' : shell.color.toLowerCase() === 'black' ? '#1c1c1e' : shell.color.toLowerCase() }"
                                                />
                                                {{ shell.color }}
                                            </span>
                                        </td>
                                        <td class="px-4 py-3.5 font-mono text-neutral-700 text-right">{{ shell.cons }}</td>
                                        <td class="px-4 py-3.5 font-mono text-neutral-700 text-right">{{ shell.allow }}%</td>
                                        <td class="px-4 py-3.5 font-mono text-neutral-700 text-right">{{ shell.berat_1_yd }} kg</td>
                                        <td class="px-4 py-3.5 text-center">
                                            <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-[10px] font-bold">
                                                {{ shell.sizes?.length || 0 }} ukuran
                                            </span>
                                        </td>
                                        <td class="px-4 py-3.5 text-center">
                                            <button
                                                type="button"
                                                @click.stop="openShellSizes(shell)"
                                                class="text-[10px] font-semibold text-neutral-500 group-hover:text-neutral-800 underline underline-offset-2 transition-colors"
                                            >
                                                Lihat Sizes →
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Trims Table -->
                    <div class="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                        <div class="bg-neutral-50 border-b border-neutral-200 px-5 py-3.5">
                            <h2 class="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
                                <ScissorsIcon class="w-3.5 h-3.5 text-neutral-500" />
                                Trims — Aksesoris ({{ detail.trims?.length || 0 }})
                            </h2>
                        </div>
                        <div v-if="!detail.trims || detail.trims.length === 0" class="text-center py-8 text-neutral-400 text-sm">
                            Tidak ada data trim aksesoris.
                        </div>
                        <div v-else class="overflow-x-auto">
                            <table class="w-full text-left border-collapse text-xs">
                                <thead class="bg-neutral-50/50 border-b border-neutral-200">
                                    <tr>
                                        <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Item</th>
                                        <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Code</th>
                                        <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Color</th>
                                        <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider text-right">Cons</th>
                                        <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider text-right">Qty</th>
                                        <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">UOM</th>
                                        <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Position</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-neutral-100">
                                    <tr v-for="trim in detail.trims" :key="trim.id_wo_trim" class="hover:bg-neutral-50/40">
                                        <td class="px-4 py-3 font-semibold text-neutral-800">{{ trim.item }}</td>
                                        <td class="px-4 py-3 font-mono text-neutral-600">{{ trim.code }}</td>
                                        <td class="px-4 py-3 text-neutral-700">{{ trim.color }}</td>
                                        <td class="px-4 py-3 font-mono text-right text-neutral-700">{{ trim.cons }}</td>
                                        <td class="px-4 py-3 font-mono font-medium text-right text-neutral-800">{{ trim.qty }}</td>
                                        <td class="px-4 py-3 text-neutral-600">{{ trim.uom }}</td>
                                        <td class="px-4 py-3 text-neutral-500">{{ trim.position || '—' }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Material Lists Table -->
                    <div class="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                        <div class="bg-neutral-50 border-b border-neutral-200 px-5 py-3.5">
                            <h2 class="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
                                <ClipboardListIcon class="w-3.5 h-3.5 text-neutral-500" />
                                Material List ({{ detail.material_lists?.length || 0 }})
                            </h2>
                        </div>
                        <div v-if="!detail.material_lists || detail.material_lists.length === 0" class="text-center py-8 text-neutral-400 text-sm">
                            Tidak ada data material list.
                        </div>
                        <div v-else class="overflow-x-auto">
                            <table class="w-full text-left border-collapse text-xs">
                                <thead class="bg-neutral-50/50 border-b border-neutral-200">
                                    <tr>
                                        <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Description</th>
                                        <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Size</th>
                                        <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Color</th>
                                        <th class="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">UOM</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-neutral-100">
                                    <tr v-for="mat in detail.material_lists" :key="mat.id_material_list" class="hover:bg-neutral-50/40">
                                        <td class="px-4 py-3 font-medium text-neutral-800">{{ mat.description }}</td>
                                        <td class="px-4 py-3 text-neutral-600">{{ mat.size }}</td>
                                        <td class="px-4 py-3 text-neutral-700">{{ mat.color }}</td>
                                        <td class="px-4 py-3 text-neutral-600">{{ mat.uom }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Not Found State -->
        <div v-else class="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
            <div class="bg-neutral-100 p-4 rounded-full border border-neutral-200">
                <FileTextIcon class="w-12 h-12 text-neutral-400" />
            </div>
            <h2 class="text-2xl font-bold text-neutral-900">Work Order Tidak Ditemukan</h2>
            <p class="text-neutral-500">Data Work Order yang Anda cari tidak tersedia.</p>
            <Button @click="router.navigate({ to: '/work-order' })" class="bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm border border-neutral-800">
                Kembali ke Daftar WO
            </Button>
        </div>

        <!-- Shell Size Sheet -->
        <WOShellSizeSheet
            :is-open="isSheetOpen"
            :shell="selectedShell"
            @update:is-open="isSheetOpen = $event"
        />
    </div>
</template>
