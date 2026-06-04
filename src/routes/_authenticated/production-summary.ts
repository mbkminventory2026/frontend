import { createFileRoute } from '@tanstack/vue-router'
import ProductionSummaryPage from '@/pages/productionSummary/page.vue'
import { createTableParamsSchema } from '@/schemas/table-params'
import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'

export const productionColumns: [string, ...string[]] = [
  'model_name',
  'size',
  'target_qty',
  'cutting',
  'sewing',
  'qc_pass',
  'packing',
  'shipped',
  'last_updated'
]

export const productionSearchSchema = createTableParamsSchema(productionColumns)

export const Route = createFileRoute('/_authenticated/production-summary')({
  validateSearch: (search: Record<string, unknown>) => {
    const parsed = productionSearchSchema.parse(search)
    return stripTableDefaults(parsed)
  },

  beforeLoad: ({ search, location }) => {
    requirePermission('PRODUCTION_SUMMARY_READ')()
    validateTableSearchRedirect(
      '/_authenticated/production-summary',
      location.search as Record<string, any>,
      search
    )
  },
  component: ProductionSummaryPage,
  staticData: {
    breadcrumb: 'Production Summary'
  }
})
