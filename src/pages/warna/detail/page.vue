<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useParams, useRouter } from '@tanstack/vue-router';
import { 
    Palette, 
    Hash, 
    PencilIcon, 
    SaveIcon, 
    XIcon,
    Calendar,
    Info
} from 'lucide-vue-next';

import { getWarna, getWarnaById, updateWarna } from '@/api/warna/warna';
import { useForm } from '@/composables/form/useForm';
import { isSimilarName } from '@/lib/utils';
import { type WarnaResponseItem } from '@/schemas/warna/response';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppForm from '@/components/form/AppForm.vue';
import AppFormField from '@/components/form/AppFormField.vue';
import { formatDate } from '@/lib/formatter';

const router = useRouter();
const params = useParams({ from: '/_authenticated/warna/$id' });
const id = computed(() => params.value.id);

const form = useForm({
    api: {
        get: () => getWarnaById(id.value),
        update: (_id, payload) => {
            // Remove read-only or extra fields
            const { 
                created_at, 
                id_warna,
                ...data 
            } = payload;
            return updateWarna(id_warna, data);
        }
    },
    id: id.value,
    immediate: true
});

const { values, isLoading, isSaving, isEditing } = form;

const allWarna = ref<WarnaResponseItem[]>([]);
const fetchAllWarna = async () => {
    try {
        const response = await getWarna({ limit: 1000, offset: 0 });
        allWarna.value = response.results;
    } catch (e) {
        console.error("Gagal fetch semua data warna:", e);
    }
}

const warningMessage = computed(() => {
    const inputName = values.value?.nama_warna?.trim().toLowerCase();
    if (!inputName) return '';

    const similar = allWarna.value.find(w => {
        if (Number(w.id_warna) === Number(id.value)) return false;
        return isSimilarName(w.nama_warna, inputName);
    });

    if (similar) {
        return `Peringatan: Warna dengan nama yang mirip sudah ada ("${similar.nama_warna}" dengan kode HEX: ${similar.kode_hex || '-'}).`;
    }
    return '';
});

onMounted(() => {
    fetchAllWarna();
});
</script>

<template>
    <div class="container mx-auto py-8 max-w-5xl">
        <div v-if="isLoading" class="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <Spinner class="size-8" />
            <p class="text-muted-foreground animate-pulse">Memuat data warna...</p>
        </div>

        <div v-else-if="values && values.id_warna">
            <!-- Header Section -->
            <div class="flex flex-col md:flex-row gap-6 items-center mb-8">
                <div class="bg-primary/10 p-4 rounded-2xl">
                    <Palette class="w-12 h-12 text-primary" />
                </div>
                
                <div class="flex-1 space-y-1 text-center md:text-left">
                    <div class="flex items-center justify-center md:justify-start gap-2">
                        <h1 class="text-3xl font-bold tracking-tight">{{ values.nama_warna }}</h1>
                        <span class="px-2 py-1 bg-muted text-muted-foreground text-xs font-mono rounded flex items-center gap-1.5">
                            <span 
                                v-if="values.kode_hex"
                                class="w-3.5 h-3.5 rounded-full border border-slate-200 shadow-xs inline-block"
                                :style="{ backgroundColor: values.kode_hex }"
                            ></span>
                            {{ values.kode_hex || '-' }}
                        </span>
                    </div>
                    <p class="text-muted-foreground">ID Warna: {{ values.id_warna }}</p>
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
                            <PencilIcon class="w-4 h-4 mr-2" /> Edit Warna
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
                                <Palette class="w-5 h-5 text-primary" />
                                Informasi Warna
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="pt-6">
                            <!-- VIEW MODE -->
                            <div v-if="!isEditing" class="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div class="space-y-1">
                                    <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nama Warna</p>
                                    <p class="text-lg font-semibold">{{ values.nama_warna }}</p>
                                </div>
                                <div class="space-y-1">
                                    <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Kode HEX</p>
                                    <div class="flex items-center gap-2">
                                        <span 
                                            v-if="values.kode_hex"
                                            class="w-4.5 h-4.5 rounded-full border border-slate-200 shadow-xs inline-block"
                                            :style="{ backgroundColor: values.kode_hex }"
                                        ></span>
                                        <p class="text-lg font-mono">{{ values.kode_hex || '-' }}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- EDIT MODE -->
                            <div v-else class="animate-in fade-in slide-in-from-top-4 duration-500">
                                <AppForm :form="form">
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <AppFormField name="nama_warna" label="Nama Warna" placeholder="Masukkan nama warna" />
                                        <AppFormField name="kode_hex" label="Kode HEX Warna" placeholder="Contoh: #FF0000 (Opsional)" />
                                    </div>
                                    
                                    <div v-if="warningMessage" class="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <Info class="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                                        <div>{{ warningMessage }}</div>
                                    </div>

                                    <div class="flex justify-end pt-4 font-sans">
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
                                Anda dapat memperbarui nama warna dan kode HEX dengan menekan tombol Edit. Pastikan kode HEX diawali dengan karakter '#' diikuti oleh 6 digit heksadesimal yang valid.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>

        <div v-else class="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
            <div class="bg-muted p-4 rounded-full">
                <Palette class="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 class="text-2xl font-bold">Data Tidak Ditemukan</h2>
            <p class="text-muted-foreground">Maaf, warna dengan ID tersebut tidak dapat ditemukan atau telah dihapus.</p>
            <Button @click="router.navigate({ to: '/warna' })">Kembali ke Daftar Warna</Button>
        </div>
    </div>
</template>
