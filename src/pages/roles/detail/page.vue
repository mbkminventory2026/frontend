<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useParams, useRouter } from '@tanstack/vue-router';
import {
    ShieldIcon,
    Hash,
    PencilIcon,
    Calendar,
    Info,
    ShieldAlertIcon
} from 'lucide-vue-next';

import { getRoleById } from '@/api/roles/roles';
import { getPermissions } from '@/api/permissions/permissions';
import { usePermission } from '@/composables/usePermission';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/formatter';

const router = useRouter();
const { hasPermission } = usePermission();
const params = useParams({ from: '/_authenticated/roles/$id' });
const id = computed(() => params.value.id);

const values = ref<any>(null);
const allPermissions = ref<any[]>([]);
const isLoading = ref(false);

const matchedPermissions = computed(() => {
    if (!values.value || !values.value.hak_akses_ids || allPermissions.value.length === 0) return [];
    return values.value.hak_akses_ids.map((id: number) => {
        return allPermissions.value.find(p => String(p.id_hak_akses) === String(id));
    }).filter(Boolean);
});

const fetchData = async () => {
    isLoading.value = true;
    try {
        // Fetch role data
        const response = await getRoleById(id.value);
        const data = Array.isArray(response) ? response[0] : response;
        values.value = data;

        // Fetch all permissions for lookup mapping
        const permRes = await getPermissions({ limit: 200, offset: 0 });
        allPermissions.value = permRes.results;
    } catch (error) {
        console.error('Gagal fetch detail role:', error);
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
            <p class="text-muted-foreground animate-pulse">Memuat data role...</p>
        </div>

        <div v-else-if="values && values.id_role">
            <!-- Header Section -->
            <div class="flex flex-col md:flex-row gap-6 items-center mb-8">
                <div class="bg-primary/10 p-4 rounded-2xl">
                    <ShieldIcon class="w-12 h-12 text-primary" />
                </div>

                <div class="flex-1 space-y-1 text-center md:text-left">
                    <h1 class="text-3xl font-bold tracking-tight text-neutral-900">{{ values.nama_role }}</h1>
                    <p class="text-muted-foreground">ID Role: {{ values.id_role }}</p>
                </div>

                <div class="flex gap-2 w-full md:w-auto">
                    <Button @click="router.history.back()" variant="ghost" class="flex-1 md:flex-none">
                        Kembali
                    </Button>
                    <Button
                        v-if="hasPermission('ROLE_UPDATE')"
                        @click="router.navigate({ to: '/roles/edit/$id', params: { id } })"
                        class="flex-1 md:flex-none"
                    >
                        <PencilIcon class="w-4 h-4 mr-2" /> Edit Role
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
                                <ShieldIcon class="w-5 h-5 text-primary" />
                                Informasi Role
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="pt-6">
                            <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div class="space-y-1">
                                    <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nama Role</p>
                                    <p class="text-xl font-semibold">{{ values.nama_role }}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <!-- Hak Akses Card -->
                    <Card class="overflow-hidden border-none shadow-md">
                        <CardHeader class="bg-muted/30 pb-4">
                            <CardTitle class="text-lg flex items-center gap-2">
                                <ShieldAlertIcon class="w-5 h-5 text-primary" />
                                Hak Akses / Permissions ({{ matchedPermissions.length }})
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="pt-6">
                            <div v-if="matchedPermissions.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div 
                                    v-for="perm in matchedPermissions" 
                                    :key="perm.id_hak_akses"
                                    class="p-3 border rounded-lg bg-neutral-50 flex flex-col gap-1"
                                >
                                    <span class="text-sm font-semibold text-slate-800">{{ perm.nama_halaman }}</span>
                                    <span class="text-[10px] font-mono text-slate-500">{{ perm.kode_permission }}</span>
                                </div>
                            </div>
                            <div v-else class="text-center py-6 text-muted-foreground text-sm">
                                Tidak ada hak akses yang diberikan untuk role ini.
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
                                <span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">Master Akses</span>
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
                                Role digunakan untuk membatasi aksi dan halaman yang boleh diakses oleh pengguna. Mengubah hak akses role akan langsung berdampak ke seluruh pengguna dengan role tersebut.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>

        <div v-else class="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
            <div class="bg-muted p-4 rounded-full">
                <ShieldIcon class="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 class="text-2xl font-bold">Data Tidak Ditemukan</h2>
            <p class="text-muted-foreground">Maaf, role dengan ID tersebut tidak dapat ditemukan.</p>
            <Button @click="router.navigate({ to: '/roles' })">Kembali ke Daftar Role</Button>
        </div>
    </div>
</template>
