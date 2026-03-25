import { computed } from "vue";
import { useNavigate } from "@tanstack/vue-router";
import { useAuthStore } from "@/store/authStore";

export function useDashboard() {
    const authStore = useAuthStore();
    const navigate = useNavigate();

    // mengambil value dari reactive variable
    const username = computed(() => authStore.user?.name);
    const role = computed(() => authStore.user?.role)

    const handleLogout = () => {
        authStore.logout();
        navigate({ to: '/login' })
    };

    return { username, role, handleLogout }
}