<script setup lang="ts">
import { FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TurnstileWidget from '@/components/TurnstileWidget.vue';

import { useLoginForm } from '@/composables/auth/useLoginForm';
import { Link } from '@tanstack/vue-router';
import { EyeIcon, EyeOffIcon } from 'lucide-vue-next';
import { ref } from 'vue';

const showPassword = ref(false);

const {
    isLoading,
    turnstileToken,
    handleTurnstileSuccess,
    handleTurnstileError,
    onSubmit
} = useLoginForm()

const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

</script>

<template>
    <form @submit="onSubmit" class="space-y-6">
        <FormField v-slot="{ componentField }" name="username">
            <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                    <Input type="text" placeholder="super-admin" v-bind="componentField"/>
                </FormControl>
                <FormMessage/>
            </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="password">
            <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                    <div class="relative">
                        <Input :type="showPassword ? 'text' : 'password'" placeholder="••••••••" class="pr-10" v-bind="componentField"/>
                        <button
                            type="button"
                            @click="showPassword = !showPassword"
                            class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                            :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
                        >
                            <EyeOffIcon v-if="showPassword" class="w-4 h-4" />
                            <EyeIcon v-else class="w-4 h-4" />
                        </button>
                    </div>
                </FormControl>
                <FormMessage/>
            </FormItem>
        </FormField>

        <div class="flex justify-center my-4">
            <TurnstileWidget
            :site-key="siteKey"
            @verify="handleTurnstileSuccess"
            @error="handleTurnstileError"
            ></TurnstileWidget>
        </div>

        <Button type="submit" class="w-full" :disabled="isLoading || !turnstileToken">
            <span v-if="isLoading">Sedang memeriksa....</span>
            <span v-else>Masuk</span>
        </Button>

        <div class="text-center text-sm">
            Ingin menjadi mitra? 
            <Link to="/register-mitra" class="text-indigo-600 hover:text-indigo-700 font-semibold underline underline-offset-4">
                Daftar
            </Link>
        </div>
    </form>
</template>