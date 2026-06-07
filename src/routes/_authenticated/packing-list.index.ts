import { packingListSchema } from '@/pages/packing-list/schema';
import { createFileRoute } from '@tanstack/vue-router'
import PackingListPage from '@/pages/packing-list/page.vue'

import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/packing-list/')({
    validateSearch: (search: Record<string, unknown>) => {
        const parsed = packingListSchema.parse(search)
        return stripTableDefaults(parsed)
    },

    beforeLoad: ({ search, location }) => {
        requirePermission('PACKING_LIST_READ')()
        validateTableSearchRedirect(
            '/_authenticated/packing-list',
            location.search as Record<string, any>,
            search
        )
    },
    component: PackingListPage,
    staticData: {
        breadcrumb: 'Packing List'
    }
})
