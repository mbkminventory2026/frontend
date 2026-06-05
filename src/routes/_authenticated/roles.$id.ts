import { createFileRoute } from '@tanstack/vue-router'
import RoleDetailPage from '@/pages/roles/detail/page.vue'

export const Route = createFileRoute('/_authenticated/roles/$id')({
    component: RoleDetailPage,
    staticData: {
        breadcrumb: 'Detail Role'
    }
})
