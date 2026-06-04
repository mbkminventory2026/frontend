import { redirect } from '@tanstack/vue-router'
import { decodeJwt } from './auth'

export function requirePermission(permission: string) {
    return () => {
        const token = localStorage.getItem('accessToken')
        if (!token) return

        let hasAccess = false
        try {
            const claims = decodeJwt(token)
            const permissions: string[] = claims?.permissions || []

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
