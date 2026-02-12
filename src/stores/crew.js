import { defineStore } from 'pinia'
import { ref } from 'vue'
import { crewService } from '../services/index.js'
import { useAuthStore } from './auth.js'

export const useCrewStore = defineStore('crew', () => {
  const crews = ref([])
  const loading = ref(false)
  const error = ref(null)
  const filters = ref({})
  const studentCountMap = ref({}) // crewId -> number of active students

  async function loadCrews() {
    loading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      // Professora: vê apenas suas turmas (Crew.teacherId = user.id)
      if (authStore.isTeacher && authStore.user?.id) {
        crews.value = await crewService.getCrewsByTeacher(authStore.user.id, 0, 100, filters.value)
      } else {
        crews.value = await crewService.getCrews(0, 100, filters.value)
      }
      // Carregar contagem de alunos por turma
      if (crews.value.length > 0) {
        const crewIds = crews.value.map(c => c.id)
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
    loadCrews()
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
      crews.value.push(newCrew)
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
      const index = crews.value.findIndex(c => c.id === id)
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
      crews.value = crews.value.filter(c => c.id !== id)
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
    loadCrews,
    setFilters,
    getCrewById,
    createCrew,
    updateCrew,
    deleteCrew
  }
})
