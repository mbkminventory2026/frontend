<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter } from '@tanstack/vue-router';
import {
    ClipboardListIcon, SearchIcon, ChevronDownIcon, ChevronRightIcon,
    LockIcon, UnlockIcon, PackageIcon, TruckIcon,
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { getMaterialLists, getMaterialListItems, type MaterialListPageItem } from '@/api/material-list/material-list';
import type { MaterialListItem } from '@/api/work-orders/work-orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

// ─── State ─────────────────────────────────────────────
const router = useRouter();
const data = ref<MaterialListPageItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);
const search = ref('');
const lockedOnly = ref(false);
const page = ref(1);
const pageSize = 20;

// Expanded ML rows → fetch items
const expandedIds = ref<Set<number>>(new Set());
const itemsCache = ref<Map<number, MaterialListItem[]>>(new Map());
const loadingItems = ref<Set<number>>(new Set());

// ─── Fetch ML list ──────────────────────────────────────
const fetchData = async () => {
    isLoading.value = true;
    try {
        const offset = (page.value - 1) * pageSize;
        const res = await getMaterialLists({
            limit: pageSize,
            offset,
            search: search.value,
            locked_only: lockedOnly.value,
        });
        data.value = res.results;
        totalCount.value = res.count;
    } catch {
        toast.error('Gagal memuat data material list.');
    } finally {
        isLoading.value = false;
    }
};

onMounted(fetchData);

let searchTimer: ReturnType<typeof setTimeout>;
watch(search, () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        page.value = 1;
        fetchData();
    }, 350);
});
watch(lockedOnly, () => { page.value = 1; fetchData(); });

// ─── Toggle expand ML row ───────────────────────────────
const toggleExpand = async (ml: MaterialListPageItem) => {
    const id = ml.id_material_list;
    if (expandedIds.value.has(id)) {
        expandedIds.value.delete(id);
        return;
    }
    expandedIds.value.add(id);
    if (itemsCache.value.has(id)) return;

    loadingItems.value.add(id);
    try {
        const res = await getMaterialListItems(id);
        itemsCache.value.set(id, res?.items ?? []);
    } catch {
        toast.error('Gagal memuat item material list.');
        expandedIds.value.delete(id);
    } finally {
        loadingItems.value.delete(id);
    }
};

// ─── Progress helpers ───────────────────────────────────
const pct = (val: number, total: number) => total > 0 ? Math.min(100, Math.round((val / total) * 100)) : 0;

const totalPages = ref(0);
watch(totalCount, (v) => { totalPages.value = Math.ceil(v / pageSize); });
</script>

<template>
    <div class="container mx-auto py-6 max-w-6xl space-y-4">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-2">
                <ClipboardListIcon class="w-5 h-5 text-neutral-600" />
                <h1 class="text-xl font-bold text-neutral-900">Material List</h1>
                <span class="text-xs bg-neutral-100 text-neutral-600 border border-neutral-200 rounded-full px-2 py-0.5 font-medium">{{ totalCount }} ML</span>
            </div>
            <div class="flex items-center gap-3">
                <div class="flex items-center gap-2">
                    <Switch :id="'locked-toggle'" v-model:checked="lockedOnly" />
                    <Label for="locked-toggle" class="text-sm text-neutral-600 flex items-center gap-1 cursor-pointer">
                        <LockIcon class="w-3.5 h-3.5" />
                        Hanya yang terkunci
                    </Label>
                </div>
            </div>
        </div>

        <!-- Search -->
        <div class="relative">
            <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input v-model="search" placeholder="Cari buyer, model, atau nama ML..." class="pl-9 text-sm" />
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="flex items-center justify-center py-16">
            <Spinner class="w-7 h-7" />
        </div>

        <!-- Empty -->
        <div v-else-if="data.length === 0" class="text-center py-16 text-neutral-400 text-sm border border-neutral-200 rounded-xl bg-neutral-50">
            <ClipboardListIcon class="w-10 h-10 mx-auto mb-3 text-neutral-300" />
            Tidak ada material list ditemukan.
        </div>

        <!-- Material List Accordion -->
        <div v-else class="space-y-2">
            <div
                v-for="ml in data"
                :key="ml.id_material_list"
                class="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden"
            >
                <!-- ML Header Row -->
                <button
                    class="w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-neutral-50 transition-colors"
                    @click="toggleExpand(ml)"
                >
                    <component
                        :is="expandedIds.has(ml.id_material_list) ? ChevronDownIcon : ChevronRightIcon"
                        class="w-4 h-4 text-neutral-400 shrink-0"
                    />
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="font-semibold text-sm text-neutral-900 truncate">{{ ml.buyer }}</span>
                            <span class="text-neutral-400 text-xs">—</span>
                            <span class="text-neutral-700 text-sm truncate">{{ ml.model }}</span>
                            <span v-if="ml.is_locked" class="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 border border-amber-400 text-amber-600 rounded font-medium">
                                <LockIcon class="w-2.5 h-2.5" /> Locked
                            </span>
                            <span v-else class="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 border border-neutral-300 text-neutral-500 rounded font-medium">
                                <UnlockIcon class="w-2.5 h-2.5" /> Draft
                            </span>
                        </div>
                        <div class="text-xs text-neutral-500 mt-0.5">{{ ml.name }} &middot; {{ ml.item_count }} item</div>
                    </div>
                    <!-- Progress summary -->
                    <div class="hidden sm:flex flex-col items-end gap-1 text-xs text-neutral-500 shrink-0 min-w-[140px]">
                        <div class="flex items-center gap-1.5 w-full">
                            <TruckIcon class="w-3 h-3 text-blue-400 shrink-0" />
                            <Progress :model-value="pct(ml.total_qty_sj, ml.wo_qty)" class="h-1.5 flex-1" />
                            <span class="w-8 text-right">{{ pct(ml.total_qty_sj, ml.wo_qty) }}%</span>
                        </div>
                        <div class="flex items-center gap-1.5 w-full">
                            <PackageIcon class="w-3 h-3 text-green-400 shrink-0" />
                            <Progress :model-value="pct(ml.total_qty_received, ml.wo_qty)" class="h-1.5 flex-1" />
                            <span class="w-8 text-right">{{ pct(ml.total_qty_received, ml.wo_qty) }}%</span>
                        </div>
                    </div>
                </button>

                <!-- ML Items Table (expanded) -->
                <div v-if="expandedIds.has(ml.id_material_list)" class="border-t border-neutral-100">
                    <div v-if="loadingItems.has(ml.id_material_list)" class="flex items-center justify-center py-6">
                        <Spinner class="w-5 h-5" />
                    </div>
                    <div v-else-if="!itemsCache.get(ml.id_material_list)?.length" class="text-center py-5 text-neutral-400 text-xs">
                        Tidak ada item.
                    </div>
                    <div v-else class="overflow-x-auto">
                        <table class="w-full text-left text-xs">
                            <thead class="bg-neutral-50/80 border-b border-neutral-100">
                                <tr>
                                    <th class="px-4 py-2 font-bold text-neutral-500 uppercase tracking-wider">Item</th>
                                    <th class="px-4 py-2 font-bold text-neutral-500 uppercase tracking-wider">Deskripsi</th>
                                    <th class="px-4 py-2 font-bold text-neutral-500 uppercase tracking-wider text-right">Qty WO</th>
                                    <th class="px-4 py-2 font-bold text-neutral-500 uppercase tracking-wider text-right">SJ</th>
                                    <th class="px-4 py-2 font-bold text-neutral-500 uppercase tracking-wider text-right">Received</th>
                                    <th class="px-4 py-2 font-bold text-neutral-500 uppercase tracking-wider">Unit</th>
                                    <th class="px-4 py-2"></th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-neutral-100">
                                <tr
                                    v-for="item in itemsCache.get(ml.id_material_list)"
                                    :key="item.id_material_list_item"
                                    class="hover:bg-neutral-50/60"
                                >
                                    <td class="px-4 py-2.5 font-medium text-neutral-800">{{ item.item }}</td>
                                    <td class="px-4 py-2.5 text-neutral-500 max-w-[200px] truncate">{{ item.description || '—' }}</td>
                                    <td class="px-4 py-2.5 text-neutral-700 text-right">{{ item.qty }}</td>
                                    <td class="px-4 py-2.5 text-right">
                                        <span :class="item.qty_surat_jalan > 0 ? 'text-blue-700 font-semibold' : 'text-neutral-400'">
                                            {{ item.qty_surat_jalan }}
                                        </span>
                                    </td>
                                    <td class="px-4 py-2.5 text-right">
                                        <span :class="item.qty_received > 0 ? 'text-green-700 font-semibold' : 'text-neutral-400'">
                                            {{ item.qty_received }}
                                        </span>
                                    </td>
                                    <td class="px-4 py-2.5 text-neutral-500">{{ item.unit }}</td>
                                    <td class="px-4 py-2.5">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            class="text-xs h-7 px-2"
                                            @click="router.navigate({ to: '/material-list/$id', params: { id: String(item.id_material_list_item) } })"
                                        >
                                            Action
                                        </Button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-between pt-2">
            <span class="text-xs text-neutral-500">{{ totalCount }} total &middot; halaman {{ page }} / {{ totalPages }}</span>
            <div class="flex gap-2">
                <Button variant="outline" size="sm" :disabled="page <= 1" @click="page--; fetchData()">Sebelumnya</Button>
                <Button variant="outline" size="sm" :disabled="page >= totalPages" @click="page++; fetchData()">Berikutnya</Button>
            </div>
        </div>
    </div>

</template>
