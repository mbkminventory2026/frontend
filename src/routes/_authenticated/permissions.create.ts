import { createFileRoute, redirect } from '@tanstack/vue-router'
import PermissionsCreatePage from '@/pages/permissions/create/page.vue'

export const Route = createFileRoute('/_authenticated/permissions/create')({
    beforeLoad: () => {
        throw redirect({ to: '/forbidden' })
    },
    component: PermissionsCreatePage,
    staticData: {
        breadcrumb: 'Tambah Permission'
    }
})
