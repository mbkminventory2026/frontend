import { createFileRoute, redirect } from '@tanstack/vue-router'
import AuthenticatedLayout from '@/layouts/Authenticated.vue'

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

    // Decode JWT payload to see if the user is a Mitra
    const isMitra = (() => {
      try {
        const payloadPart = token.split('.')[1] || '';
        const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(atob(base64));
        return decoded && decoded.id_mitra != null;
      } catch (e) {
        return false;
      }
    })();

    if (isMitra) {
      // Mitra is restricted to only po-client routes
      if (!location.pathname.startsWith('/po-client')) {
        throw redirect({
          to: '/po-client',
        });
      }
    }
  },
  component: AuthenticatedLayout,
})


