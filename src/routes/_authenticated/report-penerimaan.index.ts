import { createFileRoute } from '@tanstack/vue-router'
import ReportPenerimaanPage from '@/pages/reportPenerimaan/page.vue'
import { createTableParamsSchema } from '@/schemas/table-params'
import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'

export const reportPenerimaanColumns: [string, ...string[]] = [
    'created_at', 'tanggal', 'id_received', 'id_material_list', 'qty', 'keterangan'
];
export const reportPenerimaanSchema = createTableParamsSchema(reportPenerimaanColumns)

export const Route = createFileRoute('/_authenticated/report-penerimaan/')({
  validateSearch: (search: Record<string, unknown>) => {
    const parsed = reportPenerimaanSchema.parse(search)
    return stripTableDefaults(parsed)
  },

  beforeLoad: ({ search, location }) => {
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
