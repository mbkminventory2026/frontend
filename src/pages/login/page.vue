<script setup lang="ts">
import { onMounted } from 'vue';
import LoginForm from '@/components/auth/LoginForm.vue';
import { useBrandingStore } from '@/store/brandingStore';
import loginBg from '@/assets/login.png';

const brandingStore = useBrandingStore();

onMounted(() => {
    brandingStore.fetchBranding();
});
</script>

<template>
    <div class="grid min-h-svh lg:grid-cols-2">
        <div class="flex items-center justify-center">
            <div class="w-full max-w-md p-8 bg-white border rounded-lg shadow-sm">
                <div class="mb-8 text-center flex flex-col items-center justify-center">
                    <div v-if="brandingStore.logo" class="size-16 mb-4 flex items-center justify-center rounded-lg overflow-hidden border">
                        <img :src="brandingStore.logo" alt="Logo" class="w-full h-full object-cover" />
                    </div>
                    <h1 class="text-2xl font-bold tracking-tight text-slate-900">Sign In</h1>
                    <p class="text-sm text-slate-500 mt-2">Silakan masuk ke akun Anda</p>
                </div>
                <LoginForm/>
                <div class="mt-4 text-center text-sm">
                    <a href="/forgot-password" class="text-indigo-600 hover:text-indigo-700">Lupa password?</a>
                </div>
            </div>
        </div>
        <div class="bg-muted relative hidden lg:block">
        <img
            :src="brandingStore.backgroundLogin || loginBg"
            alt="Image"
            class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        >
        </div>
    </div>
</template>
