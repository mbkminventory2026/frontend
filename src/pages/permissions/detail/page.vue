<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useParams, useRouter } from '@tanstack/vue-router';
import {
    Shield,
    Hash,
    PencilIcon,
    Calendar,
    Layout
} from 'lucide-vue-next';

import { getPermissionsById } from '@/api/permissions/permissions';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/formatter';

const router = useRouter();
const params = useParams({ from: '/_authenticated/permissions/$id' });
const id = computed(() => params.value.id);

const values = ref<any>(null);
const isLoading = ref(false);

const fetchData = async () => {
    isLoading.value = true;
    try {
        const response = await getPermissionsById(id.value);
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
            <p class="text-muted-foreground animate-pulse">Memuat data permission...</p>
        </div>

        <div v-else-if="values && values.id_hak_akses">
            <!-- Header Section -->
            <div class="flex flex-col md:flex-row gap-6 items-center mb-8">
                <div class="bg-primary/10 p-4 rounded-2xl">
                    <Shield class="w-12 h-12 text-primary" />
                </div>

                <div class="flex-1 space-y-1 text-center md:text-left">
                    <h1 class="text-3xl font-bold tracking-tight">{{ values.nama_halaman }}</h1>
                    <p class="text-muted-foreground">ID Hak Akses: {{ values.id_hak_akses }}</p>
                </div>

                <div class="flex gap-2 w-full md:w-auto">
                    <Button @click="router.history.back()" variant="ghost" class="flex-1 md:flex-none">
                        Kembali
                    </Button>
                    <Button
                        @click="router.navigate({ to: '/permissions/edit/$id', params: { id } })"
                        class="flex-1 md:flex-none"
                    >
                        <PencilIcon class="w-4 h-4 mr-2" /> Edit Permission
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
                                <Layout class="w-5 h-5 text-primary" />
                                Konfigurasi Permission
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="pt-6">
                            <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div class="space-y-1">
                                        <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nama Halaman / Modul</p>
                                        <p class="text-lg font-semibold">{{ values.nama_halaman }}</p>
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Kode Permission</p>
                                        <p class="text-lg font-mono font-semibold text-primary">{{ values.kode_permission }}</p>
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Domain Permission</p>
                                        <p class="text-lg font-semibold">{{ values.domain_permission || '-' }}</p>
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Aksi Permission</p>
                                        <p class="text-lg font-semibold">{{ values.aksi_permission || '-' }}</p>
                                    </div>
                                    <div class="space-y-1 md:col-span-2">
                                        <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Deskripsi</p>
                                        <p class="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 min-h-[80px] whitespace-pre-wrap">{{ values.deskripsi || 'Tidak ada deskripsi.' }}</p>
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
                                    <Calendar class="w-4 h-4" /> Dibuat Pada
                                </span>
                                <span class="font-medium">{{ formatDate(values.created_at) }}</span>
                            </div>
                            <Separator />
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-muted-foreground flex items-center gap-2">
                                    <Hash class="w-4 h-4" /> Kode Internal
                                </span>
                                <span class="font-mono text-xs">{{ values.id_hak_akses }}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card class="bg-primary/5 border-primary/10 shadow-none">
                        <CardHeader class="pb-2">
                            <CardTitle class="text-sm font-semibold text-primary flex items-center gap-2">
                                <Shield class="w-4 h-4" /> Keamanan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p class="text-xs text-primary/80 leading-relaxed">
                                Nama halaman ini digunakan untuk menentukan akses pengguna pada sistem navigasi. Perubahan dapat berdampak pada visibilitas menu bagi pengguna.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>

        <div v-else class="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
            <div class="bg-muted p-4 rounded-full">
                <Shield class="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 class="text-2xl font-bold">Data Tidak Ditemukan</h2>
            <p class="text-muted-foreground">Maaf, data permission ini tidak dapat dimuat.</p>
            <Button @click="router.navigate({ to: '/permissions' })">Kembali ke Daftar Permissions</Button>
        </div>
    </div>
</template>
