import { createFileRoute } from '@tanstack/vue-router'
import PermissionsDetailPage from '@/pages/permissions/detail/page.vue'

export const Route = createFileRoute('/_authenticated/permissions/$id')({
    component: PermissionsDetailPage,
    staticData: {
        breadcrumb: 'Detail Permission'
    }
})
