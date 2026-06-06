import { usersSchema } from '@/pages/users/schema';
import { createFileRoute } from '@tanstack/vue-router'
import UsersPage from '@/pages/users/users.vue'

import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'

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
