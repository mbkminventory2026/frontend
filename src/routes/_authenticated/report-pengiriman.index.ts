import { createFileRoute } from '@tanstack/vue-router'
import ReportPengirimanPage from '@/pages/reportPengiriman/page.vue'
import { createTableParamsSchema } from '@/schemas/table-params'
import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'

export const reportPengirimanColumns: [string, ...string[]] = [
    'created_at', 'date', 'id_report_pengiriman', 'id_wo_shell_size', 'quantity'
];
export const reportPengirimanSchema = createTableParamsSchema(reportPengirimanColumns)

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