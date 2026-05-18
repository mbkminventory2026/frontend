import { createFileRoute } from '@tanstack/vue-router'
import RegisterMitraPage from '@/pages/register-mitra/page.vue'

export const Route = createFileRoute('/register-mitra')({
  component: RegisterMitraPage,
  staticData: {
    breadcrumb: 'Register Mitra'
  }
})
