import { createFileRoute } from '@tanstack/vue-router'
import PermissionsPage from '@/pages/permissions/permissions.vue'
import { createTableParamsSchema } from '@/schemas/table-params'
import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'

export const permissionsColumns: [string, ...string[]] = [
    'created_at',
    'id_hak_akses',
    'nama_halaman'
]

export const permissionsSchema = createTableParamsSchema(permissionsColumns)

export const Route = createFileRoute('/_authenticated/permissions/')({
    validateSearch: (search: Record<string, unknown>) => {
        const parsed = permissionsSchema.parse(search)
        return stripTableDefaults(parsed)
    },

    beforeLoad: ({ search, location }) => {
        requirePermission('PERMISSION_READ')()
        validateTableSearchRedirect(
            '/_authenticated/permissions',
            location.search as Record<string, any>,
            search
        )
    },
    component: PermissionsPage,
    staticData: {
        breadcrumb: 'Permissions'
    }
})
