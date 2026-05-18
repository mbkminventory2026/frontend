<script setup lang="ts">
import { h, ref, watch, onMounted, computed } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon, PencilIcon, Trash2Icon, FileTextIcon } from 'lucide-vue-next';

import { useAuthStore } from '@/store/authStore';
import { getPOClients, createPOClient, updatePOClient, getPOClientById, type POClientListItem } from '@/api/po-clients/po-clients';
import { getMitra } from '@/api/mitra/mitra';
import { poClientSchema } from '@/routes/_authenticated/po-client.index';

import DataTable from '@/components/DataTable.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { useTable } from '@/composables/useTable';
import { formatDate } from '@/lib/formatter';

const search = useSearch({ strict: false }) as any;
const router = useRouter();
const authStore = useAuthStore();

const data = ref<POClientListItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

const isDialogOpen = ref(false);
const isEditMode = ref(false);
const editId = ref<number | null>(null);
const isSaving = ref(false);

// Form Fields
const form = ref({
    poNumber: '',
    tanggal: '',
    season: '',
    delivery: '',
    paymentTerm: '',
    file: '',
    idMitra: '' as string | number,
    items: [] as { style: string; colour: string; qty: number; price: number; description: string }[],
    penanggungJawab: [] as { nama: string; noTelp: string; email: string }[]
});

// Dropdowns and metadata
const listMitra = ref<any[]>([]);

const canCreateOrEdit = computed(() => {
    if (authStore.isMitra) return true;
    return authStore.permissions.includes('PO_CREATE') || authStore.isManager;
});

const fetchData = async () => {
    isLoading.value = true;
    try {
        const page = search.value?.page ?? 1;
        const pageSize = search.value?.pageSize ?? 20;
        const filter = search.value?.filter ?? '';

        const response = await getPOClients({
            limit: pageSize,
            offset: (page - 1) * pageSize,
            search: filter
        });

        data.value = response.results;
        totalCount.value = response.count;
    } catch (error) {
        console.error("Gagal fetch PO Clients:", error);
    } finally {
        isLoading.value = false;
    }
};

const fetchMitraList = async () => {
    if (authStore.isMitra) return;
    try {
        const res = await getMitra({ limit: 1000, offset: 0 });
        listMitra.value = res.results || [];
    } catch (e) {
        console.error("Gagal fetch mitra list:", e);
    }
};

const { table, searchTerm, onSearch, clearFilter } = useTable({
    data: data,
    rowCount: totalCount,
    columns: [
        { header: 'Created At', accessorKey: 'created_at', cell: ({ row }) => formatDate(row.getValue('created_at')) },
        { header: 'ID PO', accessorKey: 'id_po_client' },
        { header: 'PO Number', accessorKey: 'po_number' },
        { header: 'Tanggal', accessorKey: 'tanggal', cell: ({ row }) => formatDate(row.getValue('tanggal')) },
        { header: 'Season', accessorKey: 'season' },
        { header: 'Delivery', accessorKey: 'delivery', cell: ({ row }) => formatDate(row.getValue('delivery')) },
        { header: 'Mitra', accessorKey: 'mitra_name' },
        { header: 'Actions', id: 'actions', cell:({ row }) => {
            const id = row.getValue('id_po_client') as number;

            return h('div', { class: 'flex gap-2 justify-center items-center' }, [
                h(Button, { 
                    variant: 'outline',
                    size: 'sm',
                    onClick: () => router.navigate({ to: '/po-client/$id', params: { id: String(id) } }) 
                }, () => [
                    h(EyeIcon, { class: 'w-4 h-4 mr-1' }),
                    'View'
                ]),
                ...(canCreateOrEdit.value ? [
                    h(Button, { 
                        variant: 'ghost',
                        size: 'sm',
                        onClick: () => openEditDialog(id) 
                    }, () => [
                        h(PencilIcon, { class: 'w-4 h-4 mr-1' }),
                        'Edit'
                    ])
                ] : [])
            ])
        } }
    ],
    search: search,
    schema: poClientSchema,
});

const openCreateDialog = () => {
    isEditMode.value = false;
    editId.value = null;
    form.value = {
        poNumber: '',
        tanggal: '',
        season: '',
        delivery: '',
        paymentTerm: '',
        file: '',
        idMitra: authStore.isMitra ? (authStore.mitraId || '') : '',
        items: [{ style: '', colour: '', qty: 1, price: 0, description: '' }],
        penanggungJawab: [{ nama: '', noTelp: '', email: '' }]
    };
    isDialogOpen.value = true;
};

const openEditDialog = async (id: number) => {
    isEditMode.value = true;
    editId.value = id;
    try {
        const detail = await getPOClientById(id);
        form.value = {
            poNumber: detail.po_number || '',
            tanggal: detail.tanggal ? detail.tanggal.split('T')[0] : '',
            season: detail.season || '',
            delivery: detail.delivery ? detail.delivery.split('T')[0] : '',
            paymentTerm: detail.payment_term || '',
            file: detail.file || '',
            idMitra: detail.id_mitra || '',
            items: detail.items && detail.items.length > 0 
                ? detail.items.map((i: any) => ({
                    style: i.style,
                    colour: i.colour,
                    qty: i.qty,
                    price: i.price,
                    description: i.description || ''
                  }))
                : [{ style: '', colour: '', qty: 1, price: 0, description: '' }],
            penanggungJawab: detail.penanggung_jawab && detail.penanggung_jawab.length > 0
                ? detail.penanggung_jawab.map((pj: any) => ({
                    nama: pj.nama,
                    noTelp: pj.no_telp,
                    email: pj.email || ''
                  }))
                : [{ nama: '', noTelp: '', email: '' }]
        };
        isDialogOpen.value = true;
    } catch (e) {
        alert("Gagal memuat detail PO Client");
        console.error(e);
    }
};

const addItem = () => {
    form.value.items.push({ style: '', colour: '', qty: 1, price: 0, description: '' });
};

const removeItem = (index: number) => {
    if (form.value.items.length > 1) {
        form.value.items.splice(index, 1);
    }
};

const addPIC = () => {
    form.value.penanggungJawab.push({ nama: '', noTelp: '', email: '' });
};

const removePIC = (index: number) => {
    if (form.value.penanggungJawab.length > 1) {
        form.value.penanggungJawab.splice(index, 1);
    }
};

const handleSave = async () => {
    if (!form.value.poNumber || !form.value.tanggal || !form.value.delivery || !form.value.idMitra) {
        alert("Harap lengkapi semua field wajib (PO Number, Tanggal, Delivery, dan Mitra).");
        return;
    }

    // Validate items
    for (const item of form.value.items) {
        if (!item.style || !item.colour || item.qty <= 0 || item.price < 0) {
            alert("Harap lengkapi semua baris item (Style, Colour, Qty > 0, Price >= 0).");
            return;
        }
    }

    // Validate PIC
    for (const pic of form.value.penanggungJawab) {
        if (!pic.nama || !pic.noTelp) {
            alert("Harap lengkapi semua penanggung jawab (Nama dan No. Telp wajib).");
            return;
        }
    }

    isSaving.value = true;
    try {
        const payload = {
            po_number: form.value.poNumber,
            tanggal: form.value.tanggal,
            season: form.value.season,
            delivery: form.value.delivery,
            payment_term: form.value.paymentTerm,
            file: form.value.file,
            id_mitra: Number(form.value.idMitra),
            items: form.value.items.map(item => ({
                style: item.style,
                colour: item.colour,
                qty: Number(item.qty),
                price: Number(item.price),
                description: item.description
            })),
            penanggung_jawab: form.value.penanggungJawab.map(pic => ({
                nama: pic.nama,
                no_telp: pic.noTelp,
                email: pic.email
            }))
        };

        if (isEditMode.value && editId.value !== null) {
            await updatePOClient(editId.value, payload);
            alert("PO Client berhasil diperbarui!");
        } else {
            await createPOClient(payload);
            alert("PO Client berhasil dibuat!");
        }
        isDialogOpen.value = false;
        fetchData();
    } catch (e: any) {
        console.error("Gagal menyimpan PO Client:", e);
        const errMsg = e.response?.data?.message || "Terjadi kesalahan internal server.";
        alert(errMsg);
    } finally {
        isSaving.value = false;
    }
};

onMounted(() => {
    fetchData();
    fetchMitraList();
});

watch(() => search, () => {
    fetchData();
}, { deep: true });
</script>

<template>
    <DataTable
        :table="table"
        :is-loading="isLoading"
        v-model:search="searchTerm"
        @search="onSearch"
        @clear-filter="clearFilter"
    >
        <template #actions v-if="canCreateOrEdit">
            <Button @click="openCreateDialog" variant="outline" class="shadow-sm border-neutral-300">
                <PlusIcon class="w-4 h-4 mr-2" />
                Tambah PO Client
            </Button>
        </template>
    </DataTable>

    <!-- Create/Edit PO Client Dialog -->
    <Dialog :open="isDialogOpen" @update:open="isDialogOpen = $event">
        <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto border border-neutral-200 bg-white p-6 shadow-lg rounded-xl">
            <DialogHeader class="border-b pb-4">
                <DialogTitle class="text-xl font-bold flex items-center gap-2 text-neutral-900">
                    <FileTextIcon class="w-5 h-5 text-neutral-600" />
                    {{ isEditMode ? 'Edit PO Client Document' : 'Create PO Client Document' }}
                </DialogTitle>
                <DialogDescription class="text-sm text-neutral-500 mt-1">
                    Isi detail Purchase Order Client di bawah ini secara lengkap.
                </DialogDescription>
            </DialogHeader>

            <div class="py-6 space-y-6">
                <!-- Header / Primary Info Grid -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 bg-neutral-50/55 p-4 rounded-lg border border-neutral-200">
                    <div class="space-y-2">
                        <Label class="text-xs font-semibold text-neutral-700">PO Number <span class="text-red-500">*</span></Label>
                        <Input v-model="form.poNumber" placeholder="Contoh: PO-2026-0001" class="border-neutral-200 focus-visible:ring-neutral-400 bg-white" />
                    </div>

                    <div class="space-y-2">
                        <Label class="text-xs font-semibold text-neutral-700">Tanggal <span class="text-red-500">*</span></Label>
                        <Input v-model="form.tanggal" type="date" class="border-neutral-200 focus-visible:ring-neutral-400 bg-white" />
                    </div>

                    <div class="space-y-2">
                        <Label class="text-xs font-semibold text-neutral-700">Delivery Date <span class="text-red-500">*</span></Label>
                        <Input v-model="form.delivery" type="date" class="border-neutral-200 focus-visible:ring-neutral-400 bg-white" />
                    </div>

                    <div class="space-y-2">
                        <Label class="text-xs font-semibold text-neutral-700">Season</Label>
                        <Input v-model="form.season" placeholder="Contoh: Spring/Summer 2026" class="border-neutral-200 focus-visible:ring-neutral-400 bg-white" />
                    </div>

                    <div class="space-y-2">
                        <Label class="text-xs font-semibold text-neutral-700">Payment Term</Label>
                        <Input v-model="form.paymentTerm" placeholder="Contoh: Net 30" class="border-neutral-200 focus-visible:ring-neutral-400 bg-white" />
                    </div>

                    <!-- Mitra Dropdown (shown only for Internal Karyawan) -->
                    <div class="space-y-2" v-if="!authStore.isMitra">
                        <Label class="text-xs font-semibold text-neutral-700">Mitra Perusahaan <span class="text-red-500">*</span></Label>
                        <Select :model-value="String(form.idMitra)" @update:model-value="(val) => form.idMitra = val as string | number">
                            <SelectTrigger class="border-neutral-200 focus:ring-neutral-400 bg-white text-left">
                                <SelectValue placeholder="Pilih Mitra Partner" />
                            </SelectTrigger>
                            <SelectContent class="bg-white border shadow-md border-neutral-200">
                                <SelectGroup>
                                    <SelectItem v-for="m in listMitra" :key="m.id_mitra" :value="String(m.id_mitra)">
                                        {{ m.nama_perusahaan }} ({{ m.tipe_perusahaan }})
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <!-- Items Section -->
                <div class="space-y-3">
                    <div class="flex items-center justify-between border-b pb-2">
                        <h3 class="text-sm font-bold text-neutral-900 uppercase tracking-wider">Nested Items List</h3>
                        <Button type="button" @click="addItem" variant="outline" size="sm" class="h-8 border-neutral-300 text-neutral-700 hover:bg-neutral-50">
                            <PlusIcon class="w-3.5 h-3.5 mr-1" /> Add Row
                        </Button>
                    </div>

                    <div class="overflow-x-auto border border-neutral-200 rounded-lg">
                        <table class="w-full text-left border-collapse text-xs">
                            <thead class="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
                                <tr>
                                    <th class="p-3 w-[20%]">Style <span class="text-red-500">*</span></th>
                                    <th class="p-3 w-[20%]">Colour <span class="text-red-500">*</span></th>
                                    <th class="p-3 w-[12%]">Qty <span class="text-red-500">*</span></th>
                                    <th class="p-3 w-[15%]">Price <span class="text-red-500">*</span></th>
                                    <th class="p-3">Description</th>
                                    <th class="p-3 text-center w-[8%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(item, idx) in form.items" :key="idx" class="border-b border-neutral-200 last:border-0 hover:bg-neutral-50/50">
                                    <td class="p-2">
                                        <Input v-model="item.style" placeholder="Style/Model" class="h-8 text-xs border-neutral-200 focus-visible:ring-neutral-400 bg-white" />
                                    </td>
                                    <td class="p-2">
                                        <Input v-model="item.colour" placeholder="Colour" class="h-8 text-xs border-neutral-200 focus-visible:ring-neutral-400 bg-white" />
                                    </td>
                                    <td class="p-2">
                                        <Input v-model="item.qty" type="number" min="1" class="h-8 text-xs border-neutral-200 focus-visible:ring-neutral-400 bg-white" />
                                    </td>
                                    <td class="p-2">
                                        <Input v-model="item.price" type="number" min="0" step="0.01" class="h-8 text-xs border-neutral-200 focus-visible:ring-neutral-400 bg-white" />
                                    </td>
                                    <td class="p-2">
                                        <Input v-model="item.description" placeholder="Optional desc" class="h-8 text-xs border-neutral-200 focus-visible:ring-neutral-400 bg-white" />
                                    </td>
                                    <td class="p-2 text-center">
                                        <Button type="button" @click="removeItem(idx)" variant="ghost" size="icon" class="h-7 w-7 text-neutral-400 hover:text-red-600 rounded-md" :disabled="form.items.length <= 1">
                                            <Trash2Icon class="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Penanggung Jawab Section -->
                <div class="space-y-3">
                    <div class="flex items-center justify-between border-b pb-2">
                        <h3 class="text-sm font-bold text-neutral-900 uppercase tracking-wider">Penanggung Jawab (PIC) List</h3>
                        <Button type="button" @click="addPIC" variant="outline" size="sm" class="h-8 border-neutral-300 text-neutral-700 hover:bg-neutral-50">
                            <PlusIcon class="w-3.5 h-3.5 mr-1" /> Add PIC
                        </Button>
                    </div>

                    <div class="overflow-x-auto border border-neutral-200 rounded-lg">
                        <table class="w-full text-left border-collapse text-xs">
                            <thead class="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
                                <tr>
                                    <th class="p-3 w-[30%]">Nama <span class="text-red-500">*</span></th>
                                    <th class="p-3 w-[30%]">No. Telp <span class="text-red-500">*</span></th>
                                    <th class="p-3">Email</th>
                                    <th class="p-3 text-center w-[8%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(pic, idx) in form.penanggungJawab" :key="idx" class="border-b border-neutral-200 last:border-0 hover:bg-neutral-50/50">
                                    <td class="p-2">
                                        <Input v-model="pic.nama" placeholder="Nama Lengkap" class="h-8 text-xs border-neutral-200 focus-visible:ring-neutral-400 bg-white" />
                                    </td>
                                    <td class="p-2">
                                        <Input v-model="pic.noTelp" placeholder="08xxxxxxxxxx" class="h-8 text-xs border-neutral-200 focus-visible:ring-neutral-400 bg-white" />
                                    </td>
                                    <td class="p-2">
                                        <Input v-model="pic.email" placeholder="contoh@email.com" class="h-8 text-xs border-neutral-200 focus-visible:ring-neutral-400 bg-white" />
                                    </td>
                                    <td class="p-2 text-center">
                                        <Button type="button" @click="removePIC(idx)" variant="ghost" size="icon" class="h-7 w-7 text-neutral-400 hover:text-red-600 rounded-md" :disabled="form.penanggungJawab.length <= 1">
                                            <Trash2Icon class="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <DialogFooter class="border-t border-neutral-200 pt-4 flex gap-2 justify-end">
                <Button type="button" variant="ghost" @click="isDialogOpen = false" class="text-neutral-500 hover:bg-neutral-50">
                    Cancel
                </Button>
                <Button type="button" @click="handleSave" :disabled="isSaving" class="bg-neutral-900 text-white hover:bg-neutral-800 px-6 shadow-sm border border-neutral-800">
                    {{ isSaving ? 'Saving...' : (isEditMode ? 'Update Document' : 'Create Document') }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
