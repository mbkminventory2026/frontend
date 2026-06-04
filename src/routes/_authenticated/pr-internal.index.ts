import { createFileRoute } from '@tanstack/vue-router'
import PRInternalPage from '@/pages/pr-internal/pr-internal.vue'
import { createTableParamsSchema } from '@/schemas/table-params'
import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'

export const prInternalColumns: [string, ...string[]] = [
    'created_at',
    'id_pr_internal',
    'nama',
    'tanggal',
    'vendor_name',
    'departemen',
    'projek',
    'status',
]

export const prInternalSchema = createTableParamsSchema(prInternalColumns)

export const Route = createFileRoute('/_authenticated/pr-internal/')({
    validateSearch: (search: Record<string, unknown>) => {
        const parsed = prInternalSchema.parse(search)
        return stripTableDefaults(parsed)
    },

    beforeLoad: ({ search, location }) => {
        requirePermission('PO_INTERNAL_READ')()
        validateTableSearchRedirect(
            '/_authenticated/pr-internal',
            location.search as Record<string, any>,
            search
        )
    },
    component: PRInternalPage,
    staticData: {
        breadcrumb: 'PR Internal'
    }
})
