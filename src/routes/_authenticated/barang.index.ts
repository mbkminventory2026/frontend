import { barangSchema } from '@/pages/barang/schema';
import { createFileRoute } from '@tanstack/vue-router'
import BarangPage from '@/pages/barang/page.vue'

import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/barang/')({
    validateSearch: (search: Record<string, unknown>) => {
        const parsed = barangSchema.parse(search)
        return stripTableDefaults(parsed)
    },

    beforeLoad: ({ search, location }) => {
        requirePermission('MASTER_BARANG_READ')()
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

