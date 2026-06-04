import { createFileRoute } from '@tanstack/vue-router'
import MitraEditPage from '@/pages/mitra/edit/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/mitra/edit/$id')({
    beforeLoad: () => {
        requirePermission('MASTER_MITRA_UPDATE')()
    },
    component: MitraEditPage,
    staticData: {
        breadcrumb: 'Edit Mitra'
    }
})
