import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface AuthUser {
    username: string;
    role?: string;
}

function decodeJwt(token: string) {
    try {
        const base64Url = token.split('.')[1] || '';
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(localStorage.getItem('accessToken') || null);

    // Restore user from localStorage on page refresh
    const savedUser = localStorage.getItem('authUser');
    const user = ref<AuthUser | null>(savedUser ? JSON.parse(savedUser) : null);

    const isLoggedIn = computed(() => token.value !== null);

    const decodedClaims = computed(() => {
        if (!token.value) return null;
        return decodeJwt(token.value);
    });

    const isMitra = computed(() => {
        const claims = decodedClaims.value;
        return claims && claims.id_mitra != null;
    });

    const mitraId = computed<number | null>(() => {
        const claims = decodedClaims.value;
        return claims ? claims.id_mitra : null;
    });

    const permissions = computed<string[]>(() => {
        const claims = decodedClaims.value;
        return claims && claims.permissions ? claims.permissions : [];
    });

    const isManager = computed<boolean>(() => {
        const claims = decodedClaims.value;
        return claims ? !!claims.is_manager : false;
    });

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

    return { 
        token, 
        user, 
        isLoggedIn, 
        decodedClaims,
        isMitra,
        mitraId,
        permissions,
        isManager,
        login, 
        logout 
    };
})