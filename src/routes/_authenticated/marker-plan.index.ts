import { createFileRoute } from '@tanstack/vue-router'
import MarkerPlanPage from '@/pages/marker-plan/page.vue'
import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'
import { markerPlanSchema } from '@/pages/marker-plan/schema'

export const Route = createFileRoute('/_authenticated/marker-plan/')({

    validateSearch: (search: Record<string, unknown>) => {
        const parsed = markerPlanSchema.parse(search)
        return stripTableDefaults(parsed)
    },

    beforeLoad: ({ search, location }) => {
        requirePermission('MARKER_PLAN_READ')()
        validateTableSearchRedirect(
            '/_authenticated/marker-plan',
            location.search as Record<string, any>,
            search
        )
    },
    component: MarkerPlanPage,
    staticData: {
        breadcrumb: 'Marker Plan'
    }
})
