import { createFileRoute } from '@tanstack/vue-router'
import WarnaEditPage from '@/pages/warna/edit/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/warna/edit/$id')({
    beforeLoad: () => {
        requirePermission('MASTER_WARNA_UPDATE')()
    },
    component: WarnaEditPage,
    staticData: {
        breadcrumb: 'Edit Warna'
    }
})
