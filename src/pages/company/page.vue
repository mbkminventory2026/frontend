<script setup lang="ts">
import { 
    BuildingIcon, 
    Mail, 
    Phone, 
    MapPin, 
    Info, 
    PencilIcon, 
    SaveIcon, 
    User,
} from 'lucide-vue-next';

import { getCompany, updateCompany } from '@/api/company/company';
import { useForm } from '@/composables/form/useForm';
import { useAddressField } from '@/composables/form/useAddressField';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppForm from '@/components/form/AppForm.vue';
import AppFormField from '@/components/form/AppFormField.vue';

const form = useForm({
    api: {
        get: () => getCompany({ limit: 1, offset: 0 }),
        update: (_id, payload) => {
            // Remove read-only fields
            const { id_company, created_at, ...data } = payload;
            return updateCompany(id_company, data);
        }
    },
    id: 'id_company', // Just a placeholder to trigger update mode, logic handled in update function
    immediate: true
});

const { values, isLoading, isSaving, isEditing } = form;

// Using the modular logic for address display
const { parsedAddress } = useAddressField(() => values.value?.alamat);

</script>

<template>
    <div class="container mx-auto py-8 max-w-5xl">
        <div v-if="isLoading" class="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <Spinner class="size-8" />
            <p class="text-muted-foreground animate-pulse">Memuat profil perusahaan...</p>
        </div>

        <div v-else-if="values && values.id_company">
            <!-- VIEW MODE -->
            <div v-if="!isEditing" class="space-y-6 animate-in fade-in duration-500">
                <!-- Header Section -->
                <div class="flex flex-col md:flex-row gap-6 items-center">
                    <div class="relative">
                        <Avatar class="min-w-32 min-h-32 shadow-md">
                            <AvatarImage v-if="values.logo" :src="values.logo" alt="Logo" class="object-cover" />
                            <AvatarFallback>
                                <User class="w-1/2 h-1/2 text-primary" />
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    
                    <div class="flex-1 space-y-1 text-center md:text-left">
                        <h1 class="text-3xl font-bold tracking-tight">{{ values.nama }}</h1>
                        <div class="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                            <span class="flex items-center gap-1.5">
                                <Mail class="w-4 h-4" /> {{ values.email }}
                            </span>
                            <span class="flex items-center gap-1.5">
                                <Phone class="w-4 h-4" /> {{ values.no_telp }}
                            </span>
                        </div>
                    </div>

                    <div class="flex gap-2 w-full md:w-auto">
                        <Button @click="form.toggleEdit" variant="outline" class="flex-1 md:flex-none">
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
                                                <template v-if="parsedAddress.details">
                                                    <p class="font-medium text-foreground">{{ parsedAddress.main }}</p>
                                                    <p>{{ parsedAddress.details }}</p>
                                                </template>
                                                <p v-else>{{ parsedAddress.main }}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <Separator />

                                    <div class="flex items-start gap-3">
                                        <Mail class="w-4 h-4 mt-1 text-primary" />
                                        <div class="space-y-1">
                                            <p class="text-sm font-medium leading-none">Email</p>
                                            <p class="text-sm text-muted-foreground">
                                                {{ values.email }}
                                            </p>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div class="flex items-start gap-3">
                                        <Phone class="w-4 h-4 mt-1 text-primary" />
                                        <div class="space-y-1">
                                            <p class="text-sm font-medium leading-none">Nomor Telepon</p>
                                            <p class="text-sm text-muted-foreground">
                                                {{ values.no_telp }}
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
                                            {{ values.about || 'Belum ada informasi deskripsi perusahaan.' }}
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

                <AppForm :form="form">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 h-fit">
                        <!-- Left Column: Logo & General Info -->
                        <div class="md:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle class="text-lg">Logo Perusahaan</CardTitle>
                                    <CardDescription>Unggah logo resmi perusahaan.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <AppFormField name="logo" type="file" />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle class="text-lg">Informasi Umum</CardTitle>
                                    <CardDescription>Detail nama dan deskripsi perusahaan.</CardDescription>
                                </CardHeader>
                                <CardContent class="space-y-4">
                                    <AppFormField name="nama" label="Nama Perusahaan" placeholder="Masukkan nama resmi perusahaan" />
                                    <AppFormField 
                                        name="about" 
                                        type="textarea" 
                                        label="Tentang Perusahaan" 
                                        placeholder="Tuliskan profil singkat, visi, dan misi perusahaan..." 
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        <!-- Right Column: Contact & Address -->
                        <div class="space-y-6">
                            <Card class="h-full">
                                <CardHeader>
                                    <CardTitle class="text-lg">Kontak & Alamat</CardTitle>
                                </CardHeader>
                                <CardContent class="space-y-6">
                                    <AppFormField name="email" type="email" label="Email Perusahaan" placeholder="email@perusahaan.com" />
                                    <AppFormField name="no_telp" label="Nomor Telepon" placeholder="Contoh: 021-xxxxxxx" />
                                    <AppFormField name="alamat" type="address" label="Alamat Lengkap" />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    
                    <div class="flex justify-end gap-3 py-4">
                        <Button @click="form.toggleEdit" variant="outline" type="button" class="cursor-pointer">
                            Batal
                        </Button>
                        <Button :disabled="isSaving" type="submit" class="cursor-pointer">
                            <SaveIcon class="w-4 h-4 mr-2" /> 
                            {{ isSaving ? 'Menyimpan...' : 'Simpan Perubahan' }}
                        </Button>
                    </div>
                </AppForm>
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