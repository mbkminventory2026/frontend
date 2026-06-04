import { createFileRoute } from '@tanstack/vue-router'
import AIEstimationPage from '@/pages/ai-estimation/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/ai-estimation')({
  beforeLoad: () => {
    requirePermission('AI_ESTIMATION_READ')()
  },
  component: AIEstimationPage,
  staticData: {
    breadcrumb: 'Estimasi AI'
  }
})
