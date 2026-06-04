import { useAuthStore } from '@/store/authStore'

export function usePermission() {
    const authStore = useAuthStore()

    const hasPermission = (permission: string): boolean => {
        if (!authStore.isLoggedIn) return false
        if (authStore.permissions.includes('ALL_ACCESS')) return true
        return authStore.permissions.includes(permission)
    }

    const hasAnyPermission = (permissions: string[]): boolean => {
        return permissions.some(p => hasPermission(p))
    }

    return { hasPermission, hasAnyPermission }
}
