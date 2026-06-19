<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useParams, useRouter } from '@tanstack/vue-router';
import {
    ArrowLeftIcon, PlusIcon, Trash2Icon,
    ChevronDownIcon, ChevronUpIcon, PencilIcon, XIcon, CheckIcon
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import {
    getMasterPlanById,
    addMasterPlanItem,
    removeMasterPlanItem,
    upsertTargetHarian,
    upsertOutputHarian,
    upsertTargetProses,
    deleteTargetProses,
    type MasterPlanDetail,
    type MasterPlanItemDetail,
} from '@/api/master-plan/master-plan';
import { getWorkOrders, getWorkOrderById, type WorkOrderListItem, type WorkOrderShell } from '@/api/work-orders/work-orders';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { usePermission } from '@/composables/usePermission';

const router = useRouter();
const params = useParams({ strict: false }) as any;
const planId = computed(() => Number(params.value?.id));
const { hasPermission } = usePermission();

const canEdit = computed(() => hasPermission('MASTER_PLAN_UPDATE'));

// ─── State ────────────────────────────────────────────────────────────────────

const plan = ref<MasterPlanDetail | null>(null);
const isLoading = ref(false);
const woList = ref<WorkOrderListItem[]>([]);

// Expanded items
const expandedItems = ref<Set<number>>(new Set());

// Add-item dialog
const showAddItem = ref(false);
const newItemWoId = ref<number | ''>('');
const newItemShells = ref<WorkOrderShell[]>([]);
const newItemShellId = ref<number | ''>('');
const isLoadingNewItemShells = ref(false);
const isAddingItem = ref(false);

// Per-item date editing state
interface DayRow {
    tanggal: string;
    targetHarian: number;
    outputHarian: number;
    targetProses: string;
    isEditing: boolean;
    balanceTarget?: number;
    totalOutput?: number;
    balanceQty?: number;
}
const itemDayRows = ref<Record<number, DayRow[]>>({});
const savingItem = ref<Record<number, boolean>>({});

// New date range input per item
const dateRangeStart = ref<Record<number, string>>({});
const dateRangeEnd = ref<Record<number, string>>({});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const buildDayRows = (item: MasterPlanItemDetail): DayRow[] => {
    const targetMap = new Map(item.target_harian.map(t => [t.tanggal, t.target]));
    const outputMap = new Map(item.output_harian.map(o => [o.tanggal, o.output]));
    const prosesMap = new Map(item.target_proses.map(p => [p.tanggal, p.nama_proses]));

    const allDates = new Set([
        ...item.target_harian.map(t => t.tanggal),
        ...item.output_harian.map(o => o.tanggal),
        ...item.target_proses.map(p => p.tanggal),
    ]);
    const sorted = Array.from(allDates).sort();

    let cumTarget = 0;
    let cumOutput = 0;

    return sorted.map(tanggal => {
        const th = targetMap.get(tanggal) ?? 0;
        const oh = outputMap.get(tanggal) ?? 0;
        cumTarget += th;
        cumOutput += oh;
        return {
            tanggal,
            targetHarian: th,
            outputHarian: oh,
            targetProses: prosesMap.get(tanggal) ?? '',
            isEditing: false,
            balanceTarget: item.qty - cumTarget,
            totalOutput: cumOutput,
            balanceQty: item.qty - cumOutput,
        };
    });
};

const recalcRows = (rows: DayRow[], qty: number) => {
    let cumTarget = 0;
    let cumOutput = 0;
    for (const row of rows) {
        cumTarget += row.targetHarian;
        cumOutput += row.outputHarian;
        row.balanceTarget = qty - cumTarget;
        row.totalOutput = cumOutput;
        row.balanceQty = qty - cumOutput;
    }
};

const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${DAY_NAMES[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
};

// Generate all dates between start and end (inclusive), YYYY-MM-DD
const datesBetween = (start: string, end: string): string[] => {
    const result: string[] = [];
    const cur = new Date(start);
    const last = new Date(end);
    while (cur <= last) {
        result.push(cur.toISOString().slice(0, 10));
        cur.setDate(cur.getDate() + 1);
    }
    return result;
};

// ─── Load ─────────────────────────────────────────────────────────────────────

const load = async () => {
    isLoading.value = true;
    try {
        plan.value = await getMasterPlanById(planId.value);
        for (const item of plan.value.items) {
            itemDayRows.value[item.id_master_plan_item] = buildDayRows(item);
        }
    } catch {
        toast.error('Gagal memuat Master Plan');
    } finally {
        isLoading.value = false;
    }
};

onMounted(async () => {
    await Promise.all([
        load(),
        getWorkOrders({ limit: 1000 }).then(r => { woList.value = r.results; }),
    ]);
});

// ─── Add item: cascading WO → Shell ──────────────────────────────────────────

const onNewItemWoSelect = async (woId: number) => {
    newItemWoId.value = woId;
    newItemShellId.value = '';
    newItemShells.value = [];
    if (!woId) return;
    isLoadingNewItemShells.value = true;
    try {
        const detail = await getWorkOrderById(woId);
        newItemShells.value = detail.shells ?? [];
    } catch {
        toast.error('Gagal memuat shell WO');
    } finally {
        isLoadingNewItemShells.value = false;
    }
};

const resetAddItem = () => {
    showAddItem.value = false;
    newItemWoId.value = '';
    newItemShells.value = [];
    newItemShellId.value = '';
};

const handleAddItem = async () => {
    if (!newItemShellId.value) { toast.error('Pilih warna / shell WO'); return; }
    isAddingItem.value = true;
    try {
        const newItem = await addMasterPlanItem(planId.value, {
            id_wo_shell: newItemShellId.value as number,
            no_urut: (plan.value?.items.length ?? 0) + 1,
        });
        plan.value?.items.push(newItem);
        itemDayRows.value[newItem.id_master_plan_item] = [];
        resetAddItem();
        toast.success('WO Shell berhasil ditambahkan');
    } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Gagal menambah item');
    } finally {
        isAddingItem.value = false;
    }
};

// ─── Item actions ─────────────────────────────────────────────────────────────

const toggleExpand = (id: number) => {
    if (expandedItems.value.has(id)) expandedItems.value.delete(id);
    else expandedItems.value.add(id);
};

const handleRemoveItem = async (item: MasterPlanItemDetail) => {
    if (!confirm(`Hapus ${item.buyer} ${item.style} (${item.color || item.deskripsi}) dari plan ini?`)) return;
    try {
        await removeMasterPlanItem(planId.value, item.id_master_plan_item);
        plan.value!.items = plan.value!.items.filter(i => i.id_master_plan_item !== item.id_master_plan_item);
        delete itemDayRows.value[item.id_master_plan_item];
        toast.success('Item dihapus');
    } catch {
        toast.error('Gagal menghapus item');
    }
};

// ─── Day row actions ──────────────────────────────────────────────────────────

const addDateRange = (item: MasterPlanItemDetail) => {
    const start = dateRangeStart.value[item.id_master_plan_item];
    if (!start) { toast.error('Masukkan tanggal mulai'); return; }
    const end = dateRangeEnd.value[item.id_master_plan_item] || start;
    if (end < start) { toast.error('Tanggal akhir harus >= tanggal mulai'); return; }

    if (!itemDayRows.value[item.id_master_plan_item]) {
        itemDayRows.value[item.id_master_plan_item] = [];
    }
    const rows = itemDayRows.value[item.id_master_plan_item]!;
    const existing = new Set(rows.map(r => r.tanggal));
    const dates = datesBetween(start, end);
    let added = 0;
    for (const d of dates) {
        if (!existing.has(d)) {
            rows.push({ tanggal: d, targetHarian: 0, outputHarian: 0, targetProses: '', isEditing: true });
            added++;
        }
    }
    if (added === 0) { toast.error('Semua tanggal dalam rentang sudah ada'); return; }
    rows.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    recalcRows(rows, item.qty);
    dateRangeStart.value[item.id_master_plan_item] = '';
    dateRangeEnd.value[item.id_master_plan_item] = '';
    toast.success(`${added} tanggal ditambahkan`);
};

const startEdit = (row: DayRow) => { row.isEditing = true; };

const cancelEdit = (row: DayRow, item: MasterPlanItemDetail) => {
    row.isEditing = false;
    const serverItem = plan.value!.items.find(i => i.id_master_plan_item === item.id_master_plan_item);
    if (serverItem) {
        itemDayRows.value[item.id_master_plan_item] = buildDayRows(serverItem);
    }
};

const saveRow = async (row: DayRow, item: MasterPlanItemDetail) => {
    savingItem.value[item.id_master_plan_item] = true;
    try {
        const tasks: Promise<any>[] = [
            upsertTargetHarian(planId.value, item.id_master_plan_item, [{ tanggal: row.tanggal, target: row.targetHarian }]),
            upsertOutputHarian(planId.value, item.id_master_plan_item, [{ tanggal: row.tanggal, output: row.outputHarian }]),
        ];
        if (row.targetProses.trim()) {
            tasks.push(upsertTargetProses(planId.value, item.id_master_plan_item, { tanggal: row.tanggal, nama_proses: row.targetProses.trim() }));
        } else {
            tasks.push(deleteTargetProses(planId.value, item.id_master_plan_item, row.tanggal).catch(() => {}));
        }
        await Promise.all(tasks);
        row.isEditing = false;
        const rows = itemDayRows.value[item.id_master_plan_item];
        if (rows) recalcRows(rows, item.qty);
        toast.success(`Data ${row.tanggal} disimpan`);
    } catch {
        toast.error('Gagal menyimpan data');
    } finally {
        savingItem.value[item.id_master_plan_item] = false;
    }
};

const deleteRow = async (row: DayRow, item: MasterPlanItemDetail) => {
    if (!confirm(`Hapus data tanggal ${row.tanggal}?`)) return;
    try {
        await Promise.all([
            upsertTargetHarian(planId.value, item.id_master_plan_item, [{ tanggal: row.tanggal, target: 0 }]),
            upsertOutputHarian(planId.value, item.id_master_plan_item, [{ tanggal: row.tanggal, output: 0 }]),
            deleteTargetProses(planId.value, item.id_master_plan_item, row.tanggal).catch(() => {}),
        ]);
        const rows = itemDayRows.value[item.id_master_plan_item];
        if (rows) {
            const idx = rows.findIndex(r => r.tanggal === row.tanggal);
            if (idx !== -1) rows.splice(idx, 1);
            recalcRows(rows, item.qty);
        }
        toast.success('Baris dihapus');
    } catch {
        toast.error('Gagal menghapus baris');
    }
};

const usedShellIds = computed(() => new Set(plan.value?.items.map(i => i.id_wo_shell) ?? []));
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center gap-3 border-b pb-5 border-neutral-100">
            <Button variant="ghost" size="icon" @click="router.navigate({ to: '/master-plan' })">
                <ArrowLeftIcon class="w-4 h-4" />
            </Button>
            <div class="flex-1">
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900">
                    {{ plan?.nama || 'Master Plan' }}
                </h1>
                <p v-if="plan" class="text-[13px] text-neutral-500 mt-0.5">
                    {{ plan.nama_departemen }} · {{ plan.nama_line }}
                </p>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="flex items-center justify-center py-16">
            <Spinner class="w-6 h-6" />
        </div>

        <template v-else-if="plan">
            <!-- Add item panel -->
            <Card v-if="canEdit" class="p-4">
                <div v-if="!showAddItem" class="flex items-center justify-between">
                    <p class="text-sm text-neutral-500">{{ plan.items.length }} Work Order Shell dalam plan ini.</p>
                    <Button variant="outline" size="sm" @click="showAddItem = true">
                        <PlusIcon class="w-4 h-4 mr-1" />
                        Tambah WO
                    </Button>
                </div>
                <div v-else class="space-y-3">
                    <!-- WO selector -->
                    <select
                        :value="newItemWoId"
                        @change="onNewItemWoSelect(Number(($event.target as HTMLSelectElement).value))"
                        class="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                    >
                        <option value="">-- Pilih WO --</option>
                        <option v-for="wo in woList" :key="wo.id_wo" :value="wo.id_wo">
                            #{{ wo.id_wo }} — {{ wo.buyer }} {{ wo.model }} ({{ wo.qty }} pcs)
                        </option>
                    </select>
                    <!-- Shell selector -->
                    <div v-if="newItemWoId !== ''">
                        <div v-if="isLoadingNewItemShells" class="flex items-center gap-2 text-sm text-neutral-400 py-1">
                            <Spinner class="w-3 h-3" /> Memuat warna...
                        </div>
                        <div v-else-if="newItemShells.length === 0" class="text-sm text-neutral-400 italic">
                            WO ini tidak memiliki shell.
                        </div>
                        <select
                            v-else
                            v-model="newItemShellId"
                            class="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                        >
                            <option value="">-- Pilih Warna / Shell --</option>
                            <option
                                v-for="s in newItemShells.filter(s => !usedShellIds.has(s.id_wo_shell))"
                                :key="s.id_wo_shell"
                                :value="s.id_wo_shell"
                            >
                                {{ s.color || '(no color)' }} — {{ s.deskripsi }}
                            </option>
                        </select>
                    </div>
                    <div class="flex items-center gap-2 justify-end">
                        <Button size="sm" @click="handleAddItem" :disabled="isAddingItem || !newItemShellId">
                            <Spinner v-if="isAddingItem" class="w-4 h-4 mr-1" />
                            <CheckIcon v-else class="w-4 h-4 mr-1" />
                            Tambah
                        </Button>
                        <Button variant="ghost" size="sm" @click="resetAddItem">
                            <XIcon class="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </Card>

            <!-- Items -->
            <div v-if="plan.items.length === 0" class="text-center py-12 text-neutral-400">
                Belum ada WO. Tambahkan WO ke plan ini.
            </div>

            <div v-for="item in plan.items" :key="item.id_master_plan_item" class="border border-neutral-200 rounded-xl overflow-hidden">
                <!-- Item header -->
                <div
                    class="flex items-center justify-between px-4 py-3 bg-neutral-50 cursor-pointer hover:bg-neutral-100 transition-colors"
                    @click="toggleExpand(item.id_master_plan_item)"
                >
                    <div class="flex items-center gap-4">
                        <span class="text-xs font-bold text-neutral-400 w-5 text-center">{{ item.no_urut }}</span>
                        <div>
                            <p class="font-semibold text-neutral-900 text-sm">
                                {{ item.buyer }} — {{ item.style }}
                                <span v-if="item.color" class="text-neutral-400 font-normal">({{ item.color }})</span>
                            </p>
                            <p class="text-xs text-neutral-500">
                                WO #{{ item.id_wo }}
                                <span v-if="item.deskripsi"> · {{ item.deskripsi }}</span>
                                · QTY {{ item.qty.toLocaleString() }} pcs
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-neutral-500">
                            {{ itemDayRows[item.id_master_plan_item]?.length ?? 0 }} hari
                        </span>
                        <Button
                            v-if="canEdit"
                            variant="ghost"
                            size="icon"
                            class="text-red-400 hover:bg-red-50"
                            @click.stop="handleRemoveItem(item)"
                        >
                            <Trash2Icon class="w-4 h-4" />
                        </Button>
                        <ChevronDownIcon v-if="!expandedItems.has(item.id_master_plan_item)" class="w-4 h-4 text-neutral-400" />
                        <ChevronUpIcon v-else class="w-4 h-4 text-neutral-400" />
                    </div>
                </div>

                <!-- Daily data table -->
                <div v-if="expandedItems.has(item.id_master_plan_item)" class="p-4 space-y-3">
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm border-collapse min-w-[700px]">
                            <thead>
                                <tr class="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide">
                                    <th class="px-3 py-2 text-left border border-neutral-200 w-24">Tanggal</th>
                                    <th class="px-3 py-2 text-right border border-neutral-200 w-28">Target Harian</th>
                                    <th class="px-3 py-2 text-right border border-neutral-200 w-28 bg-blue-50 text-blue-600">Balance Target</th>
                                    <th class="px-3 py-2 text-right border border-neutral-200 w-28">Output Harian</th>
                                    <th class="px-3 py-2 text-right border border-neutral-200 w-28 bg-green-50 text-green-600">Total Output</th>
                                    <th class="px-3 py-2 text-right border border-neutral-200 w-28 bg-amber-50 text-amber-600">Balance QTY</th>
                                    <th class="px-3 py-2 text-left border border-neutral-200">Target Proses</th>
                                    <th v-if="canEdit" class="px-3 py-2 border border-neutral-200 w-20"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="itemDayRows[item.id_master_plan_item]?.length === 0">
                                    <td :colspan="canEdit ? 8 : 7" class="px-3 py-4 text-center text-neutral-400 italic border border-neutral-200">
                                        Belum ada data. Tambahkan rentang tanggal di bawah.
                                    </td>
                                </tr>
                                <tr
                                    v-for="row in itemDayRows[item.id_master_plan_item]"
                                    :key="row.tanggal"
                                    class="hover:bg-neutral-50"
                                >
                                    <td class="px-3 py-2 border border-neutral-200 font-mono text-xs whitespace-nowrap">
                                        {{ row.tanggal }}<br/>
                                        <span class="text-neutral-400">{{ formatDateShort(row.tanggal) }}</span>
                                    </td>
                                    <!-- Target Harian -->
                                    <td class="px-3 py-2 border border-neutral-200 text-right">
                                        <input
                                            v-if="row.isEditing"
                                            v-model.number="row.targetHarian"
                                            type="number"
                                            min="0"
                                            class="w-full text-right border border-neutral-300 rounded px-2 py-0.5 text-sm"
                                            @input="() => { const r = itemDayRows[item.id_master_plan_item]; if (r) recalcRows(r, item.qty); }"
                                        />
                                        <span v-else>{{ row.targetHarian.toLocaleString() }}</span>
                                    </td>
                                    <!-- Balance Target (computed) -->
                                    <td class="px-3 py-2 border border-neutral-200 text-right bg-blue-50/50 text-blue-700 font-medium">
                                        {{ row.balanceTarget?.toLocaleString() }}
                                    </td>
                                    <!-- Output Harian -->
                                    <td class="px-3 py-2 border border-neutral-200 text-right">
                                        <input
                                            v-if="row.isEditing"
                                            v-model.number="row.outputHarian"
                                            type="number"
                                            min="0"
                                            class="w-full text-right border border-neutral-300 rounded px-2 py-0.5 text-sm"
                                            @input="() => { const r = itemDayRows[item.id_master_plan_item]; if (r) recalcRows(r, item.qty); }"
                                        />
                                        <span v-else>{{ row.outputHarian.toLocaleString() }}</span>
                                    </td>
                                    <!-- Total Output (computed) -->
                                    <td class="px-3 py-2 border border-neutral-200 text-right bg-green-50/50 text-green-700 font-medium">
                                        {{ row.totalOutput?.toLocaleString() }}
                                    </td>
                                    <!-- Balance QTY (computed) -->
                                    <td class="px-3 py-2 border border-neutral-200 text-right bg-amber-50/50 font-medium"
                                        :class="(row.balanceQty ?? 0) <= 0 ? 'text-green-600' : 'text-amber-700'">
                                        {{ row.balanceQty?.toLocaleString() }}
                                    </td>
                                    <!-- Target Proses -->
                                    <td class="px-3 py-2 border border-neutral-200">
                                        <input
                                            v-if="row.isEditing"
                                            v-model="row.targetProses"
                                            type="text"
                                            placeholder="Contoh: LAYOUT, 1ST OUTPUT..."
                                            class="w-full border border-neutral-300 rounded px-2 py-0.5 text-sm"
                                        />
                                        <span v-else class="text-xs text-purple-700 font-medium">{{ row.targetProses }}</span>
                                    </td>
                                    <!-- Actions -->
                                    <td v-if="canEdit" class="px-2 py-2 border border-neutral-200">
                                        <div class="flex items-center gap-1 justify-center">
                                            <template v-if="row.isEditing">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    class="w-7 h-7 text-green-600"
                                                    :disabled="savingItem[item.id_master_plan_item]"
                                                    @click="saveRow(row, item)"
                                                >
                                                    <Spinner v-if="savingItem[item.id_master_plan_item]" class="w-3 h-3" />
                                                    <CheckIcon v-else class="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    class="w-7 h-7 text-neutral-400"
                                                    @click="cancelEdit(row, item)"
                                                >
                                                    <XIcon class="w-4 h-4" />
                                                </Button>
                                            </template>
                                            <template v-else>
                                                <Button size="icon" variant="ghost" class="w-7 h-7" @click="startEdit(row)">
                                                    <PencilIcon class="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    class="w-7 h-7 text-red-400"
                                                    @click="deleteRow(row, item)"
                                                >
                                                    <Trash2Icon class="w-3.5 h-3.5" />
                                                </Button>
                                            </template>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Add date range row -->
                    <div v-if="canEdit" class="flex flex-wrap items-center gap-2 pt-1">
                        <div class="flex items-center gap-1 text-sm text-neutral-500">
                            <span>Dari</span>
                            <input
                                v-model="dateRangeStart[item.id_master_plan_item]"
                                type="date"
                                class="border border-neutral-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
                            />
                            <span>s/d</span>
                            <input
                                v-model="dateRangeEnd[item.id_master_plan_item]"
                                type="date"
                                :min="dateRangeStart[item.id_master_plan_item]"
                                class="border border-neutral-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
                            />
                        </div>
                        <Button variant="outline" size="sm" @click="addDateRange(item)">
                            <PlusIcon class="w-4 h-4 mr-1" />
                            Tambah Tanggal
                        </Button>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>
