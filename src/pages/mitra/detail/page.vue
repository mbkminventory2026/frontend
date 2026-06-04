<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useParams, useRouter } from '@tanstack/vue-router';
import {
    Building,
    Hash,
    PencilIcon,
    Calendar,
    Info,
    Mail,
    Phone,
    Globe,
    MapPin
} from 'lucide-vue-next';

import { getMitraById } from '@/api/mitra/mitra';
import { usePermission } from '@/composables/usePermission';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/formatter';

const router = useRouter();
const { hasPermission } = usePermission();
const params = useParams({ from: '/_authenticated/mitra/$id' });
const id = computed(() => params.value.id);

const values = ref<any>(null);
const isLoading = ref(false);

const fetchData = async () => {
    isLoading.value = true;
    try {
        const response = await getMitraById(id.value);
        const data = Array.isArray(response) ? response[0] : response;
        values.value = data;
    } catch (error) {
        console.error('Gagal fetch data:', error);
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    fetchData();
});
</script>

<template>
    <div class="container mx-auto py-8 max-w-5xl">
        <div v-if="isLoading" class="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <Spinner class="size-8" />
            <p class="text-muted-foreground animate-pulse">Memuat data mitra...</p>
        </div>

        <div v-else-if="values && values.id_mitra">
            <!-- Header Section -->
            <div class="flex flex-col md:flex-row gap-6 items-center mb-8">
                <div class="bg-primary/10 p-4 rounded-2xl">
                    <Building class="w-12 h-12 text-primary" />
                </div>

                <div class="flex-1 space-y-1 text-center md:text-left">
                    <h1 class="text-3xl font-bold tracking-tight">{{ values.nama_perusahaan }}</h1>
                    <div class="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                        <span class="flex items-center gap-1.5">
                            <Globe class="w-4 h-4" /> {{ values.tipe_perusahaan }}
                        </span>
                        <span class="flex items-center gap-1.5">
                            <Mail class="w-4 h-4" /> {{ values.email }}
                        </span>
                    </div>
                </div>

                <div class="flex gap-2 w-full md:w-auto">
                    <Button @click="router.history.back()" variant="ghost" class="flex-1 md:flex-none">
                        Kembali
                    </Button>
                    <Button
                        v-if="hasPermission('MASTER_MITRA_UPDATE')"
                        @click="router.navigate({ to: '/mitra/edit/$id', params: { id } })"
                        class="flex-1 md:flex-none"
                    >
                        <PencilIcon class="w-4 h-4 mr-2" /> Edit Mitra
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
                                <Info class="w-5 h-5 text-primary" />
                                Informasi Detail Mitra
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="pt-6">
                            <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div class="space-y-1">
                                        <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nama Perusahaan</p>
                                        <p class="text-lg font-semibold">{{ values.nama_perusahaan }}</p>
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipe Perusahaan</p>
                                        <p class="text-lg font-medium">{{ values.tipe_perusahaan }}</p>
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</p>
                                        <div class="flex items-center gap-2">
                                            <Mail class="w-4 h-4 text-muted-foreground" />
                                            <p>{{ values.email }}</p>
                                        </div>
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">No. Telepon</p>
                                        <div class="flex items-center gap-2">
                                            <Phone class="w-4 h-4 text-muted-foreground" />
                                            <p>{{ values.no_telp }}</p>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div class="space-y-4">
                                    <h3 class="text-sm font-semibold flex items-center gap-2">
                                        <MapPin class="w-4 h-4 text-primary" /> Lokasi
                                    </h3>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div class="space-y-1">
                                            <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Kota</p>
                                            <p>{{ values.kota }}</p>
                                        </div>
                                        <div class="space-y-1">
                                            <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Kode Pos</p>
                                            <p class="font-mono">{{ values.kode_pos }}</p>
                                        </div>
                                        <div class="sm:col-span-2 space-y-1">
                                            <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Alamat Lengkap</p>
                                            <p class="leading-relaxed">{{ values.alamat }}</p>
                                        </div>
                                    </div>
                                </div>
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
                                    <Calendar class="w-4 h-4" /> Terdaftar Pada
                                </span>
                                <span class="font-medium">{{ formatDate(values.created_at) }}</span>
                            </div>
                            <Separator />
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-muted-foreground flex items-center gap-2">
                                    <Hash class="w-4 h-4" /> ID Mitra
                                </span>
                                <span class="font-mono text-xs">{{ values.id_mitra }}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card class="bg-primary/5 border-primary/10 shadow-none">
                        <CardHeader class="pb-2">
                            <CardTitle class="text-sm font-semibold text-primary flex items-center gap-2">
                                <Info class="w-4 h-4" /> Catatan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p class="text-xs text-primary/80 leading-relaxed">
                                Data mitra digunakan untuk keperluan pengiriman dan invoicing. Pastikan email dan nomor telepon aktif untuk kemudahan komunikasi.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>

        <div v-else class="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
            <div class="bg-muted p-4 rounded-full">
                <Building class="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 class="text-2xl font-bold">Mitra Tidak Ditemukan</h2>
            <p class="text-muted-foreground">Maaf, data mitra yang Anda cari tidak tersedia.</p>
            <Button @click="router.navigate({ to: '/mitra' })">Kembali ke Daftar Mitra</Button>
        </div>
    </div>
</template>
