import { createFileRoute } from '@tanstack/vue-router'
import ReportPengirimanEditPage from '@/pages/reportPengiriman/edit/page.vue'

export const Route = createFileRoute('/_authenticated/report-pengiriman/edit/$id')({
    component: ReportPengirimanEditPage,
    staticData: {
        breadcrumb: 'Edit Report Pengiriman'
    }
})
