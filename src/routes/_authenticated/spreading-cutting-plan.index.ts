import { createFileRoute } from '@tanstack/vue-router'
import SpreadingPlanPage from '@/pages/spreading-cutting-plan/page.vue'
import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'
import { spreadingCuttingPlanSchema } from '@/pages/spreading-cutting-plan/schema'

export const Route = createFileRoute('/_authenticated/spreading-cutting-plan/')({
    validateSearch: (search: Record<string, unknown>) => {
        const parsed = spreadingCuttingPlanSchema.parse(search)
        return stripTableDefaults(parsed)
    },

    beforeLoad: ({ search, location }) => {
        requirePermission('CUTTING_PLAN_READ')()
        validateTableSearchRedirect(
            '/_authenticated/spreading-cutting-plan',
            location.search as Record<string, any>,
            search
        )
    },
    component: SpreadingPlanPage,
    staticData: {
        breadcrumb: 'Spreading Plan'
    }
})
