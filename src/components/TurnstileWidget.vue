<script setup lang="ts">
import { ref, watch } from 'vue';
import { useTurnstile } from '@/composables/captcha/useTurnstile';

const props = defineProps<{
    siteKey: string;
}>();

const emit = defineEmits<{
    (e: 'verify', token: string): void;
    (e: 'error'): void;
}>();

const widgetContainer = ref<HTMLElement | null>(null);  // sebagai container untuk komponen turnstile
const { token, error } = useTurnstile(widgetContainer, props.siteKey)   // memanggil handler turnstile (logic)

// watch(nilai_lama, nilai_baru)
watch(token, (newToken) => {
    if (newToken) emit('verify', newToken)
})
watch(error, (hasError) => {
    if (hasError) emit('error');
})
</script>

<template>
    <div class="turnstile-wrapper">
        <div ref="widgetContainer"></div>
        <p v-if="error" class="text-sm text-red-500 mt-1">
            Gagal memuat keamanan. Silakan muat ulang halaman.
        </p>
    </div>
</template>