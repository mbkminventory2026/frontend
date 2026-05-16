import { createFileRoute } from '@tanstack/vue-router'
import BarangPage from '@/pages/barang/page.vue'
import { createTableParamsSchema } from '@/schemas/table-params'
import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'

export const barangColumns: [string, ...string[]] = [
    'created_at',
    'id_barang',
    'kode',
    'nama_barang',
    'nama_jenis_barang',
    'nama_perusahaan'
]

export const barangSchema = createTableParamsSchema(barangColumns)

export const Route = createFileRoute('/_authenticated/barang/')({
    validateSearch: (search: Record<string, unknown>) => {
        const parsed = barangSchema.parse(search)
        return stripTableDefaults(parsed)
    },

    beforeLoad: ({ search, location }) => {
        validateTableSearchRedirect(
            '/_authenticated/barang',
            location.search as Record<string, any>,
            search
        )
    },
    component: BarangPage,
    staticData: {
        breadcrumb: 'Barang'
    }
})

