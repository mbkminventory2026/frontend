<script setup lang="ts">
import LoginForm from '@/components/auth/LoginForm.vue';
</script>

<template>
    <div class="h-full flex-1 flex items-center justify-center">
        <div class="w-full max-w-md p-8 bg-white border rounded-lg shadow-sm">
            <div class="mb-8 text-center">
                <h1 class="text-2xl font-bold tracking-tight text-slate-900">Sign In</h1>
                <p class="text-sm text-slate-500 mt-2">Silakan masuk ke akun Anda</p>
            </div>
            <LoginForm/>
        </div>
    </div>
</template>