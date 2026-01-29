import { defineStore } from 'pinia'
import { ref } from 'vue'
import { registerService } from '../services/index.js'

export const useRegisterStore = defineStore('register', () => {
  const registers = ref([])
  const loading = ref(false)
  const error = ref(null)
  const filters = ref({})

  async function loadRegisters(resetFilters = false) {
    loading.value = true
    error.value = null
    try {
      registers.value = await registerService.getRegisters(0, 100, filters.value)
    } catch (err) {
      error.value = err.message || 'Erro ao carregar chamadas'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function setFilters(newFilters) {
    filters.value = { ...newFilters }
    return loadRegisters()
  }

  async function getRegisterById(id) {
    loading.value = true
    error.value = null
    try {
      return await registerService.getRegisterById(id)
    } catch (err) {
      error.value = err.message || 'Erro ao carregar chamada'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createRegister(data) {
    loading.value = true
    error.value = null
    try {
      const r = await registerService.createRegister(data)
      await loadRegisters()
      return r
    } catch (err) {
      error.value = err.message || 'Erro ao criar chamada'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateRegister(id, data) {
    loading.value = true
    error.value = null
    try {
      const r = await registerService.updateRegister(id, data)
      const i = registers.value.findIndex((x) => x.id === id)
      if (i !== -1) registers.value[i] = r
      return r
    } catch (err) {
      error.value = err.message || 'Erro ao atualizar chamada'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteRegister(id) {
    loading.value = true
    error.value = null
    try {
      await registerService.deleteRegister(id)
      registers.value = registers.value.filter((x) => x.id !== id)
    } catch (err) {
      error.value = err.message || 'Erro ao excluir chamada'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    registers,
    loading,
    error,
    filters,
    loadRegisters,
    setFilters,
    getRegisterById,
    createRegister,
    updateRegister,
    deleteRegister
  }
})
