import { defineStore } from 'pinia'
import { ref } from 'vue'
import { financialEntryService } from '../services/index.js'

export const useFinancialStore = defineStore('financial', () => {
  const entries = ref([])
  const loading = ref(false)
  const error = ref(null)
  const filters = ref({})
  const currentPage = ref(0)
  const pageSize = ref(25)
  const totalCount = ref(0)
  const totals = ref({
    totalEntradas: 0,
    totalSaidas: 0,
    saldo: 0,
    totalEntradasProjetado: 0,
    totalSaidasProjetado: 0,
    saldoProjetado: 0
  })
  const distribution = ref({ entrada: [], saida: [] })

  async function loadEntries() {
    loading.value = true
    error.value = null
    try {
      const [results, count] = await Promise.all([
        financialEntryService.getEntries(currentPage.value, pageSize.value, filters.value),
        financialEntryService.countEntries(filters.value)
      ])
      entries.value = results
      totalCount.value = count
      const maxPage = Math.max(0, Math.ceil(count / pageSize.value) - 1)
      if (currentPage.value > maxPage) {
        currentPage.value = maxPage
        entries.value = await financialEntryService.getEntries(currentPage.value, pageSize.value, filters.value)
      }
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

  async function loadDistribution() {
    try {
      distribution.value = await financialEntryService.getDistributionBySubtype(filters.value, {
        effectiveOnly: true
      })
    } catch (_) {
      distribution.value = { entrada: [], saida: [] }
    }
  }

  function setFilters(newFilters) {
    filters.value = { ...newFilters }
    currentPage.value = 0
    return Promise.all([loadEntries(), loadTotals(), loadDistribution()])
  }

  async function goToPage(page) {
    const maxPage = Math.max(0, Math.ceil(totalCount.value / pageSize.value) - 1)
    if (page < 0 || page > maxPage) return
    currentPage.value = page
    await loadEntries()
  }

  async function nextPage() {
    await goToPage(currentPage.value + 1)
  }

  async function prevPage() {
    await goToPage(currentPage.value - 1)
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
      currentPage.value = 0
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
      if (entries.value.length === 1 && currentPage.value > 0) {
        currentPage.value -= 1
      }
      await loadEntries()
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
    currentPage,
    pageSize,
    totalCount,
    totals,
    distribution,
    loadEntries,
    loadTotals,
    loadDistribution,
    setFilters,
    goToPage,
    nextPage,
    prevPage,
    getEntryById,
    createEntry,
    updateEntry,
    deleteEntry
  }
})
