import type { DecodedAuthClaims } from '@/lib/auth'

const ALL_ACCESS = 'ALL_ACCESS'

type RouteTarget = {
  path: string
  permission: string
}

const clientRouteTargets: RouteTarget[] = [
  { path: '/po-client', permission: 'PO_CLIENT_READ' },
  { path: '/work-order', permission: 'WO_READ' },
  { path: '/production-summary', permission: 'PRODUCTION_SUMMARY_READ' },
  { path: '/packing-list', permission: 'PACKING_LIST_READ' },
]

const internalDefaultTargets: RouteTarget[] = [
  { path: '/dashboard', permission: 'DASHBOARD_READ' },
  { path: '/users', permission: 'USER_READ' },
  { path: '/po-client', permission: 'PO_CLIENT_READ' },
  { path: '/work-order', permission: 'WO_READ' },
  { path: '/production-summary', permission: 'PRODUCTION_SUMMARY_READ' },
  { path: '/po-internal', permission: 'PO_INTERNAL_READ' },
  { path: '/report-penerimaan', permission: 'REPORT_READ' },
  { path: '/barang', permission: 'MASTER_BARANG_READ' },
]

export function hasPermissionFromClaims(claims: DecodedAuthClaims | null, permission: string): boolean {
  const permissions = claims?.permissions ?? []
  return permissions.includes(ALL_ACCESS) || permissions.includes(permission)
}

export function isClientClaims(claims: DecodedAuthClaims | null): boolean {
  return claims?.role_name === 'CLIENT' || claims?.id_mitra != null
}

export function getDefaultAuthenticatedPath(claims: DecodedAuthClaims | null): string {
  if (!claims) return '/login'
  if (claims.must_change_password) return '/change-password'

  const targets = isClientClaims(claims) ? clientRouteTargets : internalDefaultTargets
  const firstAllowed = targets.find((target) => hasPermissionFromClaims(claims, target.permission))
  return firstAllowed?.path ?? '/forbidden'
}

export function canClientAccessPath(claims: DecodedAuthClaims | null, pathname: string): boolean {
  if (!claims) return false
  if (!isClientClaims(claims)) return true

  if (pathname === '/change-password' || pathname === '/forbidden') {
    return true
  }

  return clientRouteTargets.some((target) => {
    if (!hasPermissionFromClaims(claims, target.permission)) {
      return false
    }

    return pathname === target.path || pathname.startsWith(`${target.path}/`)
  })
}
