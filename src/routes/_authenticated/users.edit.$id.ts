import { createFileRoute } from '@tanstack/vue-router'
import UsersEditPage from '@/pages/users/edit/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/users/edit/$id')({
    beforeLoad: () => {
        requirePermission('USER_UPDATE')()
    },
    component: UsersEditPage,
    staticData: {
        breadcrumb: 'Edit User'
    }
})
