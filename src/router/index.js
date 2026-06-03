import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AppLayout from '../components/layout/AppLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'login',
      component: () => import('../views/auth/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/cadastro',
      name: 'cadastro',
      component: () => import('../views/auth/RegisterView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/editar-aluno/:id',
      name: 'editar-aluno-publico',
      component: () => import('../views/alunos/StudentPublicEditView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/dashboard',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('../views/dashboard/DashboardView.vue')
        }
      ]
    },
    {
      path: '/alunos',
      component: AppLayout,
      meta: { requiresAuth: true, role: 'Master' },
      children: [
        {
          path: '',
          name: 'alunos',
          component: () => import('../views/alunos/StudentListView.vue')
        },
        {
          path: 'novo',
          name: 'aluno-novo',
          component: () => import('../views/alunos/StudentFormView.vue')
        },
        {
          path: ':id',
          name: 'aluno-detalhes',
          component: () => import('../views/alunos/StudentDetailView.vue')
        },
        {
          path: ':id/edit',
          name: 'aluno-editar',
          component: () => import('../views/alunos/StudentFormView.vue')
        },
        {
          path: 'pendentes',
          name: 'alunos-pendentes',
          component: () => import('../views/alunos/StudentPendingView.vue')
        }
      ]
    },
    {
      path: '/turmas',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'turmas',
          component: () => import('../views/turmas/CrewListView.vue')
        },
        {
          path: 'nova',
          name: 'turma-nova',
          component: () => import('../views/turmas/CrewFormView.vue'),
          meta: { role: 'Master' }
        },
        {
          path: ':id',
          name: 'turma-detalhes',
          component: () => import('../views/turmas/CrewDetailView.vue')
        },
        {
          path: ':id/edit',
          name: 'turma-editar',
          component: () => import('../views/turmas/CrewFormView.vue'),
          meta: { role: 'Master' }
        }
      ]
    },
    {
      path: '/professores',
      component: AppLayout,
      meta: { requiresAuth: true, role: 'Master' },
      children: [
        {
          path: '',
          name: 'professores',
          component: () => import('../views/professores/TeacherListView.vue')
        },
        {
          path: 'novo',
          name: 'professor-novo',
          component: () => import('../views/professores/TeacherFormView.vue')
        },
        {
          path: ':id/edit',
          name: 'professor-editar',
          component: () => import('../views/professores/TeacherFormView.vue')
        },
        {
          path: ':id',
          name: 'professor-detalhes',
          component: () => import('../views/professores/TeacherDetailView.vue')
        }
      ]
    },
    {
      path: '/chamadas',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'chamadas',
          component: () => import('../views/chamadas/RegisterListView.vue')
        },
        {
          path: 'nova',
          name: 'chamada-nova',
          component: () => import('../views/chamadas/RegisterFormView.vue')
        },
        {
          path: ':id/edit',
          name: 'chamada-editar',
          component: () => import('../views/chamadas/RegisterFormView.vue')
        },
        {
          path: ':id',
          name: 'chamada-detalhes',
          component: () => import('../views/chamadas/RegisterDetailView.vue')
        }
      ]
    },
    {
      path: '/financeiro',
      component: AppLayout,
      meta: { requiresAuth: true, role: 'Master' },
      children: [
        {
          path: '',
          name: 'financeiro',
          component: () => import('../views/financeiro/FinancialDashboardView.vue')
        },
        {
          path: 'lancamentos',
          name: 'financeiro-lancamentos',
          component: () => import('../views/financeiro/FinancialListView.vue')
        },
        {
          path: 'lancamentos/novo',
          name: 'financeiro-lancamento-novo',
          component: () => import('../views/financeiro/FinancialFormView.vue')
        },
        {
          path: 'lancamentos/:id/edit',
          name: 'financeiro-lancamento-editar',
          component: () => import('../views/financeiro/FinancialFormView.vue')
        },
        {
          path: 'categorias',
          name: 'financeiro-categorias',
          component: () => import('../views/financeiro/FinancialCategoryListView.vue')
        }
      ]
    },
    {
      path: '/vendas',
      component: AppLayout,
      meta: { requiresAuth: true, role: 'Master' },
      children: [
        {
          path: '',
          name: 'vendas',
          component: () => import('../views/vendas/SaleListView.vue')
        },
        {
          path: 'nova',
          name: 'venda-nova',
          component: () => import('../views/vendas/SaleFormView.vue')
        },
        {
          path: ':id',
          name: 'venda-detalhes',
          component: () => import('../views/vendas/SaleDetailView.vue')
        }
      ]
    },
    {
      path: '/produtos',
      component: AppLayout,
      meta: { requiresAuth: true, role: 'Master' },
      children: [
        {
          path: '',
          name: 'produtos',
          component: () => import('../views/produtos/ProductListView.vue')
        },
        {
          path: 'novo',
          name: 'produto-novo',
          component: () => import('../views/produtos/ProductFormView.vue')
        },
        {
          path: ':id/edit',
          name: 'produto-editar',
          component: () => import('../views/produtos/ProductFormView.vue')
        }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Restaurar sessão do Parse (cache) antes de exigir login
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    authStore.checkAuth()
  }

  // Check if route requires auth
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' })
    return
  }
  
  // Check role if specified
  if (to.meta.role && authStore.userRole !== to.meta.role) {
    next({ name: 'dashboard' })
    return
  }
  
  // Check nested route role
  if (to.matched.some(record => record.meta.role) && authStore.userRole !== to.matched.find(r => r.meta.role)?.meta.role) {
    next({ name: 'dashboard' })
    return
  }
  
  next()
})

export default router
