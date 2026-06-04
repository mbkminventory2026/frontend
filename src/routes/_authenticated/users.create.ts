import { createFileRoute } from '@tanstack/vue-router'
import UsersCreatePage from '@/pages/users/create/page.vue'

export const Route = createFileRoute('/_authenticated/users/create')({
    component: UsersCreatePage,
    staticData: {
        breadcrumb: 'Tambah User'
    }
})
