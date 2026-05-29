<script setup lang="ts">
import { FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TurnstileWidget from '@/components/TurnstileWidget.vue';

import { useLoginForm } from '@/composables/auth/useLoginForm';
import { Link } from '@tanstack/vue-router';

const {
    isLoading,
    turnstileToken,
    handleTurnstileSuccess,
    handleTurnstileError,
    onSubmit
} = useLoginForm()

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
                <div class="flex items-center">
                    <FormLabel>Password</FormLabel>
                    <Link
                        to="/"
                        class="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                        Lupa password?
                    </Link>
                </div>
                <FormControl>
                    <Input type="password" placeholder="••••••••" v-bind="componentField"/>
                </FormControl>
                <FormMessage/>
            </FormItem>
        </FormField>

        <div class="flex justify-center my-4">
            <TurnstileWidget
            site-key="1x00000000000000000000AA"
            @verify="handleTurnstileSuccess"
            @error="handleTurnstileError"
            ></TurnstileWidget>
        </div>

        <Button type="submit" class="w-full" :disabled="isLoading || !turnstileToken">
            <span v-if="isLoading">Sedang memeriksa....</span>
            <span v-else>Masuk</span>
        </Button>
        <div class="text-center">
        Tidak punya akun?
        <Link to="/register-mitra" class="underline-offset-4 hover:underline">
            Sign up
        </Link>
        </div>
    </form>
</template>