import { createFileRoute, Outlet } from '@tanstack/vue-router'

export const Route = createFileRoute('/_authenticated/reports')({
  component: Outlet,
})
