import { defineStore } from 'pinia'
import { ref } from 'vue'
import { studentService } from '../services/index.js'

export const useStudentStore = defineStore('student', () => {
  const students = ref([])
  const studentCrewsMap = ref({}) // studentId -> Crew[]
  const loading = ref(false)
  const error = ref(null)
  const currentPage = ref(0)
  const pageSize = ref(30)
  const totalCount = ref(0)
  const filters = ref({})
  const searchQuery = ref('')

  async function loadStudents() {
    loading.value = true
    error.value = null

    try {
      let results
      let count

      if (searchQuery.value.trim()) {
        const query = searchQuery.value.trim()
        ;[results, count] = await Promise.all([
          studentService.searchStudents(query, currentPage.value, pageSize.value, filters.value),
          studentService.countSearchStudents(query, filters.value)
        ])
      } else if (filters.value.pending) {
        ;[results, count] = await Promise.all([
          studentService.getPendingStudents(currentPage.value, pageSize.value),
          studentService.countPendingStudents()
        ])
      } else {
        ;[results, count] = await Promise.all([
          studentService.getStudents(currentPage.value, pageSize.value, filters.value),
          studentService.countStudents(filters.value)
        ])
      }

      totalCount.value = count

      const maxPage = Math.max(0, Math.ceil(count / pageSize.value) - 1)
      if (currentPage.value > maxPage) {
        currentPage.value = maxPage
        if (count > 0) {
          return loadStudents()
        }
      }

      students.value = results
      studentCrewsMap.value = await studentService.getCrewsForStudents(results)
    } catch (err) {
      error.value = err.message || 'Erro ao carregar alunos'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function goToPage(page) {
    const maxPage = Math.max(0, Math.ceil(totalCount.value / pageSize.value) - 1)
    if (page < 0 || page > maxPage) return
    currentPage.value = page
    await loadStudents()
  }

  async function nextPage() {
    await goToPage(currentPage.value + 1)
  }

  async function prevPage() {
    await goToPage(currentPage.value - 1)
  }

  async function search(query) {
    searchQuery.value = query
    currentPage.value = 0
    await loadStudents()
  }

  async function loadPendingStudents() {
    loading.value = true
    error.value = null

    try {
      const results = await studentService.getPendingStudents(0, 100)
      students.value = results
      totalCount.value = results.length
      currentPage.value = 0
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
      totalCount.value += 1
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
      totalCount.value = Math.max(0, totalCount.value - 1)
    } catch (err) {
      error.value = err.message || 'Erro ao deletar aluno'
      throw err
    } finally {
      loading.value = false
    }
  }

  function setFilters(newFilters) {
    filters.value = { ...newFilters }
    searchQuery.value = ''
    currentPage.value = 0
    return loadStudents()
  }

  function reset() {
    students.value = []
    studentCrewsMap.value = {}
    loading.value = false
    error.value = null
    currentPage.value = 0
    totalCount.value = 0
    filters.value = {}
    searchQuery.value = ''
  }

  return {
    students,
    studentCrewsMap,
    loading,
    error,
    currentPage,
    pageSize,
    totalCount,
    filters,
    searchQuery,
    loadStudents,
    goToPage,
    nextPage,
    prevPage,
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
