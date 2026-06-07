import { createFileRoute, redirect } from '@tanstack/vue-router'

export const Route = createFileRoute('/_authenticated/marker-plan/')({
  beforeLoad: () => {
    throw redirect({ to: '/marker-plan/create' })
  }
})
