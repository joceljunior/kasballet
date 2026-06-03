import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { financialCategoryService } from '../services/index.js'
import {
  getCategoriesForType,
  getFilterCategoryOptions,
  getCategoryLabel,
  findCategoryByCode,
  isCategoryValidForType,
  isCategoryActive
} from '../utils/financialCategories.js'

export const useFinancialCategoryStore = defineStore('financialCategory', () => {
  const categories = ref([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref(null)

  const activeCategories = computed(() => categories.value.filter(isCategoryActive))

  async function load(force = false) {
    if (loaded.value && !force) return categories.value
    loading.value = true
    error.value = null
    try {
      categories.value = await financialCategoryService.getCategories()
      loaded.value = true
      return categories.value
    } catch (err) {
      error.value = err.message || 'Erro ao carregar categorias'
      throw err
    } finally {
      loading.value = false
    }
  }

  function optionsForType(type, { activeOnly = true } = {}) {
    return getCategoriesForType(categories.value, type, { activeOnly })
  }

  function filterOptions(type, { activeOnly = true } = {}) {
    return getFilterCategoryOptions(categories.value, type, { activeOnly })
  }

  function labelFor(type, code) {
    return getCategoryLabel(categories.value, type, code)
  }

  function getCategory(type, code) {
    return findCategoryByCode(categories.value, type, code)
  }

  function isValidForType(type, code) {
    return isCategoryValidForType(categories.value, type, code)
  }

  async function createCategory(data) {
    const created = await financialCategoryService.createCategory(data)
    await load(true)
    return created
  }

  async function updateCategory(id, data) {
    const updated = await financialCategoryService.updateCategory(id, data)
    await load(true)
    return updated
  }

  async function deleteCategory(id) {
    await financialCategoryService.deleteCategory(id)
    await load(true)
  }

  return {
    categories,
    activeCategories,
    loading,
    loaded,
    error,
    load,
    optionsForType,
    filterOptions,
    labelFor,
    getCategory,
    isValidForType,
    createCategory,
    updateCategory,
    deleteCategory
  }
})
