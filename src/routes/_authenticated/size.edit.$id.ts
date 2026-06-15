import { createFileRoute } from '@tanstack/vue-router'
import SizeEditPage from '@/pages/size/edit/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/size/edit/$id')({
    beforeLoad: () => {
        requirePermission('MASTER_SIZE_UPDATE')()
    },
    component: SizeEditPage,
    staticData: {
        breadcrumb: 'Edit Size'
    }
})
