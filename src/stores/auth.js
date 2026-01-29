import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '../services/index.js'
import { isParseInitialized } from '../services/parse.js'
import router from '../router'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => user.value !== null)
  const userRole = computed(() => user.value?.get('Role') || null)
  const isMaster = computed(() => userRole.value === 'Master')
  const isTeacher = computed(() => userRole.value === 'Professora')

  async function login(username, password) {
    loading.value = true
    error.value = null
    
    try {
      const loggedUser = await authService.login(username, password)
      user.value = loggedUser
      router.push({ name: 'dashboard' })
      return loggedUser
    } catch (err) {
      error.value = err.message || 'Erro ao fazer login'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true
    
    try {
      await authService.logout()
      user.value = null
      router.push({ name: 'login' })
    } catch (err) {
      error.value = err.message || 'Erro ao fazer logout'
      throw err
    } finally {
      loading.value = false
    }
  }

  function checkAuth() {
    if (!isParseInitialized) {
      user.value = null
      return
    }
    try {
      const currentUser = authService.getCurrentUser()
      if (currentUser) {
        user.value = currentUser
      }
    } catch (err) {
      console.warn('Auth check failed during initialization:', err)
      user.value = null
    }
  }

  function clearError() {
    error.value = null
  }

  // Initialize auth check - delay to ensure Parse is initialized
  // Use nextTick to ensure Parse SDK is fully loaded
  setTimeout(() => {
    checkAuth()
  }, 0)

  return {
    user,
    loading,
    error,
    isAuthenticated,
    userRole,
    isMaster,
    isTeacher,
    login,
    logout,
    checkAuth,
    clearError
  }
})
