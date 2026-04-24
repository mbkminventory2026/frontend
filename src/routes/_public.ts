import { createFileRoute } from '@tanstack/vue-router'
import PublicLayout from '@/layouts/Auth.vue'

export const Route = createFileRoute('/_public')({
  component: PublicLayout,
})