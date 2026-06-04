import { createFileRoute } from '@tanstack/vue-router'
import DepartemenPage from '@/pages/departemen/departemen.vue'
import { createTableParamsSchema } from '@/schemas/table-params'
import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'

export const departemenColumns: [string, ...string[]] = [
    'created_at',
    'id_departemen',
    'nama_departemen'
]

export const departemenSchema = createTableParamsSchema(departemenColumns)

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
