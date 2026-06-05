import { createFileRoute } from '@tanstack/vue-router'
import { z } from 'zod'
import POInternalCreatePage from '@/pages/po-internal/create/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/po-internal/create')({
    validateSearch: z.object({
        prId: z.coerce.number().optional(),
    }),
    beforeLoad: () => {
        requirePermission('PO_INTERNAL_CREATE')()
    },
    component: POInternalCreatePage,
    staticData: {
        breadcrumb: 'Tambah PO Internal'
    }
})
