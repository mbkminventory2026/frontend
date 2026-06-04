import { createFileRoute } from '@tanstack/vue-router'
import MitraCreatePage from '@/pages/mitra/create/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/mitra/create')({
    beforeLoad: () => {
        requirePermission('MASTER_MITRA_CREATE')()
    },
    component: MitraCreatePage,
    staticData: {
        breadcrumb: 'Tambah Mitra'
    }
})
