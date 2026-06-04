<script setup lang="ts">
import { ref } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { Link } from '@tanstack/vue-router';
import { CheckCircle2Icon, ArrowLeftIcon, Building2Icon } from 'lucide-vue-next';

import { registerMitraApi } from '@/api/auth/auth';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TurnstileWidget from '@/components/TurnstileWidget.vue';

const isSuccess = ref(false);
const isLoading = ref(false);
const turnstileToken = ref('');
const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

const registerSchema = z.object({
  nama_perusahaan: z.string().min(1, 'Nama perusahaan wajib diisi'),
  tipe_perusahaan: z.enum(['Client', 'Supplier'], {
    errorMap: () => ({ message: 'Pilih tipe perusahaan yang valid' })
  }),
  email: z.string().email('Format email tidak valid').or(z.string().length(0)).optional(),
  no_telp: z.string().min(5, 'Nomor telepon minimal 5 digit').optional(),
  alamat: z.string().min(5, 'Alamat lengkap wajib diisi').optional(),
  kota: z.string().min(2, 'Kota wajib diisi').optional(),
  kode_pos: z.string().min(3, 'Kode pos minimal 3 digit').optional(),
});

const form = useForm({
  validationSchema: toTypedSchema(registerSchema),
  initialValues: {
    tipe_perusahaan: 'Client' as any,
    nama_perusahaan: '',
    email: '',
    no_telp: '',
    alamat: '',
    kota: '',
    kode_pos: '',
  }
});

const handleTurnstileSuccess = (token: string) => turnstileToken.value = token;
const handleTurnstileError = () => turnstileToken.value = '';

const onSubmit = form.handleSubmit(async (values) => {
  if (!turnstileToken.value) {
    alert('Selesaikan captcha terlebih dahulu');
    return;
  }
  
  isLoading.value = true;
  try {
    await registerMitraApi({
      nama_perusahaan: values.nama_perusahaan,
      tipe_perusahaan: values.tipe_perusahaan,
      email: values.email || undefined,
      no_telp: values.no_telp || undefined,
      alamat: values.alamat || undefined,
      kota: values.kota || undefined,
      kode_pos: values.kode_pos || undefined,
      turnstile_token: turnstileToken.value
    });
    isSuccess.value = true;
  } catch (error: any) {
    console.error('Registrasi gagal:', error);
    const errorMsg = error.response?.data?.message || 'Gagal melakukan registrasi';
    alert(errorMsg);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4 lg:p-8">
    <div class="w-full max-w-4xl bg-white border rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
      
      <!-- Sukses Screen -->
      <div v-if="isSuccess" class="p-8 lg:p-12 text-center flex flex-col items-center justify-center min-h-[500px]">
        <div class="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <CheckCircle2Icon class="w-12 h-12 text-green-500" />
        </div>
        <h2 class="text-3xl font-bold text-slate-900 tracking-tight">Registrasi Berhasil!</h2>
        <p class="text-slate-500 max-w-md mx-auto mt-4 leading-relaxed">
          Pendaftaran kemitraan perusahaan Anda telah diajukan ke sistem dan saat ini sedang menunggu proses verifikasi dari Operator. Jika disetujui, akun login Anda akan dibuatkan oleh pihak operator.
        </p>
        <div class="mt-8 flex gap-4 justify-center">
          <Link to="/login">
            <Button variant="default" size="lg" class="px-6">
              Kembali ke Login
            </Button>
          </Link>
        </div>
      </div>

      <!-- Form Registrasi -->
      <div v-else class="grid lg:grid-cols-12">
        <!-- Banner Samping -->
        <div class="lg:col-span-4 bg-slate-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 opacity-90 z-0"></div>
          
          <div class="relative z-10">
            <Link to="/login" class="inline-flex items-center text-xs text-slate-400 hover:text-white transition-colors">
              <ArrowLeftIcon class="w-4 h-4 mr-1" />
              Kembali ke Login
            </Link>
            <div class="mt-12">
              <h2 class="text-2xl font-bold tracking-tight">Portal Kemitraan</h2>
              <p class="text-slate-400 text-sm mt-2 leading-relaxed">
                Bergabunglah bersama kami untuk memantau status pesanan, pengiriman produk, dan transaksi secara real-time.
              </p>
            </div>
          </div>
          
          <div class="relative z-10 mt-12 text-xs text-slate-500">
            &copy; 2026 PT Permata Textile. All rights reserved.
          </div>
        </div>

        <!-- Bagian Input Form -->
        <div class="lg:col-span-8 p-8 lg:p-10">
          <div class="mb-8">
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Daftar Kemitraan</h1>
            <p class="text-slate-500 text-sm mt-1">Lengkapi informasi profil perusahaan Anda untuk mengajukan kemitraan.</p>
          </div>

          <form @submit="onSubmit" class="space-y-6">
            <!-- Grid 2 Kolom untuk Profil Perusahaan -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b">
                <Building2Icon class="w-5 h-5 text-slate-500" />
                <h3 class="font-semibold text-slate-800 text-sm">Informasi Perusahaan</h3>
              </div>

              <div class="grid md:grid-cols-2 gap-4">
                <FormField v-slot="{ componentField }" name="nama_perusahaan">
                  <FormItem>
                    <FormLabel>Nama Perusahaan</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="PT. Abadi Jaya" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" name="tipe_perusahaan">
                  <FormItem>
                    <FormLabel>Tipe Mitra</FormLabel>
                    <FormControl>
                      <select 
                        v-bind="componentField"
                        class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="Client">Client / Buyer (Pihak Luar)</option>
                        <option value="Supplier">Supplier Bahan Baku</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>

              <div class="grid md:grid-cols-2 gap-4">
                <FormField v-slot="{ componentField }" name="email">
                  <FormItem>
                    <FormLabel>Email Perusahaan</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="info@perusahaan.com" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" name="no_telp">
                  <FormItem>
                    <FormLabel>No. Telepon</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="021-xxxxxxxx" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>

              <div class="grid md:grid-cols-3 gap-4">
                <div class="md:col-span-2">
                  <FormField v-slot="{ componentField }" name="alamat">
                    <FormItem>
                      <FormLabel>Alamat Lengkap</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Jalan Raya No. 123" v-bind="componentField" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </div>
                
                <FormField v-slot="{ componentField }" name="kota">
                  <FormItem>
                    <FormLabel>Kota</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="Bandung" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>

              <FormField v-slot="{ componentField }" name="kode_pos">
                <FormItem class="w-1/3">
                  <FormLabel>Kode Pos</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="40xxx" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>

            <!-- CaptchaWidget -->
            <div class="flex justify-center py-2">
              <TurnstileWidget
                :site-key="siteKey"
                @verify="handleTurnstileSuccess"
                @error="handleTurnstileError"
              />
            </div>

            <!-- Submit Button -->
            <div class="pt-4 flex gap-4">
              <Button type="submit" class="w-full" size="lg" :disabled="isLoading || !turnstileToken">
                <span v-if="isLoading">Sedang memproses pendaftaran...</span>
                <span v-else>Kirim Pendaftaran</span>
              </Button>
            </div>
          </form>
        </div>
      </div>

    </div>
  </div>
</template>
