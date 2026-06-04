import { createFileRoute } from '@tanstack/vue-router'
import RolesCreatePage from '@/pages/roles/create/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/roles/create')({
    beforeLoad: () => {
        requirePermission('ROLE_CREATE')()
    },
    component: RolesCreatePage,
    staticData: {
        breadcrumb: 'Tambah Role'
    }
})
