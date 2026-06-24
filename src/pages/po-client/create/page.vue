<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useParams, useRouter } from '@tanstack/vue-router';
import { PlusIcon, Trash2Icon, ArrowLeftIcon, SaveIcon, FileTextIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { useAuthStore } from '@/store/authStore';
import { getPOClientById, createPOClient, updatePOClient } from '@/api/po-clients/po-clients';
import { getMitra } from '@/api/mitra/mitra';
import { useForm } from '@/composables/form/useForm';
import { formatRupiah } from '@/lib/formatter';
import { parseToInt } from '@/lib/number';

import AppForm from '@/components/form/AppForm.vue';
import AppFormField from '@/components/form/AppFormField.vue';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const router = useRouter();
const authStore = useAuthStore();

// Safely get param for edit mode
const params = useParams({ strict: false }) as any;
const id = computed(() => params.value?.id ? Number(params.value.id) : null);
const isEditMode = computed(() => !!id.value);

// Helper to auto-generate PO number
const generatePONumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000); // 4 random digits
    return `PO-CL-${year}${month}${day}-${random}`;
};

// Dropdown options
const listMitra = ref<any[]>([]);
const fetchMitraList = async () => {
    if (authStore.isMitra) return;
    try {
        const res = await getMitra({ limit: 1000, offset: 0 });
        listMitra.value = res.results || [];
    } catch (e) {
        console.error("Gagal fetch mitra list:", e);
    }
};

const mitraOptions = computed(() => {
    return listMitra.value.map(m => ({
        label: `${m.nama_perusahaan} (${m.tipe_perusahaan})`,
        value: String(m.id_mitra)
    }));
});

// Setup Form Composable
const form = useForm({
    api: {
        create: (payload) => createPOClient(payload),
        update: (editId, payload) => updatePOClient(editId, payload),
        get: (editId) => getPOClientById(editId)
    },
    id: id.value,
    onSuccess: () => {
        router.navigate({ to: '/po-client' });
    }
});

const { values, isLoading, isSaving } = form;

// Add/Remove Nested Table Rows
const addItem = () => {
    if (!values.value.items) values.value.items = [];
    values.value.items.push({ style: '', qty: 1, price: 'Rp 0', description: '' });
};

const removeItem = (index: any) => {
    if (values.value.items && values.value.items.length > 1) {
        values.value.items.splice(Number(index), 1);
    }
};

const addPIC = () => {
    if (!values.value.penanggungJawab) values.value.penanggungJawab = [];
    values.value.penanggungJawab.push({ nama: '', noTelp: '', email: '' });
};

const removePIC = (index: any) => {
    if (values.value.penanggungJawab && values.value.penanggungJawab.length > 1) {
        values.value.penanggungJawab.splice(Number(index), 1);
    }
};

const hasSubmitted = ref(false);

// Override the save function to inject custom validation and payload mapping
const originalSave = form.save;
form.save = async () => {
    hasSubmitted.value = true;
    if (!values.value.poNumber || !values.value.tanggal || !values.value.delivery || (!authStore.isMitra && !values.value.idMitra)) {
        toast.error("Harap lengkapi semua field wajib (PO Number, Tanggal, Delivery, dan Mitra).");
        return;
    }

    // Validate items
    if (!values.value.items || values.value.items.length === 0) {
        toast.error("Minimal harus terdapat satu item pemesanan.");
        return;
    }
    for (const item of values.value.items) {
        const priceNum = parseRupiahToNumber(item.price);
        const qtyNum = parseToInt(item.qty);
        if (!item.style || qtyNum <= 0 || priceNum < 0) {
            toast.error("Harap lengkapi semua baris item (Style, Qty > 0, Price >= 0).");
            return;
        }
    }

    // Validate PIC
    if (!values.value.penanggungJawab || values.value.penanggungJawab.length === 0) {
        toast.error("Minimal harus terdapat satu penanggung jawab (PIC).");
        return;
    }
    for (const pic of values.value.penanggungJawab) {
        if (!pic.nama || !pic.noTelp) {
            toast.error("Harap lengkapi semua penanggung jawab (Nama dan No. Telp wajib).");
            return;
        }
    }

    // Map payload into API formats
    const payload = {
        po_number: values.value.poNumber,
        tanggal: values.value.tanggal,
        season: values.value.season || '',
        delivery: values.value.delivery,
        payment_term: values.value.paymentTerm || '',
        file: values.value.file || '',
        id_mitra: Number(values.value.idMitra),
        items: values.value.items.map((item: any) => ({
            style: item.style,
            qty: parseToInt(item.qty),
            price: parseRupiahToNumber(item.price),
            description: item.description || ''
        })),
        penanggung_jawab: values.value.penanggungJawab.map((pic: any) => ({
            nama: pic.nama,
            no_telp: pic.noTelp,
            email: pic.email || ''
        }))
    };

    return originalSave(payload);
};

onMounted(async () => {
    await fetchMitraList();
    
    if (isEditMode.value && id.value) {
        isLoading.value = true;
        try {
            const detail = await getPOClientById(id.value);
            values.value = {
                poNumber: detail.po_number || '',
                tanggal: detail.tanggal ? detail.tanggal.split('T')[0] : '',
                season: detail.season || '',
                delivery: detail.delivery ? detail.delivery.split('T')[0] : '',
                paymentTerm: detail.payment_term || '',
                file: detail.file || '',
                idMitra: detail.id_mitra ? String(detail.id_mitra) : '',
                items: detail.items && detail.items.length > 0 
                    ? detail.items.map((i: any) => ({
                        style: i.style,
                        qty: i.qty,
                        price: formatRupiah(i.price),
                        description: i.description || ''
                      }))
                    : [{ style: '', qty: 1, price: 'Rp 0', description: '' }],
                penanggungJawab: detail.penanggung_jawab && detail.penanggung_jawab.length > 0
                    ? detail.penanggung_jawab.map((pj: any) => ({
                        nama: pj.nama,
                        noTelp: pj.no_telp,
                        email: pj.email || ''
                      }))
                    : [{ nama: '', noTelp: '', email: '' }]
            };
        } catch (e) {
            console.error("Gagal load PO Client detail:", e);
            toast.error("Gagal memuat detail PO Client");
        } finally {
            isLoading.value = false;
        }
    } else {
        // Initial defaults for Create
        values.value = {
            poNumber: generatePONumber(),
            tanggal: '',
            season: '',
            delivery: '',
            paymentTerm: '',
            file: '',
            idMitra: authStore.isMitra ? String(authStore.mitraId || '') : '',
            items: [{ style: '', qty: 1, price: 'Rp 0', description: '' }],
            penanggungJawab: [{ nama: '', noTelp: '', email: '' }]
        };
    }
});

// Helpers for currency mapping
const parseRupiahToNumber = (val: any): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const clean = val.replace(/[^0-9]/g, '');
    const num = parseInt(clean, 10);
    return isNaN(num) ? 0 : num;
};

const handlePriceInput = (event: Event, item: any) => {
    const target = event.target as HTMLInputElement;
    let numeric = target.value.replace(/[^0-9]/g, '');
    if (numeric === '') {
        item.price = '';
        target.value = '';
        return;
    }
    const num = parseInt(numeric, 10);
    const formatted = formatRupiah(num);
    item.price = formatted;
    target.value = formatted;
};

// Computed values for real-time form totals
const totalFormQty = computed(() => {
    if (!values.value.items) return 0;
    return values.value.items.reduce((acc: number, curr: any) => acc + parseToInt(curr.qty || 0), 0);
});

const grandFormTotal = computed(() => {
    if (!values.value.items) return 0;
    return values.value.items.reduce((acc: number, curr: any) => {
        const priceNum = parseRupiahToNumber(curr.price);
        return acc + (parseToInt(curr.qty || 0) * priceNum);
    }, 0);
});
</script>

<template>
    <div class="container mx-auto py-8 max-w-5xl space-y-6">
        <!-- Breadcrumb / Header Header Navigation -->
        <div class="flex flex-col md:flex-row md:items-center justify-between border-b pb-5 border-neutral-100 gap-4">
            <div class="flex items-center gap-3">
                <div class="bg-neutral-50 border border-neutral-200/80 p-2.5 rounded-xl shadow-sm">
                    <FileTextIcon class="w-6 h-6 text-neutral-600" />
                </div>
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-neutral-900">
                        {{ isEditMode ? 'Edit PO Client Document' : 'Create PO Client Document' }}
                    </h1>
                    <p class="text-[13px] text-neutral-500 mt-1">
                        {{ isEditMode ? 'Perbarui informasi dokumen Purchase Order' : 'Menerbitkan dokumen Purchase Order Client baru' }}
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
                <!-- Info Utama Card -->
                <Card class="border border-neutral-200 bg-white p-6 shadow-sm rounded-xl">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <AppFormField name="poNumber" label="PO Number *" placeholder="Contoh: PO-2026-0001" :error="hasSubmitted && !values.poNumber" />
                        <AppFormField name="tanggal" type="date" label="Tanggal *" :error="hasSubmitted && !values.tanggal" />
                        <AppFormField name="delivery" type="date" label="Delivery Date *" :error="hasSubmitted && !values.delivery" />
                        <AppFormField name="season" label="Season" placeholder="Contoh: Spring/Summer 2026" />
                        <AppFormField name="paymentTerm" label="Payment Term" placeholder="Contoh: Net 30" />
                        
                        <!-- Mitra Dropdown (shown only for Internal Karyawan) -->
                        <AppFormField 
                            v-if="!authStore.isMitra"
                            name="idMitra" 
                            type="select" 
                            label="Mitra Perusahaan *" 
                            placeholder="Pilih Mitra Partner"
                            :options="mitraOptions"
                            :error="hasSubmitted && !values.idMitra"
                        />

                        <!-- Attached File Picker (Images) -->
                        <AppFormField 
                            name="file" 
                            type="file" 
                            label="Lampiran Gambar File PO (Opsional)" 
                            className="md:col-span-3"
                        />
                    </div>
                </Card>

                <!-- Items Section -->
                <div class="space-y-4">
                    <div class="flex items-center justify-between border-b border-neutral-100 pb-3">
                        <div class="flex flex-col gap-1">
                            <h3 class="text-sm font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-2">
                                <span class="inline-block w-1.5 h-4 bg-neutral-900 rounded-full"></span>
                                Nested Items List
                            </h3>
                            <span class="text-xs text-neutral-500 pl-3.5">Detail item barang atau produk yang tercantum dalam Purchase Order.</span>
                        </div>
                        <Button type="button" @click="addItem" variant="outline" size="sm" class="h-9 px-3.5">
                            <PlusIcon class="w-4 h-4 mr-1.5" /> Add Row
                        </Button>
                    </div>

                    <div class="overflow-x-auto border border-neutral-200 rounded-xl shadow-sm bg-white">
                        <table class="w-full text-left border-collapse text-sm">
                            <thead class="bg-neutral-50/75 text-neutral-600 font-semibold border-b border-neutral-200 text-[11px] uppercase tracking-wider">
                                <tr>
                                    <th class="p-3.5 w-[22%] whitespace-nowrap text-neutral-700">Style <span class="text-red-500">*</span></th>
                                    <th class="p-3.5 w-[12%] whitespace-nowrap text-neutral-700 text-center">Qty <span class="text-red-500">*</span></th>
                                    <th class="p-3.5 w-[24%] whitespace-nowrap text-neutral-700">Price <span class="text-red-500">*</span></th>
                                    <th class="p-3.5 whitespace-nowrap text-neutral-700">Description</th>
                                    <th class="p-3.5 text-center w-[8%] whitespace-nowrap text-neutral-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-neutral-100">
                                <tr v-for="(item, idx) in values.items" :key="idx" class="hover:bg-neutral-50/40 transition-colors duration-150">
                                    <td class="p-3">
                                        <Input v-model="item.style" placeholder="Style/Model" class="h-9 text-sm border-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-800 bg-white" :aria-invalid="hasSubmitted && !item.style ? 'true' : undefined" />
                                    </td>
                                    <td class="p-3">
                                        <Input v-model="item.qty" type="text" class="h-9 text-sm border-neutral-200 text-center focus-visible:ring-2 focus-visible:ring-neutral-800 bg-white" :aria-invalid="hasSubmitted && (!item.qty || parseToInt(item.qty) <= 0) ? 'true' : undefined" />
                                    </td>
                                    <td class="p-3">
                                        <input 
                                            type="text"
                                            :value="item.price" 
                                            @input="handlePriceInput($event, item)"
                                            placeholder="Rp 0" 
                                            class="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-neutral-400 outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 disabled:cursor-not-allowed disabled:opacity-50" 
                                            :class="hasSubmitted && (!item.price || parseRupiahToNumber(item.price) < 0) ? 'border-destructive ring-destructive/20 ring-[3px]' : ''"
                                        />
                                    </td>
                                    <td class="p-3">
                                        <Input v-model="item.description" placeholder="Optional desc" class="h-9 text-sm border-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-800 bg-white" />
                                    </td>
                                    <td class="p-3 text-center">
                                        <Button type="button" @click="removeItem(idx)" variant="ghost" size="icon" class="h-8 w-8 text-neutral-400 hover:text-red-600 hover:bg-red-50/50 transition-colors" :disabled="values.items?.length <= 1">
                                            <Trash2Icon class="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                                
                                <!-- Grand Total Footer -->
                                <tr class="bg-neutral-50/55 border-t-2 border-neutral-200 font-semibold text-neutral-900 text-xs">
                                    <td class="p-3.5 text-right uppercase tracking-wider font-bold">Grand Total:</td>
                                    <td class="p-3.5 text-center font-mono font-bold text-neutral-950">{{ totalFormQty }}</td>
                                    <td class="p-3.5 text-left font-mono font-bold text-neutral-950">{{ formatRupiah(grandFormTotal) }}</td>
                                    <td></td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Penanggung Jawab Section -->
                <div class="space-y-4">
                    <div class="flex items-center justify-between border-b border-neutral-100 pb-3">
                        <div class="flex flex-col gap-1">
                            <h3 class="text-sm font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-2">
                                <span class="inline-block w-1.5 h-4 bg-neutral-900 rounded-full"></span>
                                Penanggung Jawab (PIC) List
                            </h3>
                            <span class="text-xs text-neutral-500 pl-3.5">Informasi kontak penanggung jawab dari pihak mitra untuk koordinasi lapangan.</span>
                        </div>
                        <Button type="button" @click="addPIC" variant="outline" size="sm" class="h-9 px-3.5">
                            <PlusIcon class="w-4 h-4 mr-1.5" /> Add PIC
                        </Button>
                    </div>

                    <div class="overflow-x-auto border border-neutral-200 rounded-xl shadow-sm bg-white">
                        <table class="w-full text-left border-collapse text-sm">
                            <thead class="bg-neutral-50/75 text-neutral-600 font-semibold border-b border-neutral-200 text-[11px] uppercase tracking-wider">
                                <tr>
                                    <th class="p-3.5 w-[32%] whitespace-nowrap text-neutral-700">Nama <span class="text-red-500">*</span></th>
                                    <th class="p-3.5 w-[32%] whitespace-nowrap text-neutral-700">No. Telp <span class="text-red-500">*</span></th>
                                    <th class="p-3.5 whitespace-nowrap text-neutral-700">Email</th>
                                    <th class="p-3.5 text-center w-[8%] whitespace-nowrap text-neutral-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-neutral-100">
                                <tr v-for="(pic, idx) in values.penanggungJawab" :key="idx" class="hover:bg-neutral-50/40 transition-colors duration-150">
                                    <td class="p-3">
                                        <Input v-model="pic.nama" placeholder="Nama Lengkap" class="h-9 text-sm border-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-800 bg-white" :aria-invalid="hasSubmitted && !pic.nama ? 'true' : undefined" />
                                    </td>
                                    <td class="p-3">
                                        <Input v-model="pic.noTelp" placeholder="08xxxxxxxxxx" class="h-9 text-sm border-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-800 bg-white" :aria-invalid="hasSubmitted && !pic.noTelp ? 'true' : undefined" />
                                    </td>
                                    <td class="p-3">
                                        <Input v-model="pic.email" placeholder="contoh@email.com" class="h-9 text-sm border-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-800 bg-white" />
                                    </td>
                                    <td class="p-3 text-center">
                                        <Button type="button" @click="removePIC(idx)" variant="ghost" size="icon" class="h-8 w-8 text-neutral-400 hover:text-red-600 hover:bg-red-50/50 transition-colors" :disabled="values.penanggungJawab?.length <= 1">
                                            <Trash2Icon class="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Footer Simpan / Batal Buttons -->
                <div class="border-t border-neutral-200 pt-6 flex gap-3 justify-end">
                    <Button type="button" variant="outline" @click="router.navigate({ to: '/po-client' })" class="h-10 px-5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-all border-neutral-300">
                        Batal
                    </Button>
                    <Button type="submit" :disabled="isSaving" class="h-10 px-6 text-sm font-medium bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm border border-neutral-800 transition-all flex items-center gap-2 active:scale-[0.98]">
                        <template v-if="isSaving">
                            <Spinner class="w-4 h-4" /> Menyimpan...
                        </template>
                        <template v-else>
                            <SaveIcon class="w-4 h-4" /> {{ isEditMode ? 'Simpan Perubahan' : 'Terbitkan PO Document' }}
                        </template>
                    </Button>
                </div>
            </AppForm>
        </div>
    </div>
</template>
