import { createFileRoute } from '@tanstack/vue-router'
import AIEstimationPage from '@/pages/ai-estimation/page.vue'

export const Route = createFileRoute('/_authenticated/ai-estimation')({
  component: AIEstimationPage,
  staticData: {
    breadcrumb: 'Estimasi AI'
  }
})
