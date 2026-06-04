<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRouter } from '@tanstack/vue-router';
import { PlusIcon, Trash2Icon, ArrowLeftIcon, SaveIcon, FileTextIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { createPOInternal } from '@/api/po-internals/po-internals';
import { formatRupiah } from '@/lib/formatter';

import AppForm from '@/components/form/AppForm.vue';
import AppFormField from '@/components/form/AppFormField.vue';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useForm } from '@/composables/form/useForm';

const router = useRouter();

// Setup form
const form = useForm({
    api: {
        create: (payload) => createPOInternal(payload),
    },
    id: null,
    onSuccess: () => {
        router.navigate({ to: '/po-internal' });
    }
});

const { values, isLoading, isSaving } = form;

// Add/Remove Item rows
const addItem = () => {
    if (!values.value.items) values.value.items = [];
    values.value.items.push({ item: '', description: '', qty: 1, unit: '', unitPrice: 'Rp 0' });
};

const removeItem = (index: number) => {
    if (values.value.items && values.value.items.length > 1) {
        values.value.items.splice(index, 1);
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

const handleUnitPriceInput = (event: Event, item: any) => {
    const target = event.target as HTMLInputElement;
    const numeric = target.value.replace(/[^0-9]/g, '');
    if (numeric === '') {
        item.unitPrice = '';
        target.value = '';
        return;
    }
    const num = parseInt(numeric, 10);
    const formatted = formatRupiah(num);
    item.unitPrice = formatted;
    target.value = formatted;
};

// Computed totals
const totalFormQty = computed(() => {
    if (!values.value.items) return 0;
    return values.value.items.reduce((acc: number, curr: any) => acc + Number(curr.qty || 0), 0);
});

const grandFormTotal = computed(() => {
    if (!values.value.items) return 0;
    return values.value.items.reduce((acc: number, curr: any) => {
        return acc + (Number(curr.qty || 0) * parseRupiahToNumber(curr.unitPrice));
    }, 0);
});

// Override the save to map payload correctly
const originalSave = form.save;
form.save = async () => {
    // Validate header
    if (!values.value.tanggal || !values.value.namaPO || !values.value.supplierName || !values.value.currency || !values.value.shipDate || !values.value.idPrInternal) {
        toast.error("Harap lengkapi semua field wajib (Tanggal, Nama PO, Supplier, Currency, Ship Date, dan PR Internal).");
        return;
    }

    // Validate items
    if (!values.value.items || values.value.items.length === 0) {
        toast.error("Minimal harus terdapat satu item PO.");
        return;
    }
    for (const item of values.value.items) {
        if (!item.item || !item.unit || item.qty <= 0) {
            toast.error("Harap lengkapi semua baris item (Nama Item, Satuan, dan Qty > 0).");
            return;
        }
    }

    const payload = {
        tanggal: values.value.tanggal,
        nama_po: values.value.namaPO,
        supplier_name: values.value.supplierName,
        supplier_addr: values.value.supplierAddr || '',
        supplier_contact: values.value.supplierContact || '',
        supplier_email: values.value.supplierEmail || '',
        supplier_telp: values.value.supplierTelp || '',
        supplier_fax: values.value.supplierFax || '',
        currency: values.value.currency,
        cpo: values.value.cpo || '',
        term: values.value.term || '',
        ship_date: values.value.shipDate,
        id_pr_internal: Number(values.value.idPrInternal),
        items: values.value.items.map((item: any) => ({
            item: item.item,
            description: item.description || '',
            qty: Number(item.qty),
            unit: item.unit,
            unit_price: parseRupiahToNumber(item.unitPrice),
        })),
    };

    return originalSave(payload);
};

onMounted(() => {
    // Set initial default values
    values.value = {
        tanggal: '',
        namaPO: '',
        supplierName: '',
        supplierAddr: '',
        supplierContact: '',
        supplierEmail: '',
        supplierTelp: '',
        supplierFax: '',
        currency: 'IDR',
        cpo: '',
        term: '',
        shipDate: '',
        idPrInternal: '',
        items: [{ item: '', description: '', qty: 1, unit: '', unitPrice: 'Rp 0' }],
    };
});
</script>

<template>
    <div class="container mx-auto py-8 max-w-5xl space-y-6">
        <!-- Header Navigation -->
        <div class="flex flex-col md:flex-row md:items-center justify-between border-b pb-5 border-neutral-100 gap-4">
            <div class="flex items-center gap-3">
                <div class="bg-neutral-50 border border-neutral-200/80 p-2.5 rounded-xl shadow-sm">
                    <FileTextIcon class="w-6 h-6 text-neutral-600" />
                </div>
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-neutral-900">
                        Buat PO Internal Document
                    </h1>
                    <p class="text-[13px] text-neutral-500 mt-1">
                        Menerbitkan Purchase Order Internal baru berdasarkan PR yang sudah disetujui.
                    </p>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <Button type="button" @click="router.history.back()" variant="outline" class="h-10 px-4 border-neutral-300 shadow-sm transition-all rounded-lg">
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
                        Informasi PO
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <AppFormField name="namaPO" label="Nama PO *" placeholder="Contoh: PO-INT-2026-001" />
                        <AppFormField name="tanggal" type="date" label="Tanggal *" />
                        <AppFormField name="shipDate" type="date" label="Ship Date *" />
                        <AppFormField name="currency" label="Currency *" placeholder="Contoh: IDR, USD" />
                        <AppFormField name="cpo" label="CPO" placeholder="Opsional" />
                        <AppFormField name="term" label="Term" placeholder="Opsional" />
                        <AppFormField
                            name="idPrInternal"
                            label="ID PR Internal *"
                            type="number"
                            placeholder="Masukkan ID PR Internal yang sudah disetujui"
                            className="md:col-span-3"
                        />
                    </div>
                </Card>

                <!-- Supplier Info Card -->
                <Card class="border border-neutral-200 bg-white p-6 shadow-sm rounded-xl">
                    <h2 class="text-sm font-bold text-neutral-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                        <span class="inline-block w-1.5 h-4 bg-neutral-900 rounded-full"></span>
                        Informasi Supplier
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AppFormField name="supplierName" label="Nama Supplier *" placeholder="Contoh: PT. Bahan Garment" />
                        <AppFormField name="supplierContact" label="Contact Person" placeholder="Nama kontak di supplier" />
                        <AppFormField name="supplierAddr" label="Alamat Supplier" placeholder="Alamat lengkap supplier" className="md:col-span-2" />
                        <AppFormField name="supplierEmail" type="email" label="Email Supplier" placeholder="contoh@supplier.com" />
                        <AppFormField name="supplierTelp" label="No. Telepon" placeholder="021-xxxxxxxx" />
                        <AppFormField name="supplierFax" label="No. Fax" placeholder="021-xxxxxxxx (Opsional)" />
                    </div>
                </Card>

                <!-- Items Section -->
                <div class="space-y-4">
                    <div class="flex items-center justify-between border-b border-neutral-100 pb-3">
                        <div class="flex flex-col gap-1">
                            <h3 class="text-sm font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-2">
                                <span class="inline-block w-1.5 h-4 bg-neutral-900 rounded-full"></span>
                                Daftar Item PO
                            </h3>
                            <span class="text-xs text-neutral-500 pl-3.5">Detail item barang yang dipesan dalam Purchase Order Internal ini.</span>
                        </div>
                        <Button type="button" @click="addItem" variant="outline" size="sm" class="h-9 border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded-lg shadow-sm transition-all px-3.5">
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
                                    <th class="p-3.5 w-[22%] whitespace-nowrap text-neutral-700">Harga Satuan <span class="text-red-500">*</span></th>
                                    <th class="p-3.5 whitespace-nowrap text-neutral-700">Deskripsi</th>
                                    <th class="p-3.5 text-center w-[8%] whitespace-nowrap text-neutral-700">Aksi</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-neutral-100">
                                <tr v-for="(item, idx) in values.items" :key="idx" class="hover:bg-neutral-50/40 transition-colors duration-150">
                                    <td class="p-3">
                                        <Input v-model="item.item" placeholder="Nama barang" class="h-9 text-sm border-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-800 bg-white" />
                                    </td>
                                    <td class="p-3">
                                        <Input v-model="item.qty" type="number" min="1" class="h-9 text-sm border-neutral-200 text-center focus-visible:ring-2 focus-visible:ring-neutral-800 bg-white" />
                                    </td>
                                    <td class="p-3">
                                        <Input v-model="item.unit" placeholder="PCS, Roll, Kg..." class="h-9 text-sm border-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-800 bg-white" />
                                    </td>
                                    <td class="p-3">
                                        <input
                                            type="text"
                                            :value="item.unitPrice"
                                            @input="handleUnitPriceInput($event, item)"
                                            placeholder="Rp 0"
                                            class="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-neutral-400 outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </td>
                                    <td class="p-3">
                                        <Input v-model="item.description" placeholder="Keterangan tambahan" class="h-9 text-sm border-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-800 bg-white" />
                                    </td>
                                    <td class="p-3 text-center">
                                        <Button type="button" @click="removeItem(Number(idx))" variant="ghost" size="icon" class="h-8 w-8 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50/50 transition-colors" :disabled="values.items?.length <= 1">
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
                    <Button type="button" variant="outline" @click="router.navigate({ to: '/po-internal' })" class="h-10 px-5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 rounded-lg transition-all border-neutral-300">
                        Batal
                    </Button>
                    <Button type="submit" :disabled="isSaving" class="h-10 px-6 text-sm font-medium bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg shadow-sm border border-neutral-800 transition-all flex items-center gap-2 active:scale-[0.98]">
                        <template v-if="isSaving">
                            <Spinner class="w-4 h-4" /> Menyimpan...
                        </template>
                        <template v-else>
                            <SaveIcon class="w-4 h-4" /> Terbitkan PO Internal
                        </template>
                    </Button>
                </div>
            </AppForm>
        </div>
    </div>
</template>
