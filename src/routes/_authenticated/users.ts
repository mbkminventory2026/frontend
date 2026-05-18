import { createFileRoute, Outlet } from '@tanstack/vue-router'

export const Route = createFileRoute('/_authenticated/users')({
  component: Outlet,
})
