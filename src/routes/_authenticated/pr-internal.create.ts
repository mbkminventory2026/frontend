import { createFileRoute } from '@tanstack/vue-router'
import PRInternalCreatePage from '@/pages/pr-internal/create/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/pr-internal/create')({
    beforeLoad: () => {
        requirePermission('PO_INTERNAL_CREATE')()
    },
    component: PRInternalCreatePage,
    staticData: {
        breadcrumb: 'Tambah PR Internal'
    }
})
