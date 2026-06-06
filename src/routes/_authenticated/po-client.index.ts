import { poClientSchema } from '@/pages/po-client/schema';
import { createFileRoute } from '@tanstack/vue-router'
import POClientPage from '@/pages/po-client/po-client.vue'

import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/po-client/')({
    validateSearch: (search: Record<string, unknown>) => {
        const parsed = poClientSchema.parse(search)
        return stripTableDefaults(parsed)
    },

    beforeLoad: ({ search, location }) => {
        requirePermission('PO_CLIENT_READ')()
        validateTableSearchRedirect(
            '/_authenticated/po-client',
            location.search as Record<string, any>,
            search
        )
    },
    component: POClientPage,
    staticData: {
        breadcrumb: 'PO Client'
    }
})
