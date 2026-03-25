import { createFileRoute } from '@tanstack/vue-router'
import LoginPage from '@/pages/login/page.vue'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})
