import { createFileRoute, Outlet } from '@tanstack/vue-router'

export const Route = createFileRoute('/_authenticated/report-penerimaan')({
  component: Outlet,
})
