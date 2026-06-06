import { departemenSchema } from '@/pages/departemen/schema';
import { createFileRoute } from '@tanstack/vue-router'
import DepartemenPage from '@/pages/departemen/departemen.vue'
import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/departemen/')({
    validateSearch: (search: Record<string, unknown>) => {
        const parsed = departemenSchema.parse(search)
        return stripTableDefaults(parsed)
    },

    beforeLoad: ({ search, location }) => {
        requirePermission('MASTER_DEPARTEMEN_READ')()
        validateTableSearchRedirect(
            '/_authenticated/departemen',
            location.search as Record<string, any>,
            search
        )
    },
    component: DepartemenPage,
    staticData: {
        breadcrumb: 'Departemen'
    }
})
