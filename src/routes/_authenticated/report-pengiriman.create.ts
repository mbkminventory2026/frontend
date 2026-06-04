import { createFileRoute } from '@tanstack/vue-router'
import ReportPengirimanCreatePage from '@/pages/reportPengiriman/create/page.vue'

export const Route = createFileRoute('/_authenticated/report-pengiriman/create')({
    component: ReportPengirimanCreatePage,
    staticData: {
        breadcrumb: 'Tambah Report Pengiriman'
    }
})
