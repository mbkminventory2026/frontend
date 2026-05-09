import { createFileRoute } from '@tanstack/vue-router'
import MitraPage from '@/pages/mitra/mitra.vue'
import { createTableParamsSchema } from '@/schemas/table-params'
import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'

export const mitraColumns: [string, ...string[]] = [
    'created_at',
    'id_mitra',
    'nama_perusahaan',
    'email',
    'no_telp',
    'tipe_perusahaan'
]

export const mitraSchema = createTableParamsSchema(mitraColumns)

export const Route = createFileRoute('/_authenticated/mitra')({
    validateSearch: (search: Record<string, unknown>) => {
        const parsed = mitraSchema.parse(search)
        return stripTableDefaults(parsed)
    },

    beforeLoad: ({ search, location }) => {
        validateTableSearchRedirect(
            '/_authenticated/mitra',
            location.search as Record<string, any>,
            search
        )
    },
    component: MitraPage,
    staticData: {
        breadcrumb: 'Mitra'
    }
})
