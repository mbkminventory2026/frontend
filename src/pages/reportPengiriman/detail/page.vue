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
    ClipboardList
} from 'lucide-vue-next';

import { getReportPengirimanById, updateReportPengiriman } from '@/api/reportPengiriman/reportPengiriman';
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
const params = useParams({ from: '/_authenticated/report-pengiriman/$id' });
const id = computed(() => params.value.id);

// Options for WO Shell Size (following reportPengiriman/page.vue)
const woShellSizeOptions = [
    { label: "1", value: 1 },
    { label: "2", value: 2 }
];

const form = useForm({
    api: {
        get: () => getReportPengirimanById(id.value),
        update: (_id, payload) => {
            const { created_at, id_report_pengiriman, ...data } = payload;
            if (data.quantity !== undefined) data.quantity = parseToInt(data.quantity);
            return updateReportPengiriman(id_report_pengiriman || id, data);
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
            <p class="text-muted-foreground animate-pulse">Memuat laporan pengiriman...</p>
        </div>

        <div v-else-if="values && (values.id_report_pengiriman || values.idReportPengiriman)">
            <!-- Header Section -->
            <div class="flex flex-col md:flex-row gap-6 items-center mb-8">
                <div class="bg-primary/10 p-4 rounded-2xl">
                    <ClipboardList class="w-12 h-12 text-primary" />
                </div>
                
                <div class="flex-1 space-y-1 text-center md:text-left">
                    <h1 class="text-3xl font-bold tracking-tight">Laporan Pengiriman</h1>
                    <div class="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                        <span class="flex items-center gap-1.5 font-mono">
                            <Hash class="w-4 h-4" /> {{ values.id_report_pengiriman || values.idReportPengiriman }}
                        </span>
                        <span class="flex items-center gap-1.5">
                            <Calendar class="w-4 h-4" /> {{ formatDate(values.date) }}
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
                                Rincian Pengiriman
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="pt-6">
                            <!-- VIEW MODE -->
                            <div v-if="!isEditing" class="grid grid-cols-1 sm:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div class="space-y-1">
                                    <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tanggal Pengiriman</p>
                                    <div class="flex items-center gap-2">
                                        <Calendar class="w-4 h-4 text-muted-foreground" />
                                        <p class="text-lg font-semibold">{{ formatDate(values.date) }}</p>
                                    </div>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quantity</p>
                                    <div class="flex items-center gap-2">
                                        <Package class="w-4 h-4 text-primary" />
                                        <p class="text-2xl font-bold">{{ values.quantity }}</p>
                                    </div>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">WO Shell Size</p>
                                    <div class="flex items-center gap-2">
                                        <Layers class="w-4 h-4 text-muted-foreground" />
                                        <p class="font-medium text-lg">{{ values.id_wo_shell_size }}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- EDIT MODE -->
                            <div v-else class="animate-in fade-in slide-in-from-top-4 duration-500">
                                <AppForm :form="form">
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <AppFormField name="date" type="date" label="Tanggal Pengiriman" placeholder="Pilih tanggal" />
                                        <AppFormField name="quantity" type="number" label="Quantity" placeholder="Masukkan quantity" />
                                        <div class="sm:col-span-2">
                                            <AppFormField 
                                                name="id_wo_shell_size" 
                                                type="select" 
                                                label="WO Shell Size" 
                                                placeholder="Pilih WO Shell Size" 
                                                :options="woShellSizeOptions"
                                            />
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
                                <span class="font-mono text-xs">{{ values.id_report_pengiriman || values.idReportPengiriman }}</span>
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
                                Laporan pengiriman mencatat histori distribusi barang. Pastikan quantity sesuai dengan fisik barang yang dikirim.
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
            <p class="text-muted-foreground">Maaf, laporan pengiriman dengan ID tersebut tidak dapat ditemukan.</p>
            <Button @click="router.navigate({ to: '/report-pengiriman' })">Kembali ke Daftar Laporan</Button>
        </div>
    </div>
</template>
