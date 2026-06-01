import { createFileRoute, Outlet } from '@tanstack/vue-router'

export const Route = createFileRoute('/_authenticated/po-internal')({
  component: Outlet,
})
