import { createFileRoute } from '@tanstack/vue-router'
import POClientPage from '@/pages/po-client/po-client.vue'
import { createTableParamsSchema } from '@/schemas/table-params'
import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'

export const poClientColumns: [string, ...string[]] = [
    'created_at',
    'id_po_client',
    'po_number',
    'tanggal',
    'season',
    'delivery',
    'mitra_name'
]

export const poClientSchema = createTableParamsSchema(poClientColumns)

export const Route = createFileRoute('/_authenticated/po-client/')({
    validateSearch: (search: Record<string, unknown>) => {
        const parsed = poClientSchema.parse(search)
        return stripTableDefaults(parsed)
    },

    beforeLoad: ({ search, location }) => {
        validateTableSearchRedirect(
            '/_authenticated/po-client',
            location.search as Record<string, any>,
            search
        )
    },
    component: POClientPage,
    staticData: {
        breadcrumb: 'PO Client'
    }
})
