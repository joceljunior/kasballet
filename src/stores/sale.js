import { defineStore } from 'pinia'
import { ref } from 'vue'
import { saleService } from '../services/index.js'

export const useSaleStore = defineStore('sale', () => {
  const sales = ref([])
  const loading = ref(false)
  const error = ref(null)
  const filters = ref({})

  async function loadSales() {
    loading.value = true
    error.value = null
    try {
      sales.value = await saleService.getSales(0, 200, filters.value)
    } catch (err) {
      error.value = err.message || 'Erro ao carregar vendas'
      throw err
    } finally {
      loading.value = false
    }
  }

  function setFilters(newFilters) {
    filters.value = { ...newFilters }
    loadSales()
  }

  async function getSaleById(id) {
    loading.value = true
    error.value = null
    try {
      return await saleService.getSaleById(id)
    } catch (err) {
      error.value = err.message || 'Erro ao carregar venda'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createSale(data) {
    loading.value = true
    error.value = null
    try {
      const sale = await saleService.createSale(data)
      sales.value.unshift(sale)
      return sale
    } catch (err) {
      error.value = err.message || 'Erro ao registrar venda'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    sales,
    loading,
    error,
    filters,
    loadSales,
    setFilters,
    getSaleById,
    createSale
  }
})
