<script setup lang="ts">
import { computed } from 'vue';
import { useParams, useRouter } from '@tanstack/vue-router';
import { 
    Calendar, 
    Package, 
    Hash, 
    Layers, 
    PencilIcon, 
    SaveIcon, 
    XIcon,
    Info,
    ClipboardList,
    FileText
} from 'lucide-vue-next';

import { getReportPenerimaanById, updateReportPenerimaan } from '@/api/reportPenerimaan/reportPenerimaan';
import { useForm } from '@/composables/form/useForm';
import { parseToInt } from '@/lib/number';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppForm from '@/components/form/AppForm.vue';
import AppFormField from '@/components/form/AppFormField.vue';
import { formatDate } from '@/lib/formatter';

const router = useRouter();
const params = useParams({ from: '/_authenticated/report-penerimaan/$id' });
const id = computed(() => params.value.id);

const form = useForm({
    api: {
        get: () => getReportPenerimaanById(id.value),
        update: (_id, payload) => {
            const { created_at, id_received, ...data } = payload;
            if (data.qty !== undefined) data.qty = parseToInt(data.qty);
            if (data.id_material_list_item !== undefined) data.id_material_list_item = parseToInt(data.id_material_list_item);
            return updateReportPenerimaan(id_received || id, data);
        }
    },
    id: id.value,
    immediate: true
});

const { values, isLoading, isSaving, isEditing } = form;
</script>

<template>
    <div class="container mx-auto py-8 max-w-5xl">
        <div v-if="isLoading" class="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <Spinner class="size-8" />
            <p class="text-muted-foreground animate-pulse">Memuat laporan penerimaan...</p>
        </div>

        <div v-else-if="values && (values.id_received || values.idReceived)">
            <!-- Header Section -->
            <div class="flex flex-col md:flex-row gap-6 items-center mb-8">
                <div class="bg-primary/10 p-4 rounded-2xl">
                    <ClipboardList class="w-12 h-12 text-primary" />
                </div>
                
                <div class="flex-1 space-y-1 text-center md:text-left">
                    <h1 class="text-3xl font-bold tracking-tight">Laporan Penerimaan</h1>
                    <div class="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                        <span class="flex items-center gap-1.5 font-mono">
                            <Hash class="w-4 h-4" /> {{ values.id_received || values.idReceived }}
                        </span>
                        <span class="flex items-center gap-1.5">
                            <Calendar class="w-4 h-4" /> {{ formatDate(values.tanggal) }}
                        </span>
                    </div>
                </div>

                <div class="flex gap-2 w-full md:w-auto">
                    <Button @click="router.history.back()" variant="ghost" class="flex-1 md:flex-none">
                        Kembali
                    </Button>
                    <Button @click="form.toggleEdit" :variant="isEditing ? 'outline' : 'default'" class="flex-1 md:flex-none">
                        <template v-if="isEditing">
                            <XIcon class="w-4 h-4 mr-2" /> Batal
                        </template>
                        <template v-else>
                            <PencilIcon class="w-4 h-4 mr-2" /> Edit Laporan
                        </template>
                    </Button>
                </div>
            </div>

            <!-- Content Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Main Info -->
                <div class="md:col-span-2 space-y-6">
                    <Card class="overflow-hidden border-none shadow-md">
                        <CardHeader class="bg-muted/30 pb-4">
                            <CardTitle class="text-lg flex items-center gap-2">
                                <Package class="w-5 h-5 text-primary" />
                                Rincian Penerimaan
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="pt-6">
                            <!-- VIEW MODE -->
                            <div v-if="!isEditing" class="grid grid-cols-1 sm:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div class="space-y-1">
                                    <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tanggal Penerimaan</p>
                                    <div class="flex items-center gap-2">
                                        <Calendar class="w-4 h-4 text-muted-foreground" />
                                        <p class="text-lg font-semibold">{{ formatDate(values.tanggal) }}</p>
                                    </div>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quantity (Qty)</p>
                                    <div class="flex items-center gap-2">
                                        <Package class="w-4 h-4 text-primary" />
                                        <p class="text-2xl font-bold">{{ values.qty }}</p>
                                    </div>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">ID Material List Item</p>
                                    <div class="flex items-center gap-2">
                                        <Layers class="w-4 h-4 text-muted-foreground" />
                                        <p class="font-medium text-lg font-mono">{{ values.id_material_list_item }}</p>
                                    </div>
                                </div>
                                <div class="sm:col-span-2 space-y-1">
                                    <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Keterangan</p>
                                    <div class="flex items-start gap-2">
                                        <FileText class="w-4 h-4 text-muted-foreground mt-1" />
                                        <p class="text-slate-700 leading-relaxed">{{ values.keterangan || '-' }}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- EDIT MODE -->
                            <div v-else class="animate-in fade-in slide-in-from-top-4 duration-500">
                                <AppForm :form="form">
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <AppFormField name="tanggal" type="date" label="Tanggal Penerimaan" placeholder="Pilih tanggal penerimaan" />
                                        <AppFormField name="qty" type="number" label="Quantity (Qty)" placeholder="Masukkan quantity" />
                                        <AppFormField name="id_material_list_item" type="number" label="ID Material List Item" placeholder="Masukkan ID Material List Item" />
                                        <div class="sm:col-span-2">
                                            <AppFormField name="keterangan" type="text" label="Keterangan" placeholder="Masukkan keterangan (opsional)" />
                                        </div>
                                    </div>
                                    
                                    <div class="flex justify-end pt-4">
                                        <Button type="submit" :disabled="isSaving" class="px-8 shadow-lg shadow-primary/20">
                                            <template v-if="isSaving">
                                                <Spinner class="w-4 h-4 mr-2" /> Menyimpan...
                                            </template>
                                            <template v-else>
                                                <SaveIcon class="w-4 h-4 mr-2" /> Simpan Perubahan
                                            </template>
                                        </Button>
                                    </div>
                                </AppForm>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <!-- Sidebar / Meta Info -->
                <div class="space-y-6">
                    <Card class="border-none shadow-md">
                        <CardHeader>
                            <CardTitle class="text-sm font-medium">Metadata</CardTitle>
                        </CardHeader>
                        <CardContent class="space-y-4">
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-muted-foreground flex items-center gap-2">
                                    <Calendar class="w-4 h-4" /> Dibuat Pada
                                </span>
                                <span class="font-medium">{{ formatDate(values.created_at) }}</span>
                            </div>
                            <Separator />
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-muted-foreground flex items-center gap-2">
                                    <Hash class="w-4 h-4" /> ID Laporan
                                </span>
                                <span class="font-mono text-xs">{{ values.id_received || values.idReceived }}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card class="bg-primary/5 border-primary/10 shadow-none">
                        <CardHeader class="pb-2">
                            <CardTitle class="text-sm font-semibold text-primary flex items-center gap-2">
                                <Info class="w-4 h-4" /> Informasi
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p class="text-xs text-primary/80 leading-relaxed">
                                Laporan penerimaan mencatat histori masuknya material logistik. Pastikan jumlah fisik yang diterima cocok dengan catatan sistem.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>

        <div v-else class="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
            <div class="bg-muted p-4 rounded-full">
                <ClipboardList class="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 class="text-2xl font-bold">Laporan Tidak Ditemukan</h2>
            <p class="text-muted-foreground">Maaf, laporan penerimaan dengan ID tersebut tidak dapat ditemukan.</p>
            <Button @click="router.navigate({ to: '/report-penerimaan' })">Kembali ke Daftar Laporan</Button>
        </div>
    </div>
</template>
