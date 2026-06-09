import { productionStatusPlanSchema } from '@/pages/production-status-plan/schema';
import { createFileRoute } from '@tanstack/vue-router'
import ProductionStatusPlanPage from '@/pages/production-status-plan/page.vue'
import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'

export const Route = createFileRoute('/_authenticated/production-status-plan/')({
    validateSearch: (search: Record<string, unknown>) => {
        const parsed = productionStatusPlanSchema.parse(search)
        return stripTableDefaults(parsed)
    },

    beforeLoad: ({ search, location }) => {
        validateTableSearchRedirect(
            '/_authenticated/production-status-plan',
            location.search as Record<string, any>,
            search
        )
    },
    component: ProductionStatusPlanPage,
    staticData: {
        breadcrumb: 'Daftar Status Plan Produksi'
    }
})
