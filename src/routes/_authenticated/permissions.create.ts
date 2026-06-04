import { createFileRoute } from '@tanstack/vue-router'
import PermissionsCreatePage from '@/pages/permissions/create/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/permissions/create')({
    beforeLoad: () => {
        requirePermission('PERMISSION_CREATE')()
    },
    component: PermissionsCreatePage,
    staticData: {
        breadcrumb: 'Tambah Permission'
    }
})
