import { createFileRoute } from '@tanstack/vue-router'
import UsersCreatePage from '@/pages/users/create/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/users/create')({
    beforeLoad: () => {
        requirePermission('USER_CREATE')()
    },
    component: UsersCreatePage,
    staticData: {
        breadcrumb: 'Tambah User'
    }
})
