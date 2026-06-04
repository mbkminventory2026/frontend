import { createFileRoute, redirect } from '@tanstack/vue-router'
import AuthenticatedLayout from '@/layouts/Authenticated.vue'
import { decodeJwt } from '@/lib/auth'
import { canClientAccessPath, getDefaultAuthenticatedPath } from '@/lib/access'

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
    const mustChangePassword = Boolean(claims?.must_change_password)

    if (mustChangePassword && location.pathname !== '/change-password') {
      throw redirect({
        to: '/change-password',
      });
    }

    if (!canClientAccessPath(claims, location.pathname)) {
      throw redirect({
        to: getDefaultAuthenticatedPath(claims),
      });
    }
  },
  component: AuthenticatedLayout,
})


