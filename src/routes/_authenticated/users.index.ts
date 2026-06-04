import { createFileRoute } from '@tanstack/vue-router'
import UsersPage from '@/pages/users/users.vue'
import { createTableParamsSchema } from '@/schemas/table-params'
import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'

export const usersColumns: [string, ...string[]] = [
    'created_at',
    'id_user',
    'username',
    'status',
    'nama_role'
]

export const usersSchema = createTableParamsSchema(usersColumns)

export const Route = createFileRoute('/_authenticated/users/')({
    validateSearch: (search: Record<string, unknown>) => {
        const parsed = usersSchema.parse(search)
        return stripTableDefaults(parsed)
    },

    beforeLoad: ({ search, location }) => {
        requirePermission('USER_READ')()
        validateTableSearchRedirect(
            '/_authenticated/users',
            location.search as Record<string, any>,
            search
        )
    },
    component: UsersPage,
    staticData: {
        breadcrumb: 'Users'
    }
})
