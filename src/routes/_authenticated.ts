import { createFileRoute, redirect } from '@tanstack/vue-router'
import AuthenticatedLayout from '@/layouts/Authenticated.vue'
import { decodeJwt } from '@/lib/auth'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }

    const claims = decodeJwt(token)
    const isMitra = claims?.id_mitra != null
    const mustChangePassword = Boolean(claims?.must_change_password)

    if (mustChangePassword && location.pathname !== '/change-password') {
      throw redirect({
        to: '/change-password',
      });
    }

    if (isMitra) {
      // Mitra is restricted to only po-client routes
      if (!location.pathname.startsWith('/po-client') && location.pathname !== '/change-password') {
        throw redirect({
          to: '/po-client',
        });
      }
    }
  },
  component: AuthenticatedLayout,
})


