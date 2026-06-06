import { reportPenerimaanSchema } from '@/pages/reportPenerimaan/schema';
import { createFileRoute } from '@tanstack/vue-router'
import ReportPenerimaanPage from '@/pages/reportPenerimaan/page.vue'

import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/report-penerimaan/')({
  validateSearch: (search: Record<string, unknown>) => {
    const parsed = reportPenerimaanSchema.parse(search)
    return stripTableDefaults(parsed)
  },

  beforeLoad: ({ search, location }) => {
    requirePermission('REPORT_READ')()
    validateTableSearchRedirect(
        '/_authenticated/report-penerimaan',
        location.search as Record<string, any>,
        search
    )
  },
  
  component: ReportPenerimaanPage,
  staticData: {
    breadcrumb: 'Laporan Penerimaan'
  }
})
