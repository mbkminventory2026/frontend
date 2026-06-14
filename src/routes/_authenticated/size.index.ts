import { sizeSchema } from '@/pages/size/schema';
import { createFileRoute } from '@tanstack/vue-router'
import SizePage from '@/pages/size/page.vue'

import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/size/')({
    validateSearch: (search: Record<string, unknown>) => {
        const parsed = sizeSchema.parse(search)
        return stripTableDefaults(parsed)
    },

    beforeLoad: ({ search, location }) => {
        requirePermission('MASTER_SIZE_READ')()
        validateTableSearchRedirect(
            '/_authenticated/size',
            location.search as Record<string, any>,
            search
        )
    },
    component: SizePage,
    staticData: {
        breadcrumb: 'Size'
    }
})
