<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Mobile Header -->
    <header class="bg-green-600 text-white shadow-md md:hidden">
      <div class="flex items-center justify-between p-4">
        <button @click="toggleMobileMenu" class="p-2">
          <Bars3Icon class="w-6 h-6" />
        </button>
        <h1 class="text-xl font-bold">Kas Ballet</h1>
        <button @click="toggleUserMenu" class="p-2">
          <UserCircleIcon class="w-6 h-6" />
        </button>
      </div>
    </header>

    <!-- Desktop Sidebar -->
    <aside class="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:bg-gray-800">
      <div class="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div class="flex items-center flex-shrink-0 px-4 mb-8">
          <h1 class="text-2xl font-bold text-white">Kas Ballet</h1>
        </div>
        <nav class="mt-5 flex-1 px-2 space-y-1">
          <router-link
            v-for="item in navigation"
            :key="item.name"
            :to="item.to"
            class="text-gray-300 hover:bg-gray-700 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md"
            :class="{ 'bg-gray-900 text-white': isNavActive(item) }"
          >
            <component :is="item.icon" class="mr-3 h-5 w-5" />
            {{ item.label }}
          </router-link>
        </nav>
      </div>
      <div class="flex-shrink-0 flex border-t border-gray-700 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <UserCircleIcon class="h-10 w-10 text-gray-400" />
          </div>
          <div class="ml-3 flex-1">
            <p class="text-sm font-medium text-white">{{ authStore.user?.get('username') }}</p>
            <p class="text-xs font-medium text-gray-400">{{ authStore.userRole }}</p>
          </div>
          <button @click="handleLogout" class="ml-2 p-2 text-gray-400 hover:text-white">
            <ArrowRightOnRectangleIcon class="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Mobile Menu Overlay -->
    <div
      v-if="mobileMenuOpen"
      class="fixed inset-0 z-40 md:hidden"
      @click="mobileMenuOpen = false"
    >
      <div class="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
      <div class="fixed inset-y-0 left-0 flex flex-col w-5/6 max-w-sm bg-gray-800">
        <div class="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 class="text-lg font-semibold text-white">Menu</h2>
          <button @click="mobileMenuOpen = false" class="text-gray-400 hover:text-white">
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>
        <nav class="flex-1 px-2 py-4 space-y-1">
          <router-link
            v-for="item in navigation"
            :key="item.name"
            :to="item.to"
            @click="mobileMenuOpen = false"
            class="text-gray-300 hover:bg-gray-700 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md"
            :class="{ 'bg-gray-900 text-white': isNavActive(item) }"
          >
            <component :is="item.icon" class="mr-3 h-5 w-5" />
            {{ item.label }}
          </router-link>
        </nav>
        <div class="border-t border-gray-700 p-4">
          <div class="flex items-center mb-4">
            <UserCircleIcon class="h-10 w-10 text-gray-400" />
            <div class="ml-3">
              <p class="text-sm font-medium text-white">{{ authStore.user?.get('username') }}</p>
              <p class="text-xs font-medium text-gray-400">{{ authStore.userRole }}</p>
            </div>
          </div>
          <button
            @click="handleLogout"
            class="w-full flex items-center px-2 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md"
          >
            <ArrowRightOnRectangleIcon class="mr-3 h-5 w-5" />
            Sair
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="md:pl-64">
      <main class="py-6">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <router-view v-slot="{ Component }">
            <keep-alive include="StudentListView">
              <component :is="Component" />
            </keep-alive>
          </router-view>
        </div>
      </main>

      <!-- Bottom Navigation (Mobile) -->
      <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
        <div class="flex justify-around">
          <router-link
            v-for="item in mobileNavigation"
            :key="item.name"
            :to="item.to"
            class="flex flex-col items-center py-2 px-4 text-xs"
            :class="isNavActive(item) ? 'text-green-600' : 'text-gray-500'"
          >
            <component :is="item.icon" class="h-6 w-6 mb-1" />
            <span>{{ item.label }}</span>
          </router-link>
        </div>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useRouter, useRoute } from 'vue-router'
import {
  HomeIcon,
  UserGroupIcon,
  AcademicCapIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  CubeIcon,
  TagIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const mobileMenuOpen = ref(false)
const userMenuOpen = ref(false)

const navPrefixes = {
  dashboard: '/dashboard',
  alunos: '/alunos',
  turmas: '/turmas',
  professores: '/professores',
  chamadas: '/chamadas',
  vendas: '/vendas',
  produtos: '/produtos',
  categorias: '/categorias',
  financeiro: '/financeiro'
}

function isNavActive(item) {
  if (route.name === item.name) return true
  const prefix = navPrefixes[item.name]
  return prefix ? route.path.startsWith(prefix) : false
}

const navigation = computed(() => {
  const baseNav = [
    { name: 'dashboard', to: '/dashboard', label: 'Dashboard', icon: HomeIcon }
  ]

  if (authStore.isMaster) {
    return [
      ...baseNav,
      { name: 'alunos', to: '/alunos', label: 'Alunos', icon: UserGroupIcon },
      { name: 'turmas', to: '/turmas', label: 'Turmas', icon: AcademicCapIcon },
      { name: 'professores', to: '/professores', label: 'Professoras', icon: UserIcon },
      { name: 'chamadas', to: '/chamadas', label: 'Chamadas', icon: ClipboardDocumentListIcon },
      { name: 'produtos', to: '/produtos', label: 'Produtos', icon: CubeIcon },
      { name: 'categorias', to: '/categorias', label: 'Categorias', icon: TagIcon },
      { name: 'vendas', to: '/vendas', label: 'Vendas', icon: ShoppingCartIcon },
      { name: 'financeiro', to: '/financeiro', label: 'Financeiro', icon: CurrencyDollarIcon }
    ]
  } else {
    return [
      ...baseNav,
      { name: 'turmas', to: '/turmas', label: 'Minhas Turmas', icon: AcademicCapIcon },
      { name: 'chamadas', to: '/chamadas', label: 'Chamadas', icon: ClipboardDocumentListIcon }
    ]
  }
})

const mobileNavigation = computed(() => {
  return navigation.value.slice(0, 5) // Mostrar apenas os 5 primeiros no mobile
})

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
}

async function handleLogout() {
  await authStore.logout()
  router.push('/')
}
</script>
