import { defineStore } from 'pinia'
import { ref } from 'vue'
import { productService } from '../services/index.js'

export const useProductStore = defineStore('product', () => {
  const products = ref([])
  const loading = ref(false)
  const error = ref(null)
  const filters = ref({ active: true })

  async function loadProducts() {
    loading.value = true
    error.value = null
    try {
      products.value = await productService.getProducts(0, 200, filters.value)
    } catch (err) {
      error.value = err.message || 'Erro ao carregar produtos'
      throw err
    } finally {
      loading.value = false
    }
  }

  function setFilters(newFilters) {
    filters.value = { ...newFilters }
    loadProducts()
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
      products.value.unshift(product)
      return product
    } catch (err) {
      error.value = err.message || 'Erro ao criar produto'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateProduct(id, data) {
    loading.value = true
    error.value = null
    try {
      const updated = await productService.updateProduct(id, data)
      const index = products.value.findIndex((p) => p.id === id)
      if (index !== -1) products.value[index] = updated
      return updated
    } catch (err) {
      error.value = err.message || 'Erro ao atualizar produto'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteProduct(id) {
    loading.value = true
    error.value = null
    try {
      await productService.deleteProduct(id)
      products.value = products.value.filter((p) => p.id !== id)
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
    loadProducts,
    setFilters,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
  }
})
