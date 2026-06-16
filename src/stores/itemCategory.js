import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { itemCategoryService } from '../services/index.js'
import {
  getCategoriesForScope,
  getCategoryLabel,
  findCategoryByCode,
  isItemCategoryActive,
  categoryToOption
} from '../utils/itemCategories.js'

export const useItemCategoryStore = defineStore('itemCategory', () => {
  const categories = ref([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref(null)

  const activeCategories = computed(() => categories.value.filter(isItemCategoryActive))

  async function load(force = false) {
    if (loaded.value && !force) return categories.value
    loading.value = true
    error.value = null
    try {
      categories.value = await itemCategoryService.getCategories()
      loaded.value = true
      return categories.value
    } catch (err) {
      error.value = err.message || 'Erro ao carregar categorias'
      throw err
    } finally {
      loading.value = false
    }
  }

  function optionsForScope(scope, { activeOnly = true } = {}) {
    return getCategoriesForScope(categories.value, scope, { activeOnly })
  }

  function labelFor(code, scope = null) {
    return getCategoryLabel(categories.value, code, scope)
  }

  function getCategory(code, scope = null) {
    return findCategoryByCode(categories.value, code, scope)
  }

  function getCategoryOption(code, scope = 'produto') {
    const cat = getCategory(code, scope)
    return cat ? categoryToOption(cat) : null
  }

  async function createCategory(data) {
    const created = await itemCategoryService.createCategory(data)
    await load(true)
    return created
  }

  async function updateCategory(id, data) {
    const updated = await itemCategoryService.updateCategory(id, data)
    await load(true)
    return updated
  }

  async function deleteCategory(id) {
    await itemCategoryService.deleteCategory(id)
    await load(true)
  }

  return {
    categories,
    activeCategories,
    loading,
    loaded,
    error,
    load,
    optionsForScope,
    labelFor,
    getCategory,
    getCategoryOption,
    createCategory,
    updateCategory,
    deleteCategory
  }
})
