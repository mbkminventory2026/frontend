import type { LoginResponse } from "@/api/auth/auth";
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(localStorage.getItem('accessToken') || null);
    const user = ref<LoginResponse['user'] | null>(null);

    const isLoggedIn = computed(() => token.value !== null);

    function login(newToken: string, userData: LoginResponse['user']) {
        token.value = newToken;
        user.value = userData;
        localStorage.setItem('accessToken', newToken);
    }

    function logout() {
        token.value = null;
        user.value = null;
        localStorage.removeItem('accessToken');
    }

    return { token, user, isLoggedIn, login, logout };
})