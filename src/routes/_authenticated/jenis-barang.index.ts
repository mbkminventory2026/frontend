import { jenisBarangSchema } from '@/pages/jenis-barang/schema';
import { createFileRoute } from '@tanstack/vue-router'
import JenisBarangPage from '@/pages/jenis-barang/page.vue'

import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/jenis-barang/')({
    validateSearch: (search: Record<string, unknown>) => {
        const parsed = jenisBarangSchema.parse(search)
        return stripTableDefaults(parsed)
    },

    beforeLoad: ({ search, location }) => {
        requirePermission('MASTER_JENIS_BARANG_READ')()
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
