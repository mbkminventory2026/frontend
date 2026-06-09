<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { useRouter } from '@tanstack/vue-router';
import { PlusIcon, Trash2Icon, ArrowLeftIcon, SaveIcon, ClipboardListIcon, RefreshCwIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { createPRInternal } from '@/api/pr-internals/pr-internals';
import { getWorkOrders, getWorkOrderById, type WorkOrderListItem } from '@/api/work-orders/work-orders';
import { formatRupiah } from '@/lib/formatter';
import { parseToInt } from '@/lib/number';
import { useAuthStore } from '@/store/authStore';
import { getUserById } from '@/api/users/users';

import AppForm from '@/components/form/AppForm.vue';
import AppFormField from '@/components/form/AppFormField.vue';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useForm } from '@/composables/form/useForm';

const router = useRouter();
const authStore = useAuthStore();

// Setup form
const form = useForm({
    api: {
        create: (payload) => createPRInternal(payload),
    },
    id: null,
    onSuccess: () => {
        router.navigate({ to: '/pr-internal' });
    }
});

const { values, isLoading, isSaving } = form;

// WO States
const workOrderList = ref<WorkOrderListItem[]>([]);
const woMaterials = ref<any[]>([]);
const isLoadingWorkOrders = ref(false);
const isLoadingMaterials = ref(false);

const workOrderOptions = computed(() => {
    return workOrderList.value.map((wo) => ({
        label: `WO #${wo.id_wo} - PO ${wo.po_number} (${wo.model})`,
        value: String(wo.id_wo),
    }));
});

// Watch idWo to fetch material lists
watch(() => values.value.idWo, async (newVal) => {
    if (!newVal) {
        woMaterials.value = [];
        return;
    }
    isLoadingMaterials.value = true;
    try {
        const detail = await getWorkOrderById(Number(newVal));
        console.log("Work Order yang dipilih ID:", newVal);
        console.log("Work Order detail response:", detail);
        // Flatten ML groups → individual MLI rows. woMaterials stores MLI objects.
        const mlGroups = detail.material_lists || [];
        const flatItems: any[] = [];
        for (const ml of mlGroups) {
            for (const mli of (ml.items || [])) {
                flatItems.push({ ...mli, _ml_name: ml.name, _is_locked: ml.is_locked });
            }
        }
        woMaterials.value = flatItems;

        if (flatItems.length > 0) {
            values.value.items = flatItems.map((mli: any) => ({
                materialId: mli.id_material_list_item,
                isCustom: false,
                item: mli.item || mli.description,
                unit: mli.unit,
                qty: mli.qty > 0 ? mli.qty : 1,
                estPrice: mli.est_price > 0 ? formatRupiah(mli.est_price) : 'Rp 0',
                description: mli.description,
            }));
        } else {
            values.value.items = [{ item: '', description: '', qty: 1, unit: '', estPrice: 'Rp 0', materialId: null, isCustom: true }];
        }
    } catch (e) {
        console.error('Gagal mengambil material Work Order:', e);
        toast.error('Gagal memuat material untuk Work Order ini.');
        woMaterials.value = [];
    } finally {
        isLoadingMaterials.value = false;
    }
});

// Add/Remove Item rows
const addItem = () => {
    if (!values.value.items) values.value.items = [];
    values.value.items.push({
        item: '',
        description: '',
        qty: 1,
        unit: '',
        estPrice: 'Rp 0',
        materialId: null,
        isCustom: !values.value.idWo
    });
};

const removeItem = (index: number) => {
    if (values.value.items && values.value.items.length > 1) {
        values.value.items.splice(index, 1);
    }
};

const resetRowSelection = (rowItem: any) => {
    rowItem.item = '';
    rowItem.description = '';
    rowItem.qty = 1;
    rowItem.unit = '';
    rowItem.estPrice = 'Rp 0';
    rowItem.materialId = null;
    rowItem.isCustom = false;
};

// Check if material is already selected in other rows
const selectedMaterialIds = computed(() => {
    if (!values.value.items) return [];
    return values.value.items
        .map((i: any) => i.materialId)
        .filter((id: any) => id !== null);
});

const filteredWoMaterials = (rowItem: any) => {
    const others = selectedMaterialIds.value.filter((id: any) => id !== rowItem.materialId);
    return woMaterials.value.filter((mli) => !others.includes(mli.id_material_list_item));
};

const onMaterialSelect = (event: Event, rowItem: any) => {
    const target = event.target as HTMLSelectElement;
    const val = target.value;
    if (val === 'custom') {
        rowItem.isCustom = true;
        rowItem.materialId = null;
        rowItem.item = '';
        rowItem.description = '';
        rowItem.unit = '';
        rowItem.qty = 1;
        rowItem.estPrice = 'Rp 0';
    } else if (val) {
        const matId = Number(val);
        const mli = woMaterials.value.find((m) => m.id_material_list_item === matId);
        if (mli) {
            rowItem.materialId = mli.id_material_list_item;
            rowItem.isCustom = false;
            rowItem.item = mli.item || mli.description;
            rowItem.unit = mli.unit;
            rowItem.qty = mli.qty > 0 ? mli.qty : 1;
            rowItem.estPrice = mli.est_price > 0 ? formatRupiah(mli.est_price) : 'Rp 0';
            rowItem.description = mli.description;
        }
    } else {
        resetRowSelection(rowItem);
    }
};

const fetchWorkOrdersData = async () => {
    isLoadingWorkOrders.value = true;
    try {
        const res = await getWorkOrders({ limit: 1000 });
        workOrderList.value = res.results || [];
    } catch (e) {
        console.error('Gagal mengambil daftar Work Order:', e);
        toast.error('Gagal mengambil daftar Work Order.');
    } finally {
        isLoadingWorkOrders.value = false;
    }
};

// Helpers for currency
const parseRupiahToNumber = (val: any): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const clean = String(val).replace(/[^0-9]/g, '');
    const num = parseInt(clean, 10);
    return isNaN(num) ? 0 : num;
};

const handleEstPriceInput = (event: Event, item: any) => {
    const target = event.target as HTMLInputElement;
    const numeric = target.value.replace(/[^0-9]/g, '');
    if (numeric === '') {
        item.estPrice = '';
        target.value = '';
        return;
    }
    const num = parseInt(numeric, 10);
    const formatted = formatRupiah(num);
    item.estPrice = formatted;
    target.value = formatted;
};

// Computed totals
const totalFormQty = computed(() => {
    if (!values.value.items) return 0;
    return values.value.items.reduce((acc: number, curr: any) => acc + parseToInt(curr.qty || 0), 0);
});

const grandFormTotal = computed(() => {
    if (!values.value.items) return 0;
    return values.value.items.reduce((acc: number, curr: any) => {
        return acc + (parseToInt(curr.qty || 0) * parseRupiahToNumber(curr.estPrice));
    }, 0);
});

// Override the save to map payload correctly
const originalSave = form.save;
form.save = async () => {
    // Validate header
    if (!values.value.tanggal || !values.value.nama || !values.value.departemen || !values.value.vendorName || !values.value.projek || !values.value.idWo) {
        toast.error("Harap lengkapi semua field wajib (Tanggal, Nama, Departemen, Vendor, Projek, dan ID Work Order).");
        return;
    }

    // Validate items
    if (!values.value.items || values.value.items.length === 0) {
        toast.error("Minimal harus terdapat satu item PR.");
        return;
    }
    for (const item of values.value.items) {
        if (!item.item || !item.unit || parseToInt(item.qty) <= 0) {
            toast.error("Harap lengkapi semua baris item (Nama Item, Satuan, dan Qty > 0).");
            return;
        }
    }

    const payload = {
        tanggal: values.value.tanggal,
        nama: values.value.nama,
        departemen: values.value.departemen,
        vendor_name: values.value.vendorName,
        vendor_address: values.value.vendorAddress || '',
        vendor_telp: values.value.vendorTelp || '',
        projek: values.value.projek,
        id_wo: Number(values.value.idWo),
        items: values.value.items.map((item: any) => ({
            item: item.item,
            description: item.description || '',
            qty: parseToInt(item.qty),
            unit: item.unit,
            est_price: parseRupiahToNumber(item.estPrice),
        })),
    };

    return originalSave(payload);
};

onMounted(async () => {
    fetchWorkOrdersData();
    let departemen = '';
    const claims = authStore.decodedClaims;
    if (claims && claims.user_id) {
        if (authStore.roleName === 'super-admin' || authStore.user?.username === 'super-admin') {
            departemen = 'produksi';
        } else {
            try {
                const userDetail = await getUserById(claims.user_id);
                departemen = userDetail.nama_departemen || '';
            } catch (e) {
                console.error('Gagal mengambil departemen user:', e);
            }
        }
    }
    values.value = {
        tanggal: '',
        nama: '',
        departemen: departemen,
        vendorName: '',
        vendorAddress: '',
        vendorTelp: '',
        projek: '',
        idWo: '',
        items: [{ item: '', description: '', qty: 1, unit: '', estPrice: 'Rp 0', materialId: null, isCustom: true }],
    };
});
</script>

<template>
    <div class="container mx-auto py-8 max-w-5xl space-y-6">
        <!-- Header Navigation -->
        <div class="flex flex-col md:flex-row md:items-center justify-between border-b pb-5 border-neutral-100 gap-4">
            <div class="flex items-center gap-3">
                <div class="bg-neutral-50 border border-neutral-200/80 p-2.5 rounded-xl shadow-sm">
                    <ClipboardListIcon class="w-6 h-6 text-neutral-600" />
                </div>
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-neutral-900">
                        Buat PR Internal Document
                    </h1>
                    <p class="text-[13px] text-neutral-500 mt-1">
                        Membuat Purchase Request Internal baru untuk pengadaan barang/jasa.
                    </p>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <Button type="button" @click="router.history.back()" variant="outline" class="h-10 px-4 border-neutral-300 shadow-sm transition-all">
                    <ArrowLeftIcon class="w-4 h-4 mr-2" /> Kembali
                </Button>
            </div>
        </div>

        <div v-if="isLoading" class="flex flex-col items-center justify-center min-h-[300px] gap-4">
            <Spinner class="size-8" />
            <p class="text-neutral-500 animate-pulse text-sm">Memuat formulir...</p>
        </div>

        <div v-else>
            <AppForm :form="form" class="space-y-8">
                <!-- Header Info Card -->
                <Card class="border border-neutral-200 bg-white p-6 shadow-sm rounded-xl">
                    <h2 class="text-sm font-bold text-neutral-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                        <span class="inline-block w-1.5 h-4 bg-neutral-900 rounded-full"></span>
                        Informasi PR
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <AppFormField name="nama" label="Nama PR *" placeholder="Contoh: PR-INT-2026-001" />
                        <AppFormField name="tanggal" type="date" label="Tanggal *" />
                        <AppFormField name="departemen" label="Departemen *" placeholder="Contoh: Produksi" disabled />
                        <AppFormField name="projek" label="Projek *" placeholder="Nama proyek terkait" />
                        <AppFormField
                            name="idWo"
                            label="Work Order *"
                            type="select"
                            placeholder="Pilih Work Order..."
                            :options="workOrderOptions"
                        />
                    </div>
                </Card>

                <!-- Vendor Info Card -->
                <Card class="border border-neutral-200 bg-white p-6 shadow-sm rounded-xl">
                    <h2 class="text-sm font-bold text-neutral-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                        <span class="inline-block w-1.5 h-4 bg-neutral-900 rounded-full"></span>
                        Informasi Vendor
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AppFormField name="vendorName" label="Nama Vendor *" placeholder="Contoh: PT. Bahan Garment" />
                        <AppFormField name="vendorTelp" label="No. Telepon Vendor" placeholder="021-xxxxxxxx" />
                        <AppFormField name="vendorAddress" label="Alamat Vendor" placeholder="Alamat lengkap vendor" className="md:col-span-2" />
                    </div>
                </Card>

                <!-- Items Section -->
                <div class="space-y-4">
                    <div class="flex items-center justify-between border-b border-neutral-100 pb-3">
                        <div class="flex flex-col gap-1">
                            <h3 class="text-sm font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-2">
                                <span class="inline-block w-1.5 h-4 bg-neutral-900 rounded-full"></span>
                                Daftar Item PR
                            </h3>
                            <span class="text-xs text-neutral-500 pl-3.5">Detail item barang yang dibutuhkan dalam Purchase Request Internal ini.</span>
                        </div>
                        <Button type="button" @click="addItem" variant="outline" size="sm" class="h-9 px-3.5">
                            <PlusIcon class="w-4 h-4 mr-1.5" /> Add Row
                        </Button>
                    </div>

                    <div class="overflow-x-auto border border-neutral-200 rounded-xl shadow-sm bg-white">
                        <table class="w-full text-left border-collapse text-sm">
                            <thead class="bg-neutral-50/75 text-neutral-600 font-semibold border-b border-neutral-200 text-[11px] uppercase tracking-wider">
                                <tr>
                                    <th class="p-3.5 w-[22%] whitespace-nowrap text-neutral-700">Nama Item <span class="text-red-500">*</span></th>
                                    <th class="p-3.5 w-[10%] whitespace-nowrap text-neutral-700 text-center">Qty <span class="text-red-500">*</span></th>
                                    <th class="p-3.5 w-[12%] whitespace-nowrap text-neutral-700">Satuan <span class="text-red-500">*</span></th>
                                    <th class="p-3.5 w-[22%] whitespace-nowrap text-neutral-700">Est. Harga <span class="text-red-500">*</span></th>
                                    <th class="p-3.5 whitespace-nowrap text-neutral-700">Deskripsi</th>
                                    <th class="p-3.5 text-center w-[8%] whitespace-nowrap text-neutral-700">Aksi</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-neutral-100">
                                <tr v-for="(item, idx) in values.items" :key="idx" class="hover:bg-neutral-50/40 transition-colors duration-150">
                                    <td class="p-3">
                                        <template v-if="values.idWo">
                                            <!-- WO Material selected (read-only) -->
                                            <div v-if="item.materialId" class="flex items-center gap-2 w-full">
                                                <Input
                                                    v-model="item.item"
                                                    readonly
                                                    class="h-9 text-sm border-neutral-200 bg-neutral-50/50 text-neutral-600 cursor-not-allowed flex-1 select-none"
                                                    title="Material Work Order (Nama tidak dapat diubah)"
                                                />
                                                <Button type="button" variant="ghost" size="icon" @click="resetRowSelection(item)" class="h-8 w-8 text-neutral-400 hover:text-neutral-600 flex-shrink-0" title="Ubah Pilihan">
                                                    <RefreshCwIcon class="w-3.5 h-3.5" />
                                                </Button>
                                            </div>

                                            <!-- Custom Item selected -->
                                            <div v-else-if="item.isCustom" class="flex items-center gap-2">
                                                <Input v-model="item.item" placeholder="Nama barang (Custom)" class="h-9 text-sm border-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-800 bg-white flex-1" />
                                                <Button type="button" variant="ghost" size="icon" @click="resetRowSelection(item)" class="h-8 w-8 text-neutral-400 hover:text-neutral-600" title="Ubah Pilihan">
                                                    <RefreshCwIcon class="w-3.5 h-3.5" />
                                                </Button>
                                            </div>

                                            <!-- Not selected yet (Dropdown option) -->
                                            <div v-else class="w-full">
                                                <select
                                                    :value="item.materialId ?? ''"
                                                    :disabled="isLoadingMaterials"
                                                    @change="onMaterialSelect($event, item)"
                                                    class="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-900/20 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <option value="">{{ isLoadingMaterials ? 'Memuat material WO...' : 'Pilih Material / Custom...' }}</option>
                                                    <option value="custom">-- Custom Item --</option>
                                                    <option
                                                        v-for="mli in filteredWoMaterials(item)"
                                                        :key="mli.id_material_list_item"
                                                        :value="mli.id_material_list_item"
                                                    >
                                                        {{ mli.item || mli.description }} ({{ [mli.unit, mli._ml_name].filter(Boolean).join(' · ') }})
                                                    </option>
                                                </select>
                                            </div>
                                        </template>

                                        <template v-else>
                                            <Input v-model="item.item" placeholder="Nama barang" class="h-9 text-sm border-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-800 bg-white" />
                                        </template>
                                    </td>
                                    <td class="p-3">
                                        <Input v-model="item.qty" type="text" class="h-9 text-sm border-neutral-200 text-center focus-visible:ring-2 focus-visible:ring-neutral-800 bg-white" />
                                    </td>
                                    <td class="p-3">
                                        <Input v-model="item.unit" placeholder="PCS, Roll, Kg..." class="h-9 text-sm border-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-800 bg-white" />
                                    </td>
                                    <td class="p-3">
                                        <input
                                            type="text"
                                            :value="item.estPrice"
                                            @input="handleEstPriceInput($event, item)"
                                            placeholder="Rp 0"
                                            class="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-neutral-400 outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </td>
                                    <td class="p-3">
                                        <Input v-model="item.description" placeholder="Keterangan tambahan" class="h-9 text-sm border-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-800 bg-white" />
                                    </td>
                                    <td class="p-3 text-center">
                                        <Button type="button" @click="removeItem(Number(idx))" variant="ghost" size="icon" class="h-8 w-8 text-neutral-400 hover:text-red-600 hover:bg-red-50/50 transition-colors" :disabled="values.items?.length <= 1">
                                            <Trash2Icon class="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>

                                <!-- Grand Total Footer -->
                                <tr class="bg-neutral-50/55 border-t-2 border-neutral-200 font-semibold text-neutral-900 text-xs">
                                    <td class="p-3.5 text-right uppercase tracking-wider font-bold">Grand Total:</td>
                                    <td class="p-3.5 text-center font-mono font-bold text-neutral-950">{{ totalFormQty }}</td>
                                    <td></td>
                                    <td class="p-3.5 text-left font-mono font-bold text-neutral-950">{{ formatRupiah(grandFormTotal) }}</td>
                                    <td></td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Footer Buttons -->
                <div class="border-t border-neutral-200 pt-6 flex gap-3 justify-end">
                    <Button type="button" variant="outline" @click="router.navigate({ to: '/pr-internal' })" class="h-10 px-5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-all border-neutral-300">
                        Batal
                    </Button>
                    <Button type="submit" :disabled="isSaving" class="h-10 px-6 text-sm font-medium bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm border border-neutral-800 transition-all flex items-center gap-2 active:scale-[0.98]">
                        <template v-if="isSaving">
                            <Spinner class="w-4 h-4" /> Menyimpan...
                        </template>
                        <template v-else>
                            <SaveIcon class="w-4 h-4" /> Terbitkan PR Internal
                        </template>
                    </Button>
                </div>
            </AppForm>
        </div>
    </div>
</template>
