import { defineStore } from 'pinia'
import { ref } from 'vue'
import { studentService } from '../services/index.js'

export const useStudentStore = defineStore('student', () => {
  const students = ref([])
  const studentCrewsMap = ref({}) // studentId -> Crew[]
  const loading = ref(false)
  const error = ref(null)
  const hasMore = ref(true)
  const currentPage = ref(0)
  const pageSize = ref(30)
  const filters = ref({})
  const searchQuery = ref('')

  async function loadStudents(reset = false) {
    if (reset) {
      students.value = []
      studentCrewsMap.value = {}
      currentPage.value = 0
      hasMore.value = true
    }

    if (!hasMore.value || loading.value) return

    loading.value = true
    error.value = null

    try {
      const page = reset ? 0 : currentPage.value
      
      // Se o filtro é de pendentes, usar método específico
      let results
      if (filters.value.pending) {
        results = await studentService.getPendingStudents(page, pageSize.value)
      } else {
        results = await studentService.getStudents(page, pageSize.value, filters.value)
      }
      
      if (reset) {
        students.value = results
      } else {
        students.value.push(...results)
      }

      const crewsMap = await studentService.getCrewsForStudents(results)
      studentCrewsMap.value = reset ? crewsMap : { ...studentCrewsMap.value, ...crewsMap }

      hasMore.value = results.length === pageSize.value
      currentPage.value = page + 1
    } catch (err) {
      error.value = err.message || 'Erro ao carregar alunos'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function loadMore() {
    await loadStudents(false)
  }

  async function search(query) {
    searchQuery.value = query
    if (query) {
      loading.value = true
      error.value = null
      try {
        // Passar filtros para a busca
        const results = await studentService.searchStudents(query, 0, pageSize.value, filters.value)
        students.value = results
        studentCrewsMap.value = await studentService.getCrewsForStudents(results)
        hasMore.value = false
        currentPage.value = 0
      } catch (err) {
        error.value = err.message || 'Erro ao buscar alunos'
        throw err
      } finally {
        loading.value = false
      }
    } else {
      await loadStudents(true)
    }
  }

  async function loadPendingStudents() {
    loading.value = true
    error.value = null

    try {
      const results = await studentService.getPendingStudents(0, 100)
      students.value = results
      studentCrewsMap.value = await studentService.getCrewsForStudents(results)
    } catch (err) {
      error.value = err.message || 'Erro ao carregar alunos pendentes'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function approveStudent(id) {
    loading.value = true
    error.value = null

    try {
      await studentService.approveStudent(id)
      const index = students.value.findIndex(s => s.id === id)
      if (index !== -1) {
        students.value[index].set('active', true)
      }
    } catch (err) {
      error.value = err.message || 'Erro ao aprovar aluno'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createStudent(data, isPublicRegistration = false) {
    loading.value = true
    error.value = null

    try {
      const newStudent = await studentService.createStudent(data, isPublicRegistration)
      students.value.unshift(newStudent)
      return newStudent
    } catch (err) {
      error.value = err.message || 'Erro ao criar aluno'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateStudent(id, data) {
    loading.value = true
    error.value = null

    try {
      const updated = await studentService.updateStudent(id, data)
      const index = students.value.findIndex(s => s.id === id)
      if (index !== -1) {
        students.value[index] = updated
      }
      return updated
    } catch (err) {
      error.value = err.message || 'Erro ao atualizar aluno'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteStudent(id) {
    loading.value = true
    error.value = null

    try {
      await studentService.deleteStudent(id)
      students.value = students.value.filter(s => s.id !== id)
    } catch (err) {
      error.value = err.message || 'Erro ao deletar aluno'
      throw err
    } finally {
      loading.value = false
    }
  }

  function setFilters(newFilters) {
    filters.value = { ...newFilters }
    // Se há busca ativa, refazer a busca com os novos filtros
    if (searchQuery.value) {
      search(searchQuery.value)
    } else {
      loadStudents(true)
    }
  }

  function reset() {
    students.value = []
    studentCrewsMap.value = {}
    loading.value = false
    error.value = null
    hasMore.value = true
    currentPage.value = 0
    filters.value = {}
    searchQuery.value = ''
  }

  return {
    students,
    studentCrewsMap,
    loading,
    error,
    hasMore,
    currentPage,
    pageSize,
    filters,
    searchQuery,
    loadStudents,
    loadMore,
    search,
    loadPendingStudents,
    approveStudent,
    createStudent,
    updateStudent,
    deleteStudent,
    setFilters,
    reset
  }
})
