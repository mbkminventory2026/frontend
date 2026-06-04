import { createFileRoute } from '@tanstack/vue-router'
import UsersEditPage from '@/pages/users/edit/page.vue'

export const Route = createFileRoute('/_authenticated/users/edit/$id')({
    component: UsersEditPage,
    staticData: {
        breadcrumb: 'Edit User'
    }
})
