import { createFileRoute, redirect } from '@tanstack/vue-router'
import PermissionsEditPage from '@/pages/permissions/edit/page.vue'

export const Route = createFileRoute('/_authenticated/permissions/edit/$id')({
    beforeLoad: () => {
        throw redirect({ to: '/forbidden' })
    },
    component: PermissionsEditPage,
    staticData: {
        breadcrumb: 'Edit Permission'
    }
})
