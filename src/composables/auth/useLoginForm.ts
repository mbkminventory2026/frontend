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

        try {
            const response = await loginApi({
                username: values.username,
                password: values.password,
                turnstile_token: turnstileToken.value
            })

            authStore.login(response.data.access_token, { username: values.username, role: 'admin' });

            const search = router.latestLocation.search as { redirect?: string };
            
            if (search.redirect) {
                window.location.href = search.redirect;
            } else {
                router.navigate({
                    to: '/dashboard' as any
                })
            }
        } catch(error: any) {
            console.error('Login gagal: ', error);
            const errorMsg = error.response?.data?.message || 'Gagal masuk';
            alert(errorMsg);
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