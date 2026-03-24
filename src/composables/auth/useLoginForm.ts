import { ref } from "vue";
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useRouter } from "@tanstack/vue-router";

import { loginSchema } from "@/schemas/auth/auth";
import { loginApi } from "@/api/auth/auth";
import { useAuthStore } from "@/store/authStore";


export function useLoginForm() {
    const router = useRouter();
    const authStore = useAuthStore();

    const form = useForm({
        validationSchema: toTypedSchema(loginSchema)
    });

    const turnstileToken = ref<string>('');
    const isLoading = ref<boolean>(false);

    // disesuaikan dengan /src/components/TurnstileWidget.vue
    const handleTurnstileSuccess = (token: string) => turnstileToken.value = token;
    const handleTurnstileError = () => turnstileToken.value = '';

    const onSubmit = form.handleSubmit(async (values) => {
        if (!turnstileToken.value) {
            alert('Captcha belum diselesaikan!');
            return;
        }

        isLoading.value = true;

        // logic
        try {
            const response = await loginApi({
                email: values.email,
                password: values.password,
                cloudflareToken: turnstileToken.value
            })

            authStore.login(response.token, response.user);

            router.navigate({
                to: '/dashboard' as any
            })
        } catch(error: any) {
            console.error('Login gagal: ', error);
            const errorMsg = error.response?.data?.mesage || 'Gagal terhubung ke server';
            alert(`Gagal masuk: ${errorMsg}`);
        } finally {
            isLoading.value = false;
        }
    })

    return {
    form,
    isLoading,
    turnstileToken,
    handleTurnstileSuccess,
    handleTurnstileError,
    onSubmit
  };
}