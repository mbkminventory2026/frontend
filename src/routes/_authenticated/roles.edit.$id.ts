import { createFileRoute } from '@tanstack/vue-router'
import RolesEditPage from '@/pages/roles/edit/page.vue'

export const Route = createFileRoute('/_authenticated/roles/edit/$id')({
    component: RolesEditPage,
    staticData: {
        breadcrumb: 'Edit Role'
    }
})
