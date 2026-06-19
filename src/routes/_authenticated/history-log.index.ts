import { createFileRoute } from '@tanstack/vue-router'
import { historyLogSchema, historyLogSearchKeys, stripHistoryLogDefaults } from '@/pages/history-log/schema'
import HistoryLogPage from '@/pages/history-log/page.vue'

import { validateTableSearchRedirect } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'
import { decodeJwt } from '@/lib/auth'
import { redirect } from '@tanstack/vue-router'

export const Route = createFileRoute('/_authenticated/history-log/')({
  validateSearch: (search: Record<string, unknown>) => {
    const parsed = historyLogSchema.parse(search)
    return stripHistoryLogDefaults(parsed)
  },

  beforeLoad: ({ search, location }) => {
    requirePermission('LOG_READ')()

    const claims = decodeJwt(localStorage.getItem('accessToken'))
    if (claims?.role_name !== 'ADMIN_SISTEM') {
      throw redirect({ to: '/forbidden' })
    }

    validateTableSearchRedirect(
      '/_authenticated/history-log',
      location.search as Record<string, any>,
      search,
      historyLogSearchKeys,
    )
  },
  component: HistoryLogPage,
  staticData: {
    breadcrumb: 'History Log',
  },
})
