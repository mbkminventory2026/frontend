<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { 
    BuildingIcon, 
    Mail, 
    Phone, 
    MapPin, 
    Info, 
    PencilIcon, 
    SaveIcon, 
    XIcon, 
    User,
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { getCompany, updateCompany } from '@/api/company/company';
import type { CompanyResponseItem } from '@/schemas/company/response';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle,
    CardFooter
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppFilePicker from '@/components/AppFilePicker.vue';
import AppAddressPicker from '@/components/AppAddressPicker.vue';

const companyData = ref<CompanyResponseItem | null>(null);
const isLoading = ref(true);
const isEditing = ref(false);
const isSaving = ref(false);

// Form state
const formValues = ref<any>({});

const fetchData = async () => {
    isLoading.value = true;
    try {
        const response = await getCompany({ limit: 1, offset: 0 });
        const data = Array.isArray(response.results) ? response.results[0] : response.results;
        
        if (data) {
            companyData.value = data;
            resetForm();
        }
    } catch (error) {
        console.error("Gagal fetch data company:", error);
        toast.error("Gagal mengambil data perusahaan");
    } finally {
        isLoading.value = false;
    }
}

const resetForm = () => {
    if (companyData.value) {
        formValues.value = { ...companyData.value };
    }
}

const toggleEdit = () => {
    if (isEditing.value) {
        resetForm();
    }
    isEditing.value = !isEditing.value;
}

const handleSave = async () => {
    if (!companyData.value?.id_company) return;
    
    isSaving.value = true;
    try {
        // Remove read-only fields
        const { id_company, created_at, ...payload } = formValues.value;
        
        await updateCompany(id_company, payload);
        
        toast.success("Data perusahaan berhasil diperbarui");
        isEditing.value = false;
        await fetchData();
    } catch (error: any) {
        console.error("Gagal update company:", error);
        toast.error(error.response?.data?.message || "Gagal memperbarui data");
    } finally {
        isSaving.value = false;
    }
}

onMounted(() => {
    fetchData();
});
</script>

<template>
    <div class="container mx-auto py-8 max-w-5xl">
        <div v-if="isLoading" class="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <Spinner class="size-8" />
            <p class="text-muted-foreground animate-pulse">Memuat profil perusahaan...</p>
        </div>

        <div v-else-if="companyData">
            <!-- VIEW MODE -->
            <div v-if="!isEditing" class="space-y-6 animate-in fade-in duration-500">
                <!-- Header Section -->
                <div class="flex flex-col md:flex-row gap-6 items-center">
                    <div class="relative">
                        <Avatar class="min-w-32 min-h-32 shadow-md">
                            <AvatarImage v-if="companyData.logo" :src="companyData.logo" alt="Logo" class="object-cover" />
                            <AvatarFallback>
                                <User class="w-1/2 h-1/2 text-primary" />
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    
                    <div class="flex-1 space-y-1 text-center md:text-left">
                        <h1 class="text-3xl font-bold tracking-tight">{{ companyData.nama }}</h1>
                        <div class="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                            <span class="flex items-center gap-1.5">
                                <Mail class="w-4 h-4" /> {{ companyData.email }}
                            </span>
                            <span class="flex items-center gap-1.5">
                                <Phone class="w-4 h-4" /> {{ companyData.no_telp }}
                            </span>
                        </div>
                    </div>

                    <div class="flex gap-2 w-full md:w-auto">
                        <Button @click="toggleEdit" variant="outline" class="flex-1 md:flex-none">
                            <PencilIcon class="w-4 h-4 mr-2" /> Edit Profil
                        </Button>
                    </div>
                </div>

                <!-- Content Grid -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Sidebar / Left Info -->
                    <div class="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle class="text-lg">Informasi Kontak</CardTitle>
                                <CardDescription>Detail cara menghubungi perusahaan.</CardDescription>
                            </CardHeader>
                            <CardContent class="space-y-4">
                                <div class="space-y-3">
                                    <div class="flex items-start gap-3">
                                        <MapPin class="w-4 h-4 mt-1 text-primary" />
                                        <div class="space-y-1">
                                            <p class="text-sm font-medium leading-none">Alamat</p>
                                            <div class="text-sm text-muted-foreground leading-relaxed">
                                                <template v-if="companyData.alamat.includes(' | ')">
                                                    <p class="font-medium text-foreground">{{ companyData.alamat.split(' | ')[0] }}</p>
                                                    <p>{{ companyData.alamat.split(' | ').slice(1).join(', ') }}</p>
                                                </template>
                                                <p v-else>{{ companyData.alamat }}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <Separator />

                                    <div class="flex items-start gap-3">
                                        <Mail class="w-4 h-4 mt-1 text-primary" />
                                        <div class="space-y-1">
                                            <p class="text-sm font-medium leading-none">Email</p>
                                            <p class="text-sm text-muted-foreground">
                                                {{ companyData.email }}
                                            </p>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div class="flex items-start gap-3">
                                        <Phone class="w-4 h-4 mt-1 text-primary" />
                                        <div class="space-y-1">
                                            <p class="text-sm font-medium leading-none">Nomor Telepon</p>
                                            <p class="text-sm text-muted-foreground">
                                                {{ companyData.no_telp }}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <!-- Main Content / Right Info -->
                    <div class="md:col-span-2 space-y-6">
                        <Card class="h-full">
                            <CardHeader>
                                <div class="flex items-center justify-between">
                                    <div class="space-y-1">
                                        <CardTitle class="text-xl">Tentang Perusahaan</CardTitle>
                                        <CardDescription>Visi, misi, dan informasi profil perusahaan.</CardDescription>
                                    </div>
                                    <Info class="w-5 h-5 text-muted-foreground/50" />
                                </div>
                            </CardHeader>
                            <CardContent class="space-y-6">
                                <div class="space-y-4">
                                    <div class="space-y-2">
                                        <div class="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                            {{ companyData.about || 'Belum ada informasi deskripsi perusahaan.' }}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <!-- EDIT MODE -->
            <div v-else class="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div class="flex flex-col md:flex-row gap-6 items-center justify-between border-b pb-6">
                    <div class="space-y-1 text-center md:text-left">
                        <h1 class="text-3xl font-bold tracking-tight">Edit Profil Perusahaan</h1>
                        <p class="text-muted-foreground">Perbarui informasi publik perusahaan Anda.</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 h-fit">
                    <!-- Left Column: Logo & Contact -->
                    <!-- Right Column: Main Info -->
                    <div class="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle class="text-lg">Logo Perusahaan</CardTitle>
                                <CardDescription>Unggah logo resmi perusahaan.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AppFilePicker 
                                    v-model="formValues.logo"
                                    accept="image/*"
                                    :preview="true"
                                />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle class="text-lg">Informasi Umum</CardTitle>
                                <CardDescription>Detail nama dan deskripsi perusahaan.</CardDescription>
                            </CardHeader>
                            <CardContent class="space-y-4">
                                <div class="space-y-2">
                                    <Label>Nama Perusahaan</Label>
                                    <Input v-model="formValues.nama" placeholder="Masukkan nama resmi perusahaan" />
                                </div>
                                <div class="space-y-2">
                                    <Label>Tentang Perusahaan</Label>
                                    <Textarea 
                                        v-model="formValues.about" 
                                        placeholder="Tuliskan profil singkat, visi, dan misi perusahaan..." 
                                        class="min-h-[350px] leading-relaxed" 
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div class="space-y-6">
                        <Card class="h-full">
                            <CardHeader>
                                <CardTitle class="text-lg">Kontak & Alamat</CardTitle>
                            </CardHeader>
                            <CardContent class="space-y-6">
                                <div class="space-y-2">
                                    <Label>Email Perusahaan</Label>
                                    <Input v-model="formValues.email" type="email" placeholder="email@perusahaan.com" />
                                </div>
                                <div class="space-y-2">
                                    <Label>Nomor Telepon</Label>
                                    <Input v-model="formValues.no_telp" placeholder="Contoh: 021-xxxxxxx" />
                                </div>
                                <div class="space-y-1 w-full">
                                    <p class="text-sm font-medium leading-none mb-2">Alamat Lengkap</p>
                                    <AppAddressPicker v-model="formValues.alamat" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                <div class="flex justify-end gap-3 py-4">
                    <Button @click="toggleEdit" variant="outline" class="cursor-pointer">
                        Batal
                    </Button>
                    <Button @click="handleSave" :disabled="isSaving" class="cursor-pointer">
                        <SaveIcon class="w-4 h-4 mr-2" /> 
                        {{ isSaving ? 'Menyimpan...' : 'Simpan Perubahan' }}
                    </Button>
                </div>
            </div>
        </div>

        <Card v-else class="flex flex-col items-center justify-center min-h-[400px] p-12 text-center">
            <div class="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <BuildingIcon class="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 class="text-xl font-semibold mb-2">Belum Ada Data Perusahaan</h2>
            <p class="text-muted-foreground max-w-sm mb-6">
                Data profil perusahaan belum ditemukan di sistem. Silakan hubungi administrator.
            </p>
        </Card>

    </div>
</template>

<style scoped>
.prose {
    line-height: 1.7;
}
</style>