import { redirect } from '@tanstack/vue-router'

export function requirePermission(permission: string) {
    return () => {
        const token = localStorage.getItem('accessToken')
        if (!token) return

        let hasAccess = false
        try {
            const base64Url = token.split('.')[1] || ''
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            }).join(''))
            const claims = JSON.parse(jsonPayload)
            const permissions: string[] = claims.permissions || []

            if (permissions.includes('ALL_ACCESS') || permissions.includes(permission)) {
                hasAccess = true
            }
        } catch (e) {
            console.error('Failed to parse token permissions:', e)
        }

        if (!hasAccess) {
            throw redirect({ to: '/forbidden' })
        }
    }
}
