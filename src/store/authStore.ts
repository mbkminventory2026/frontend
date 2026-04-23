import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface AuthUser {
    username: string;
    role?: string;
}

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(localStorage.getItem('accessToken') || null);

    // Restore user from localStorage on page refresh
    const savedUser = localStorage.getItem('authUser');
    const user = ref<AuthUser | null>(savedUser ? JSON.parse(savedUser) : null);

    const isLoggedIn = computed(() => token.value !== null);

    function login(newToken: string, userData: AuthUser) {
        token.value = newToken;
        user.value = userData;
        localStorage.setItem('accessToken', newToken);
        localStorage.setItem('authUser', JSON.stringify(userData));
    }

    function logout() {
        token.value = null;
        user.value = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('authUser');
    }

    return { token, user, isLoggedIn, login, logout };
})