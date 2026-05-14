import { createFileRoute } from '@tanstack/vue-router'
import JenisBarangPage from '@/pages/jenis-barang/page.vue'
import { createTableParamsSchema } from '@/schemas/table-params'
import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'

export const jenisBarangColumns: [string, ...string[]] = [
    'created_at',
    'id_jenis_barang',
    'kode',
    'nama_jenis_barang'
]

export const jenisBarangSchema = createTableParamsSchema(jenisBarangColumns)

export const Route = createFileRoute('/_authenticated/jenis-barang')({
    validateSearch: (search: Record<string, unknown>) => {
        const parsed = jenisBarangSchema.parse(search)
        return stripTableDefaults(parsed)
    },

    beforeLoad: ({ search, location }) => {
        validateTableSearchRedirect(
            '/_authenticated/jenis-barang',
            location.search as Record<string, any>,
            search
        )
    },
    component: JenisBarangPage,
    staticData: {
        breadcrumb: 'Jenis Barang'
    }
})
