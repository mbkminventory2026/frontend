import { createFileRoute } from '@tanstack/vue-router'
import WorkOrderPage from '@/pages/work-order/page.vue'
import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'
import { workOrderSchema } from '@/pages/work-order/schema'

export const Route = createFileRoute('/_authenticated/work-order/')({

    validateSearch: (search: Record<string, unknown>) => {
        const parsed = workOrderSchema.parse(search)
        return stripTableDefaults(parsed)
    },

    beforeLoad: ({ search, location }) => {
        requirePermission('WO_READ')()
        validateTableSearchRedirect(
            '/_authenticated/work-order',
            location.search as Record<string, any>,
            search
        )
    },
    component: WorkOrderPage,
    staticData: {
        breadcrumb: 'Work Order'
    }
})
