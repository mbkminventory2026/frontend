import { createFileRoute } from '@tanstack/vue-router'
import PermissionsCreatePage from '@/pages/permissions/create/page.vue'

export const Route = createFileRoute('/_authenticated/permissions/create')({
    component: PermissionsCreatePage,
    staticData: {
        breadcrumb: 'Tambah Permission'
    }
})
