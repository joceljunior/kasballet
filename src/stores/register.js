import { defineStore } from 'pinia'
import { ref } from 'vue'
import { registerService } from '../services/index.js'

export const useRegisterStore = defineStore('register', () => {
  const registers = ref([])
  const loading = ref(false)
  const error = ref(null)
  const filters = ref({})
  const currentPage = ref(0)
  const pageSize = ref(25)
  const totalCount = ref(0)

  async function loadRegisters() {
    loading.value = true
    error.value = null
    try {
      const [results, count] = await Promise.all([
        registerService.getRegisters(currentPage.value, pageSize.value, filters.value),
        registerService.countRegisters(filters.value)
      ])

      totalCount.value = count

      const maxPage = Math.max(0, Math.ceil(count / pageSize.value) - 1)
      if (currentPage.value > maxPage) {
        currentPage.value = maxPage
        if (count > 0) {
          return loadRegisters()
        }
      }

      registers.value = results
    } catch (err) {
      error.value = err.message || 'Erro ao carregar chamadas'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function setFilters(newFilters) {
    filters.value = { ...newFilters }
    currentPage.value = 0
    return loadRegisters()
  }

  async function goToPage(page) {
    const maxPage = Math.max(0, Math.ceil(totalCount.value / pageSize.value) - 1)
    if (page < 0 || page > maxPage) return
    currentPage.value = page
    await loadRegisters()
  }

  async function nextPage() {
    await goToPage(currentPage.value + 1)
  }

  async function prevPage() {
    await goToPage(currentPage.value - 1)
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
      currentPage.value = 0
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
      if (registers.value.length === 1 && currentPage.value > 0) {
        currentPage.value -= 1
      }
      await loadRegisters()
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
    currentPage,
    pageSize,
    totalCount,
    loadRegisters,
    setFilters,
    goToPage,
    nextPage,
    prevPage,
    getRegisterById,
    createRegister,
    updateRegister,
    deleteRegister
  }
})
