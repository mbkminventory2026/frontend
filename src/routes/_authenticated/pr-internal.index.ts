import { prInternalSchema } from '@/pages/pr-internal/schema';
import { createFileRoute } from '@tanstack/vue-router'
import PRInternalPage from '@/pages/pr-internal/pr-internal.vue'

import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/pr-internal/')({
    validateSearch: (search: Record<string, unknown>) => {
        const parsed = prInternalSchema.parse(search)
        return stripTableDefaults(parsed)
    },

    beforeLoad: ({ search, location }) => {
        requirePermission('PR_INTERNAL_READ')()
        validateTableSearchRedirect(
            '/_authenticated/pr-internal',
            location.search as Record<string, any>,
            search
        )
    },
    component: PRInternalPage,
    staticData: {
        breadcrumb: 'PR Internal'
    }
})
