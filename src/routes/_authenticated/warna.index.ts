import { createFileRoute } from '@tanstack/vue-router'
import WarnaPage from '@/pages/warna/page.vue'
import { createTableParamsSchema } from '@/schemas/table-params'
import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'

export const warnaColumns: [string, ...string[]] = [
    'created_at',
    'id_warna',
    'nama_warna',
    'kode_hex'
]

export const warnaSchema = createTableParamsSchema(warnaColumns)

export const Route = createFileRoute('/_authenticated/warna/')({
    validateSearch: (search: Record<string, unknown>) => {
        const parsed = warnaSchema.parse(search)
        return stripTableDefaults(parsed)
    },

    beforeLoad: ({ search, location }) => {
        validateTableSearchRedirect(
            '/_authenticated/warna',
            location.search as Record<string, any>,
            search
        )
    },
    component: WarnaPage,
    staticData: {
        breadcrumb: 'Warna'
    }
})
