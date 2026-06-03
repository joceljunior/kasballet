import { defineStore } from 'pinia'
import { ref } from 'vue'
import { crewService } from '../services/index.js'
import { useAuthStore } from './auth.js'

export const useCrewStore = defineStore('crew', () => {
  const crews = ref([])
  const loading = ref(false)
  const error = ref(null)
  const filters = ref({})
  const studentCountMap = ref({})
  const currentPage = ref(0)
  const pageSize = ref(30)
  const totalCount = ref(0)

  async function loadCrews() {
    loading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      let results
      let count

      if (authStore.isTeacher && authStore.user?.id) {
        ;[results, count] = await Promise.all([
          crewService.getCrewsByTeacher(authStore.user.id, currentPage.value, pageSize.value, filters.value),
          crewService.countCrewsByTeacher(authStore.user.id, filters.value)
        ])
      } else {
        ;[results, count] = await Promise.all([
          crewService.getCrews(currentPage.value, pageSize.value, filters.value),
          crewService.countCrews(filters.value)
        ])
      }

      totalCount.value = count

      const maxPage = Math.max(0, Math.ceil(count / pageSize.value) - 1)
      if (currentPage.value > maxPage) {
        currentPage.value = maxPage
        if (count > 0) {
          return loadCrews()
        }
      }

      crews.value = results

      if (crews.value.length > 0) {
        const crewIds = crews.value.map((c) => c.id)
        studentCountMap.value = await crewService.countStudentsByCrews(crewIds)
      } else {
        studentCountMap.value = {}
      }
    } catch (err) {
      error.value = err.message || 'Erro ao carregar turmas'
      throw err
    } finally {
      loading.value = false
    }
  }

  function setFilters(newFilters) {
    filters.value = { ...newFilters }
    currentPage.value = 0
    return loadCrews()
  }

  async function goToPage(page) {
    const maxPage = Math.max(0, Math.ceil(totalCount.value / pageSize.value) - 1)
    if (page < 0 || page > maxPage) return
    currentPage.value = page
    await loadCrews()
  }

  async function nextPage() {
    await goToPage(currentPage.value + 1)
  }

  async function prevPage() {
    await goToPage(currentPage.value - 1)
  }

  async function getCrewById(id) {
    loading.value = true
    error.value = null

    try {
      return await crewService.getCrewById(id)
    } catch (err) {
      error.value = err.message || 'Erro ao carregar turma'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createCrew(data) {
    loading.value = true
    error.value = null

    try {
      const newCrew = await crewService.createCrew(data)
      currentPage.value = 0
      await loadCrews()
      return newCrew
    } catch (err) {
      error.value = err.message || 'Erro ao criar turma'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateCrew(id, data) {
    loading.value = true
    error.value = null

    try {
      const updated = await crewService.updateCrew(id, data)
      const index = crews.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        crews.value[index] = updated
      }
      return updated
    } catch (err) {
      error.value = err.message || 'Erro ao atualizar turma'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteCrew(id) {
    loading.value = true
    error.value = null

    try {
      await crewService.deleteCrew(id)
      if (crews.value.length === 1 && currentPage.value > 0) {
        currentPage.value -= 1
      }
      await loadCrews()
    } catch (err) {
      error.value = err.message || 'Erro ao deletar turma'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    crews,
    loading,
    error,
    filters,
    studentCountMap,
    currentPage,
    pageSize,
    totalCount,
    loadCrews,
    setFilters,
    goToPage,
    nextPage,
    prevPage,
    getCrewById,
    createCrew,
    updateCrew,
    deleteCrew
  }
})
