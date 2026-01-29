import { defineStore } from 'pinia'
import { ref } from 'vue'
import { financialEntryService } from '../services/index.js'

export const useFinancialStore = defineStore('financial', () => {
  const entries = ref([])
  const loading = ref(false)
  const error = ref(null)
  const filters = ref({})
  const totals = ref({
    totalEntradas: 0,
    totalSaidas: 0,
    saldo: 0,
    totalEntradasProjetado: 0,
    totalSaidasProjetado: 0,
    saldoProjetado: 0
  })

  async function loadEntries() {
    loading.value = true
    error.value = null
    try {
      entries.value = await financialEntryService.getEntries(0, 200, filters.value)
    } catch (err) {
      error.value = err.message || 'Erro ao carregar lançamentos'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function loadTotals() {
    try {
      totals.value = await financialEntryService.getTotals(filters.value)
    } catch (_) {
      totals.value = {
        totalEntradas: 0,
        totalSaidas: 0,
        saldo: 0,
        totalEntradasProjetado: 0,
        totalSaidasProjetado: 0,
        saldoProjetado: 0
      }
    }
  }

  function setFilters(newFilters) {
    filters.value = { ...newFilters }
    return Promise.all([loadEntries(), loadTotals()])
  }

  async function getEntryById(id) {
    loading.value = true
    error.value = null
    try {
      return await financialEntryService.getEntryById(id)
    } catch (err) {
      error.value = err.message || 'Erro ao carregar lançamento'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createEntry(data) {
    loading.value = true
    error.value = null
    try {
      const e = await financialEntryService.createEntry(data)
      await loadEntries()
      await loadTotals()
      return e
    } catch (err) {
      error.value = err.message || 'Erro ao criar lançamento'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateEntry(id, data) {
    loading.value = true
    error.value = null
    try {
      const e = await financialEntryService.updateEntry(id, data)
      const i = entries.value.findIndex((x) => x.id === id)
      if (i !== -1) entries.value[i] = e
      await loadTotals()
      return e
    } catch (err) {
      error.value = err.message || 'Erro ao atualizar lançamento'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteEntry(id) {
    loading.value = true
    error.value = null
    try {
      await financialEntryService.deleteEntry(id)
      entries.value = entries.value.filter((x) => x.id !== id)
      await loadTotals()
    } catch (err) {
      error.value = err.message || 'Erro ao excluir lançamento'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    entries,
    loading,
    error,
    filters,
    totals,
    loadEntries,
    loadTotals,
    setFilters,
    getEntryById,
    createEntry,
    updateEntry,
    deleteEntry
  }
})
