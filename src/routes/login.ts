import { createFileRoute } from '@tanstack/vue-router'
import LoginPage from '@/pages/LoginPage.vue'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})
