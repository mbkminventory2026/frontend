<script setup lang="ts">
import { computed } from 'vue';
import { useParams, useRouter } from '@tanstack/vue-router';
import {
    Layers,
    Hash,
    PencilIcon,
    Calendar,
    Info,
    Package
} from 'lucide-vue-next';

import { getJenisBarangById } from '@/api/jenis-barang/jenis-barang';
import { usePermission } from '@/composables/usePermission';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/formatter';
import { ref, onMounted } from 'vue';

const router = useRouter();
const { hasPermission } = usePermission();
const params = useParams({ from: '/_authenticated/jenis-barang/$id' });
const id = computed(() => params.value.id);

const values = ref<any>(null);
const isLoading = ref(false);

const fetchData = async () => {
    isLoading.value = true;
    try {
        const response = await getJenisBarangById(id.value);
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
            <p class="text-muted-foreground animate-pulse">Memuat data jenis barang...</p>
        </div>

        <div v-else-if="values && values.id_jenis_barang">
            <!-- Header Section -->
            <div class="flex flex-col md:flex-row gap-6 items-center mb-8">
                <div class="bg-primary/10 p-4 rounded-2xl">
                    <Layers class="w-12 h-12 text-primary" />
                </div>

                <div class="flex-1 space-y-1 text-center md:text-left">
                    <div class="flex items-center justify-center md:justify-start gap-2">
                        <h1 class="text-3xl font-bold tracking-tight">{{ values.nama_jenis_barang }}</h1>
                        <span class="px-2 py-1 bg-muted text-muted-foreground text-xs font-mono rounded">{{ values.kode }}</span>
                    </div>
                    <p class="text-muted-foreground">ID Jenis Barang: {{ values.id_jenis_barang }}</p>
                </div>

                <div class="flex gap-2 w-full md:w-auto">
                    <Button @click="router.history.back()" variant="ghost" class="flex-1 md:flex-none">
                        Kembali
                    </Button>
                    <Button
                        v-if="hasPermission('MASTER_JENIS_BARANG_UPDATE')"
                        @click="router.navigate({ to: '/jenis-barang/edit/$id', params: { id } })"
                        class="flex-1 md:flex-none"
                    >
                        <PencilIcon class="w-4 h-4 mr-2" /> Edit Jenis Barang
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
                                Informasi Jenis Barang
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="pt-6">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div class="space-y-1">
                                    <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nama Jenis Barang</p>
                                    <p class="text-lg font-semibold">{{ values.nama_jenis_barang }}</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Kode Jenis</p>
                                    <p class="text-lg font-mono">{{ values.kode }}</p>
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
                                    <Calendar class="w-4 h-4" /> Dibuat Pada
                                </span>
                                <span class="font-medium">{{ formatDate(values.created_at) }}</span>
                            </div>
                            <Separator />
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-muted-foreground flex items-center gap-2">
                                    <Hash class="w-4 h-4" /> Status
                                </span>
                                <span class="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">Kategori</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card class="bg-primary/5 border-primary/10 shadow-none">
                        <CardHeader class="pb-2">
                            <CardTitle class="text-sm font-semibold text-primary flex items-center gap-2">
                                <Info class="w-4 h-4" /> Bantuan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p class="text-xs text-primary/80 leading-relaxed">
                                Jenis barang mempermudah klasifikasi dalam inventaris. Pastikan kode unik dan nama jelas.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>

        <div v-else class="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
            <div class="bg-muted p-4 rounded-full">
                <Layers class="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 class="text-2xl font-bold">Data Tidak Ditemukan</h2>
            <p class="text-muted-foreground">Maaf, jenis barang dengan ID tersebut tidak dapat ditemukan.</p>
            <Button @click="router.navigate({ to: '/jenis-barang' })">Kembali ke Daftar Jenis Barang</Button>
        </div>
    </div>
</template>
