import { productionLineSchema } from '@/pages/production-line/schema';
import { createFileRoute } from '@tanstack/vue-router'
import ProductionLinePage from '@/pages/production-line/page.vue'
import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'

export const Route = createFileRoute('/_authenticated/production-line/')({
    validateSearch: (search: Record<string, unknown>) => {
        const parsed = productionLineSchema.parse(search)
        return stripTableDefaults(parsed)
    },

    beforeLoad: ({ search, location }) => {
        validateTableSearchRedirect(
            '/_authenticated/production-line',
            location.search as Record<string, any>,
            search
        )
    },
    component: ProductionLinePage,
    staticData: {
        breadcrumb: 'Daftar Line Produksi'
    }
})
