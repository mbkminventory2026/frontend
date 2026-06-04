import { createFileRoute } from '@tanstack/vue-router'
import PermissionsEditPage from '@/pages/permissions/edit/page.vue'

export const Route = createFileRoute('/_authenticated/permissions/edit/$id')({
    component: PermissionsEditPage,
    staticData: {
        breadcrumb: 'Edit Permission'
    }
})
