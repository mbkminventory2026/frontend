import { computed } from "vue";
import { useRouter } from "@tanstack/vue-router";
import { useAuthStore } from "@/store/authStore";

export function useDashboard() {
    const authStore = useAuthStore();
    const router = useRouter();

    // mengambil value dari reactive variable
    const username = computed(() => authStore.user?.username ?? 'Guest');
    const role = computed(() => authStore.roleName ?? authStore.user?.role ?? 'admin')

    const handleLogout = () => {
        authStore.logout();
        router.navigate({ to: '/login' })
    };

    return { username, role, handleLogout }
}
