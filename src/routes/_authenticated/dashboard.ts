import Dashboard from '@/components/dashboard/Dashboard.vue'
import { createFileRoute } from '@tanstack/vue-router'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: Dashboard,
})


