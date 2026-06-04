import { createFileRoute } from '@tanstack/vue-router'
import RolesPage from '@/pages/roles/roles.vue'
import { createTableParamsSchema } from '@/schemas/table-params'
import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'

export const rolesColumns: [string, ...string[]] = [
    'created_at',
    'id_role',
    'nama_role'
]

export const rolesSchema = createTableParamsSchema(rolesColumns)

export const Route = createFileRoute('/_authenticated/roles/')({
    validateSearch: (search: Record<string, unknown>) => {
        const parsed = rolesSchema.parse(search)
        return stripTableDefaults(parsed)
    },

    beforeLoad: ({ search, location }) => {
        requirePermission('ROLE_READ')()
        validateTableSearchRedirect(
            '/_authenticated/roles',
            location.search as Record<string, any>,
            search
        )
    },
    component: RolesPage,
    staticData: {
        breadcrumb: 'Roles'
    }
})
