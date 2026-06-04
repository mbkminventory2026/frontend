import { createFileRoute } from '@tanstack/vue-router'
import PermissionsEditPage from '@/pages/permissions/edit/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/permissions/edit/$id')({
    beforeLoad: () => {
        requirePermission('PERMISSION_UPDATE')()
    },
    component: PermissionsEditPage,
    staticData: {
        breadcrumb: 'Edit Permission'
    }
})
