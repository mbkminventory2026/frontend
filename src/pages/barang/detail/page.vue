<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useParams, useRouter } from '@tanstack/vue-router';
import { 
    Package, 
    Hash, 
    Layers, 
    BuildingIcon, 
    PencilIcon, 
    SaveIcon, 
    XIcon,
    Calendar,
    Info
} from 'lucide-vue-next';

import { getBarangById, updateBarang } from '@/api/barang/barang';
import { getJenisBarang } from '@/api/barang/jenisBarang';
import { getMitra } from '@/api/mitra/mitra';
import { useForm } from '@/composables/form/useForm';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppForm from '@/components/form/AppForm.vue';
import AppFormField from '@/components/form/AppFormField.vue';
import { formatDate } from '@/lib/formatter';

const router = useRouter();
const params = useParams({ from: '/_authenticated/barang/$id' });
const id = computed(() => params.value.id);

const jenisBarangOptions = ref<{ label: string, value: number }[]>([]);
const mitraOptions = ref<{ label: string, value: number }[]>([]);

const fetchOptions = async () => {
    try {
        const [jbRes, mRes] = await Promise.all([
            getJenisBarang(),
            getMitra({ limit: 100, offset: 0 })
        ]);
        
        jenisBarangOptions.value = jbRes.map(item => ({
            label: item.nama_jenis_barang,
            value: item.id_jenis_barang
        }));
        
        mitraOptions.value = mRes.results.map((item: any) => ({
            label: item.nama_perusahaan,
            value: item.id_mitra
        }));
    } catch (error) {
        console.error("Gagal fetch options:", error);
    }
}

const form = useForm({
    api: {
        get: () => getBarangById(id.value),
        update: (_id, payload) => {
            // Remove read-only or extra fields
            const { 
                created_at, 
                nama_jenis_barang, 
                nama_perusahaan, 
                id_barang,
                ...data 
            } = payload;
            return updateBarang(id_barang, data);
        }
    },
    id: id.value,
    immediate: true
});

const { values, isLoading, isSaving, isEditing } = form;

onMounted(() => {
    fetchOptions();
});
</script>

<template>
    <div class="container mx-auto py-8 max-w-5xl">
        <div v-if="isLoading" class="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <Spinner class="size-8" />
            <p class="text-muted-foreground animate-pulse">Memuat data barang...</p>
        </div>

        <div v-else-if="values && values.id_barang">
            <!-- Header Section -->
            <div class="flex flex-col md:flex-row gap-6 items-center mb-8">
                <div class="bg-primary/10 p-4 rounded-2xl">
                    <Package class="w-12 h-12 text-primary" />
                </div>
                
                <div class="flex-1 space-y-1 text-center md:text-left">
                    <div class="flex items-center justify-center md:justify-start gap-2">
                        <h1 class="text-3xl font-bold tracking-tight">{{ values.nama_barang }}</h1>
                        <span class="px-2 py-1 bg-muted text-muted-foreground text-xs font-mono rounded">{{ values.kode }}</span>
                    </div>
                    <p class="text-muted-foreground">ID Barang: {{ values.id_barang }}</p>
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
                            <PencilIcon class="w-4 h-4 mr-2" /> Edit Barang
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
                                Informasi Barang
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="pt-6">
                            <!-- VIEW MODE -->
                            <div v-if="!isEditing" class="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div class="space-y-1">
                                    <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nama Barang</p>
                                    <p class="text-lg font-semibold">{{ values.nama_barang }}</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Kode Barang</p>
                                    <p class="text-lg font-mono">{{ values.kode }}</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Jenis Barang</p>
                                    <div class="flex items-center gap-2">
                                        <Layers class="w-4 h-4 text-muted-foreground" />
                                        <p class="font-medium">{{ values.nama_jenis_barang }}</p>
                                    </div>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Perusahaan (Mitra)</p>
                                    <div class="flex items-center gap-2">
                                        <BuildingIcon class="w-4 h-4 text-muted-foreground" />
                                        <p class="font-medium">{{ values.nama_perusahaan }}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- EDIT MODE -->
                            <div v-else class="animate-in fade-in slide-in-from-top-4 duration-500">
                                <AppForm :form="form">
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <AppFormField name="nama_barang" label="Nama Barang" placeholder="Masukkan nama barang" />
                                        <AppFormField name="kode" label="Kode Barang" placeholder="Contoh: BRG-001" />
                                        <AppFormField 
                                            name="id_jenis_barang" 
                                            type="select" 
                                            label="Jenis Barang" 
                                            placeholder="Pilih jenis barang" 
                                            :options="jenisBarangOptions"
                                        />
                                        <AppFormField 
                                            name="id_mitra" 
                                            type="select" 
                                            label="Perusahaan (Mitra)" 
                                            placeholder="Pilih mitra" 
                                            :options="mitraOptions"
                                        />
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
                                    <Hash class="w-4 h-4" /> Status
                                </span>
                                <span class="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">Aktif</span>
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
                                Anda dapat memperbarui informasi barang dengan menekan tombol Edit. Pastikan semua field wajib diisi sebelum menyimpan.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>

        <div v-else class="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
            <div class="bg-muted p-4 rounded-full">
                <Package class="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 class="text-2xl font-bold">Data Tidak Ditemukan</h2>
            <p class="text-muted-foreground">Maaf, barang dengan ID tersebut tidak dapat ditemukan atau telah dihapus.</p>
            <Button @click="router.navigate({ to: '/barang' })">Kembali ke Daftar Barang</Button>
        </div>
    </div>
</template>
