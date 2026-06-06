import { productionSearchSchema } from '@/pages/productionSummary/schema';
import { createFileRoute } from '@tanstack/vue-router'
import ProductionSummaryPage from '@/pages/productionSummary/page.vue'

import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'

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
