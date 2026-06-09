import { createFileRoute } from '@tanstack/vue-router'

export const Route = createFileRoute('/_authenticated/production-line')({
  staticData: {
    breadcrumb: 'Line Produksi',
  },
})
