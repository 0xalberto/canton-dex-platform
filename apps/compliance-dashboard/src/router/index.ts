import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/pages/Dashboard.vue'),
    meta: {
      title: 'Dashboard',
      requiresAuth: true
    }
  },
  {
    path: '/audit-log',
    name: 'AuditLog',
    component: () => import('@/pages/AuditLog.vue'),
    meta: {
      title: 'Audit Log',
      requiresAuth: true
    }
  },
  {
    path: '/surveillance',
    name: 'Surveillance',
    component: () => import('@/pages/Surveillance.vue'),
    meta: {
      title: 'Surveillance',
      requiresAuth: true
    }
  },
  {
    path: '/kyc',
    name: 'KYC',
    component: () => import('@/pages/KYC.vue'),
    meta: {
      title: 'KYC',
      requiresAuth: true
    }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@/pages/Reports.vue'),
    meta: {
      title: 'Reports',
      requiresAuth: true
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/NotFound.vue'),
    meta: {
      title: '404 - Page Not Found'
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation guard
router.beforeEach((to, _from, next) => {
  const title = to.meta.title as string
  if (title) {
    document.title = `${title} - CantonDEX Compliance`
  }

  // TODO: Add authentication check
  // const requiresAuth = to.meta.requiresAuth
  // if (requiresAuth && !isAuthenticated()) {
  //   next('/login')
  // }

  next()
})

export default router
