import { createFileRoute } from '@tanstack/vue-router'
import MasterPlanPage from '@/pages/master-plan/page.vue'
import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'
import { masterPlanSchema } from '@/pages/master-plan/schema'

export const Route = createFileRoute('/_authenticated/master-plan/')({
    validateSearch: (search: Record<string, unknown>) => {
        const parsed = masterPlanSchema.parse(search)
        return stripTableDefaults(parsed)
    },
    beforeLoad: ({ search, location }) => {
        requirePermission('MASTER_PLAN_READ')()
        validateTableSearchRedirect(
            '/_authenticated/master-plan',
            location.search as Record<string, any>,
            search
        )
    },
    component: MasterPlanPage,
    staticData: {
        breadcrumb: 'Master Plan'
    }
})
