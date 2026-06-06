import { reportPengirimanSchema } from '@/pages/reportPengiriman/schema';
import { createFileRoute } from '@tanstack/vue-router'
import ReportPengirimanPage from '@/pages/reportPengiriman/page.vue'

import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/report-pengiriman/')({
  validateSearch: (search: Record<string, unknown>) => {
    const parsed = reportPengirimanSchema.parse(search)
    return stripTableDefaults(parsed)
  },

  beforeLoad: ({ search, location }) => {
    requirePermission('REPORT_READ')()
    validateTableSearchRedirect(
        '/_authenticated/report-pengiriman',
        location.search as Record<string, any>,
        search
    )
  },
  
  component: ReportPengirimanPage,
  staticData: {
    breadcrumb: 'Report Pengiriman'
  }
})