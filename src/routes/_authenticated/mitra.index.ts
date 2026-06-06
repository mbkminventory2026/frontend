import { mitraSchema } from '@/pages/mitra/schema';
import { createFileRoute } from '@tanstack/vue-router'
import MitraPage from '@/pages/mitra/mitra.vue'

import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/mitra/')({
    validateSearch: (search: Record<string, unknown>) => {
        const parsed = mitraSchema.parse(search)
        return stripTableDefaults(parsed)
    },

    beforeLoad: ({ search, location }) => {
        requirePermission('MASTER_MITRA_READ')()
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
