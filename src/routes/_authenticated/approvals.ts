import { createFileRoute, redirect } from '@tanstack/vue-router'
import ApprovalsPage from '@/pages/approvals/page.vue'
import { decodeJwt } from '@/lib/auth'
import { hasPermissionFromClaims } from '@/lib/access'

export const Route = createFileRoute('/_authenticated/approvals')({
  beforeLoad: () => {
    const token = localStorage.getItem('accessToken')
    if (!token) throw redirect({ to: '/login' })

    const claims = decodeJwt(token)

    const approvalPermissions = [
      'PR_INTERNAL_READ',
      'PO_INTERNAL_READ',
      'WO_READ',
      'MARKER_PLAN_READ',
      'TIMELINE_READ',
      'PACKING_LIST_READ'
    ]

    const hasAccess = approvalPermissions.some(permission =>
      hasPermissionFromClaims(claims, permission)
    )

    if (!hasAccess) {
      throw redirect({ to: '/forbidden' })
    }
  },
  component: ApprovalsPage,
  staticData: {
    breadcrumb: 'Cek & Approval'
  }
})
