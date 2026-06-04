import { redirect } from '@tanstack/vue-router'
import { decodeJwt } from './auth'
import { hasPermissionFromClaims } from './access'

export function requirePermission(permission: string) {
    return () => {
        const token = localStorage.getItem('accessToken')
        if (!token) return

        let hasAccess = false
        try {
            const claims = decodeJwt(token)
            hasAccess = hasPermissionFromClaims(claims, permission)
        } catch (e) {
            console.error('Failed to parse token permissions:', e)
        }

        if (!hasAccess) {
            throw redirect({ to: '/forbidden' })
        }
    }
}
