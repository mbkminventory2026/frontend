<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from '@tanstack/vue-router';
import { ArrowLeftIcon, PlusIcon, Trash2Icon, SaveIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { createMasterPlan } from '@/api/master-plan/master-plan';
import { getDepartemen } from '@/api/departemen/departemen';
import { getProductionLines, type ProductionLine } from '@/api/production-master/production-master';
import { getWorkOrders, getWorkOrderById, type WorkOrderListItem, type WorkOrderShell } from '@/api/work-orders/work-orders';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

const router = useRouter();

// Dropdown data
const departemenList = ref<{ id_departemen: number; nama_departemen: string }[]>([]);
const lineList = ref<ProductionLine[]>([]);
const woList = ref<WorkOrderListItem[]>([]);

// Form state
const selectedDepartemenId = ref<number | ''>('');
const selectedLineId = ref<number | ''>('');
const nama = ref('');

interface ItemEntry {
    id_wo: number | '';
    id_wo_shell: number | '';
    no_urut: number;
    shells: WorkOrderShell[];
    isLoadingShells: boolean;
}
const items = ref<ItemEntry[]>([]);

const isSubmitting = ref(false);
const isLoadingData = ref(false);

onMounted(async () => {
    isLoadingData.value = true;
    try {
        const [deptRes, lineRes, woRes] = await Promise.all([
            getDepartemen({ limit: 1000 }),
            getProductionLines({ limit: 1000 }),
            getWorkOrders({ limit: 1000 }),
        ]);
        departemenList.value = deptRes.results as any[];
        lineList.value = lineRes.results;
        woList.value = woRes.results;
    } catch {
        toast.error('Gagal memuat data referensi');
    } finally {
        isLoadingData.value = false;
    }
});

const addItem = () => {
    items.value.push({ id_wo: '', id_wo_shell: '', no_urut: items.value.length + 1, shells: [], isLoadingShells: false });
};

const removeItem = (index: number) => {
    items.value.splice(index, 1);
    items.value.forEach((item, i) => { item.no_urut = i + 1; });
};

const onWoSelect = async (index: number, woId: number) => {
    const item = items.value[index];
    if (!item) return;
    item.id_wo = woId;
    item.id_wo_shell = '';
    item.shells = [];
    if (!woId) return;
    item.isLoadingShells = true;
    try {
        const detail = await getWorkOrderById(woId);
        item.shells = detail.shells ?? [];
    } catch {
        toast.error('Gagal memuat data shell WO');
    } finally {
        item.isLoadingShells = false;
    }
};

const handleSubmit = async () => {
    if (!selectedDepartemenId.value) { toast.error('Pilih departemen'); return; }
    if (!selectedLineId.value) { toast.error('Pilih line produksi'); return; }

    const validItems = items.value.filter(it => it.id_wo_shell !== '');
    const duplicateShell = validItems.length !== new Set(validItems.map(it => it.id_wo_shell)).size;
    if (duplicateShell) { toast.error('Shell WO tidak boleh duplikat'); return; }

    isSubmitting.value = true;
    try {
        const result = await createMasterPlan({
            id_departemen: selectedDepartemenId.value as number,
            id_production_line: selectedLineId.value as number,
            nama: nama.value.trim(),
            items: validItems.map(it => ({ id_wo_shell: it.id_wo_shell as number, no_urut: it.no_urut })),
        });
        toast.success('Master Plan berhasil dibuat');
        router.navigate({ to: '/master-plan/$id', params: { id: String(result.id_master_plan) } });
    } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Gagal membuat Master Plan');
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<template>
    <div class="space-y-6 max-w-3xl">
        <!-- Header -->
        <div class="flex items-center gap-3 border-b pb-5 border-neutral-100">
            <Button variant="ghost" size="icon" @click="router.navigate({ to: '/master-plan' })">
                <ArrowLeftIcon class="w-4 h-4" />
            </Button>
            <div>
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900">Buat Master Plan</h1>
                <p class="text-[13px] text-neutral-500 mt-0.5">Tentukan departemen, line, dan WO yang masuk ke plan ini.</p>
            </div>
        </div>

        <div v-if="isLoadingData" class="flex items-center justify-center py-12">
            <Spinner class="w-6 h-6" />
        </div>

        <template v-else>
            <!-- Header form -->
            <Card class="p-5 space-y-4">
                <h2 class="font-semibold text-neutral-800">Informasi Plan</h2>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-1.5">
                        <Label>Departemen <span class="text-red-500">*</span></Label>
                        <select
                            v-model="selectedDepartemenId"
                            class="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                        >
                            <option value="">-- Pilih Departemen --</option>
                            <option v-for="d in departemenList" :key="d.id_departemen" :value="d.id_departemen">
                                {{ d.nama_departemen }}
                            </option>
                        </select>
                    </div>

                    <div class="space-y-1.5">
                        <Label>Line Produksi <span class="text-red-500">*</span></Label>
                        <select
                            v-model="selectedLineId"
                            class="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                        >
                            <option value="">-- Pilih Line --</option>
                            <option v-for="l in lineList" :key="l.id_production_line" :value="l.id_production_line">
                                {{ l.name }}
                            </option>
                        </select>
                    </div>
                </div>

                <div class="space-y-1.5">
                    <Label>Nama Plan (opsional)</Label>
                    <Input v-model="nama" placeholder="Contoh: Plan Sewing Q1 2026" />
                </div>
            </Card>

            <!-- Items -->
            <Card class="p-5 space-y-4">
                <div class="flex items-center justify-between">
                    <h2 class="font-semibold text-neutral-800">Work Order Shell dalam Plan</h2>
                    <Button variant="outline" size="sm" @click="addItem">
                        <PlusIcon class="w-4 h-4 mr-1" />
                        Tambah Item
                    </Button>
                </div>

                <p v-if="items.length === 0" class="text-sm text-neutral-400 italic py-3 text-center">
                    Belum ada item. Klik "Tambah Item" atau tambahkan setelah plan dibuat.
                </p>

                <div v-for="(item, index) in items" :key="index" class="border border-neutral-200 rounded-lg p-3 space-y-2">
                    <div class="flex items-center gap-3">
                        <span class="text-sm font-medium text-neutral-500 w-6 text-center flex-shrink-0">{{ item.no_urut }}</span>
                        <!-- WO selector -->
                        <select
                            :value="item.id_wo"
                            @change="onWoSelect(index, Number(($event.target as HTMLSelectElement).value))"
                            class="flex-1 border border-neutral-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                        >
                            <option value="">-- Pilih WO --</option>
                            <option v-for="wo in woList" :key="wo.id_wo" :value="wo.id_wo">
                                #{{ wo.id_wo }} — {{ wo.buyer }} {{ wo.model }} ({{ wo.qty }} pcs)
                            </option>
                        </select>
                        <Button variant="ghost" size="icon" class="text-red-500 hover:bg-red-50 flex-shrink-0" @click="removeItem(index)">
                            <Trash2Icon class="w-4 h-4" />
                        </Button>
                    </div>
                    <!-- Shell selector (shown after WO is selected) -->
                    <div v-if="item.id_wo !== ''" class="ml-9">
                        <div v-if="item.isLoadingShells" class="flex items-center gap-2 text-sm text-neutral-400 py-1">
                            <Spinner class="w-3 h-3" /> Memuat shell...
                        </div>
                        <div v-else-if="item.shells.length === 0" class="text-sm text-neutral-400 italic py-1">
                            WO ini tidak memiliki shell.
                        </div>
                        <select
                            v-else
                            v-model="item.id_wo_shell"
                            class="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                        >
                            <option value="">-- Pilih Warna / Shell --</option>
                            <option v-for="s in item.shells" :key="s.id_wo_shell" :value="s.id_wo_shell">
                                {{ s.color || '(no color)' }} — {{ s.deskripsi }}
                            </option>
                        </select>
                    </div>
                </div>
            </Card>

            <!-- Actions -->
            <div class="flex justify-end gap-3">
                <Button variant="outline" @click="router.navigate({ to: '/master-plan' })">Batal</Button>
                <Button @click="handleSubmit" :disabled="isSubmitting">
                    <Spinner v-if="isSubmitting" class="w-4 h-4 mr-2" />
                    <SaveIcon v-else class="w-4 h-4 mr-2" />
                    Simpan Master Plan
                </Button>
            </div>
        </template>
    </div>
</template>
