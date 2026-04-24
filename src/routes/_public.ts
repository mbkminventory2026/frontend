import { createFileRoute } from '@tanstack/vue-router'
import PublicLayout from '@/layouts/Public.vue'

export const Route = createFileRoute('/_public')({
  component: PublicLayout,
})