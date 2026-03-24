<script setup lang="ts">
import { FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TurnstileWidget from '@/components/TurnstileWidget.vue';

import { useLoginForm } from '@/composables/auth/useLoginForm';

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
        <FormField v-slot="{ componentField }" name="email">
            <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                    <Input type="email" placeholder="admin@perusahaan.com" v-bind="componentField"/>
                </FormControl>
                <FormMessage/>
            </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="password">
            <FormItem>
                <FormLabel>Password</FormLabel>
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
    </form>
</template>