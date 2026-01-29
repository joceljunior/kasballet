import { defineStore } from 'pinia'
import { ref } from 'vue'
import { teacherService } from '../services/index.js'

export const useTeacherStore = defineStore('teacher', () => {
  const teachers = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function loadTeachers() {
    loading.value = true
    error.value = null

    try {
      teachers.value = await teacherService.getTeachers()
    } catch (err) {
      error.value = err.message || 'Erro ao carregar professoras'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getTeacherById(id) {
    loading.value = true
    error.value = null

    try {
      return await teacherService.getTeacherById(id)
    } catch (err) {
      error.value = err.message || 'Erro ao carregar professora'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createTeacher(data) {
    loading.value = true
    error.value = null

    try {
      const t = await teacherService.createTeacher(data)
      teachers.value.push(t)
      return t
    } catch (err) {
      error.value = err.message || 'Erro ao criar professora'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateTeacher(userId, data) {
    loading.value = true
    error.value = null

    try {
      const updated = await teacherService.updateTeacher(userId, data)
      const i = teachers.value.findIndex((x) => x.id === userId)
      if (i !== -1) teachers.value[i] = updated
      return updated
    } catch (err) {
      error.value = err.message || 'Erro ao atualizar professora'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    teachers,
    loading,
    error,
    loadTeachers,
    getTeacherById,
    createTeacher,
    updateTeacher
  }
})
