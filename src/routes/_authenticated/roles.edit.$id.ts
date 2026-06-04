import { createFileRoute } from '@tanstack/vue-router'
import RolesEditPage from '@/pages/roles/edit/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/roles/edit/$id')({
    beforeLoad: () => {
        requirePermission('ROLE_UPDATE')()
    },
    component: RolesEditPage,
    staticData: {
        breadcrumb: 'Edit Role'
    }
})
