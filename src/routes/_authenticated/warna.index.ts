import { warnaSchema } from '@/pages/warna/schema';
import { createFileRoute } from '@tanstack/vue-router'
import WarnaPage from '@/pages/warna/page.vue'

import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/warna/')({
    validateSearch: (search: Record<string, unknown>) => {
        const parsed = warnaSchema.parse(search)
        return stripTableDefaults(parsed)
    },

    beforeLoad: ({ search, location }) => {
        requirePermission('MASTER_WARNA_READ')()
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
