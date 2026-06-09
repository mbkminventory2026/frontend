import { createFileRoute } from '@tanstack/vue-router'

export const Route = createFileRoute('/_authenticated/production-status-plan')({
  staticData: {
    breadcrumb: 'Status Plan Produksi',
  },
})
