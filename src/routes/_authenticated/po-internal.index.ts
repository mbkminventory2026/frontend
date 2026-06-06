import { poInternalSchema } from '@/pages/po-internal/schema';
import { createFileRoute } from '@tanstack/vue-router'
import POInternalPage from '@/pages/po-internal/po-internal.vue'

import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/po-internal/')({
    validateSearch: (search: Record<string, unknown>) => {
        const parsed = poInternalSchema.parse(search)
        return stripTableDefaults(parsed)
    },

    beforeLoad: ({ search, location }) => {
        requirePermission('PO_INTERNAL_READ')()
        validateTableSearchRedirect(
            '/_authenticated/po-internal',
            location.search as Record<string, any>,
            search
        )
    },
    component: POInternalPage,
    staticData: {
        breadcrumb: 'PO Internal'
    }
})
