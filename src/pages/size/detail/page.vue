<script setup lang="ts">
import { computed } from 'vue';
import { useParams, useRouter } from '@tanstack/vue-router';
import {
    Ruler,
    Hash,
    PencilIcon,
    SaveIcon,
    XIcon,
    Calendar,
    Info
} from 'lucide-vue-next';

import { getSizeById, updateSize } from '@/api/size/size';
import { useForm } from '@/composables/form/useForm';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppForm from '@/components/form/AppForm.vue';
import AppFormField from '@/components/form/AppFormField.vue';
import { formatDate } from '@/lib/formatter';

const router = useRouter();
const params = useParams({ from: '/_authenticated/size/$id' });
const id = computed(() => params.value.id);

const form = useForm({
    api: {
        get: () => getSizeById(id.value),
        update: (_id, payload) => {
            const {
                created_at,
                id_size,
                ...data
            } = payload;
            return updateSize(id_size, data);
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
            <p class="text-muted-foreground animate-pulse">Memuat data size...</p>
        </div>

        <div v-else-if="values && values.id_size">
            <div class="flex flex-col md:flex-row gap-6 items-center mb-8">
                <div class="bg-primary/10 p-4 rounded-2xl">
                    <Ruler class="w-12 h-12 text-primary" />
                </div>

                <div class="flex-1 space-y-1 text-center md:text-left">
                    <h1 class="text-3xl font-bold tracking-tight">{{ values.nama_size }}</h1>
                    <p class="text-muted-foreground">ID Size: {{ values.id_size }}</p>
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
                            <PencilIcon class="w-4 h-4 mr-2" /> Edit Size
                        </template>
                    </Button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="md:col-span-2 space-y-6">
                    <Card class="overflow-hidden border-none shadow-md">
                        <CardHeader class="bg-muted/30 pb-4">
                            <CardTitle class="text-lg flex items-center gap-2">
                                <Ruler class="w-5 h-5 text-primary" />
                                Informasi Size
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="pt-6">
                            <div v-if="!isEditing" class="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div class="space-y-1">
                                    <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nama Size</p>
                                    <p class="text-lg font-semibold">{{ values.nama_size }}</p>
                                </div>
                            </div>

                            <div v-else class="animate-in fade-in slide-in-from-top-4 duration-500">
                                <AppForm :form="form">
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <AppFormField name="nama_size" label="Nama Size" placeholder="Masukkan nama size" />
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
                                Gunakan size global yang konsisten agar work order, packing list, dan laporan produksi memakai referensi ukuran yang sama.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>

        <div v-else class="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
            <div class="bg-muted p-4 rounded-full">
                <Ruler class="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 class="text-2xl font-bold">Data Tidak Ditemukan</h2>
            <p class="text-muted-foreground">Maaf, size dengan ID tersebut tidak dapat ditemukan atau telah dihapus.</p>
            <Button @click="router.navigate({ to: '/size' })">Kembali ke Daftar Size</Button>
        </div>
    </div>
</template>
