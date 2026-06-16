import { defineStore } from 'pinia'
import { ref } from 'vue'
import { productService } from '../services/index.js'

export const useProductStore = defineStore('product', () => {
  const products = ref([])
  const loading = ref(false)
  const error = ref(null)
  const filters = ref({ active: true })
  const searchQuery = ref('')
  const totalCount = ref(0)
  const fetchLimit = 500

  async function loadProducts() {
    loading.value = true
    error.value = null
    try {
      const activeFilters = { ...filters.value }
      if (searchQuery.value.trim()) {
        const term = searchQuery.value.trim()
        products.value = await productService.searchProducts(term, 0, fetchLimit, activeFilters)
        totalCount.value = products.value.length
      } else {
        products.value = await productService.getProducts(0, fetchLimit, activeFilters)
        totalCount.value = await productService.countProducts(activeFilters)
      }
    } catch (err) {
      error.value = err.message || 'Erro ao carregar produtos'
      throw err
    } finally {
      loading.value = false
    }
  }

  function setFilters(newFilters) {
    filters.value = { ...newFilters }
    return loadProducts()
  }

  async function search(query) {
    searchQuery.value = query
    return loadProducts()
  }

  async function getProductById(id) {
    loading.value = true
    error.value = null
    try {
      return await productService.getProductById(id)
    } catch (err) {
      error.value = err.message || 'Erro ao carregar produto'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createProduct(data) {
    loading.value = true
    error.value = null
    try {
      const product = await productService.createProduct(data)
      await loadProducts()
      return product
    } catch (err) {
      error.value = err.message || 'Erro ao criar produto'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateProduct(id, data) {
    error.value = null
    try {
      const updated = await productService.updateProduct(id, data)
      const index = products.value.findIndex((p) => p.id === id)
      if (index !== -1) products.value[index] = updated
      return updated
    } catch (err) {
      error.value = err.message || 'Erro ao atualizar produto'
      throw err
    }
  }

  async function deleteProduct(id) {
    loading.value = true
    error.value = null
    try {
      await productService.deleteProduct(id)
      products.value = products.value.filter((p) => p.id !== id)
      totalCount.value = Math.max(0, totalCount.value - 1)
    } catch (err) {
      error.value = err.message || 'Erro ao excluir produto'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    products,
    loading,
    error,
    filters,
    searchQuery,
    totalCount,
    loadProducts,
    setFilters,
    search,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
  }
})
