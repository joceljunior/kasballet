<template>
  <div class="space-y-6 pb-20 md:pb-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Produtos</h1>
        <p class="text-gray-600 mt-1">Visualize o estoque agrupado por produto e tamanho</p>
      </div>
      <div class="flex flex-wrap gap-2 mt-4 md:mt-0">
        <router-link to="/categorias" class="btn-secondary">Categorias</router-link>
        <router-link to="/produtos/novo" class="btn-primary">Novo Produto</router-link>
      </div>
    </div>

    <div class="card">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
          <input v-model="searchTerm" type="text" class="input" placeholder="Nome do produto..." @input="handleSearch" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
          <select v-model="filterCategory" class="input" @change="applyFilters">
            <option value="">Todas</option>
            <option v-for="cat in categoryOptions" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select v-model="filterActive" class="input" @change="applyFilters">
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
            <option value="">Todos</option>
          </select>
        </div>
      </div>
    </div>

    <AppLoading v-if="productStore.loading && productStore.products.length === 0" card message="Carregando produtos..." />

    <div v-else-if="productGroups.length === 0" class="card text-center py-12">
      <ShoppingBagIcon class="h-12 w-12 mx-auto text-gray-400" />
      <p class="mt-4 text-gray-600">Nenhum produto cadastrado</p>
      <router-link to="/produtos/novo" class="btn-primary mt-4 inline-block">Cadastrar produto</router-link>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="group in productGroups"
        :key="group.key"
        class="card hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
        @click="openGroup(group)"
      >
        <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
          <img
            v-if="getGroupPhotoUrl(group)"
            :src="getGroupPhotoUrl(group)"
            :alt="group.name"
            class="w-full h-full object-cover"
          />
          <ShoppingBagIcon v-else class="w-16 h-16 text-gray-300" />
        </div>
        <h3 class="font-semibold text-gray-900 truncate">{{ group.name }}</h3>
        <p v-if="group.categoryCode" class="text-xs text-gray-500 mt-0.5">{{ categoryLabel(group.categoryCode) }}</p>
        <p class="text-lg font-bold text-green-700 mt-2">
          <template v-if="group.minPrice === group.maxPrice">R$ {{ formatMoney(group.minPrice) }}</template>
          <template v-else>R$ {{ formatMoney(group.minPrice) }} – {{ formatMoney(group.maxPrice) }}</template>
        </p>
        <div class="flex items-center justify-between mt-2">
          <span class="inline-flex items-center gap-1 text-sm font-medium" :class="getGroupStockClass(group)">
            <CubeIcon class="w-4 h-4" />
            {{ group.totalStock }} em estoque
          </span>
          <span class="text-xs text-gray-500">{{ group.variantCount }} {{ group.variantCount === 1 ? 'tamanho' : 'tamanhos' }}</span>
        </div>
        <span
          v-if="group.hasInactive"
          class="mt-2 self-start text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
        >
          Com variações inativas
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '../../stores/product'
import { useItemCategoryStore } from '../../stores/itemCategory'
import { groupProducts } from '../../utils/itemCategories'
import { ShoppingBagIcon, CubeIcon } from '@heroicons/vue/24/outline'
import AppLoading from '../../components/common/AppLoading.vue'

const router = useRouter()
const productStore = useProductStore()
const categoryStore = useItemCategoryStore()
const searchTerm = ref('')
const filterCategory = ref('')
const filterActive = ref('true')
let searchTimeout = null

const categoryOptions = computed(() => categoryStore.optionsForScope('produto'))
const productGroups = computed(() => groupProducts(productStore.products))

function formatMoney(v) {
  const n = Number(v)
  return isNaN(n) ? '0,00' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function categoryLabel(code) {
  return categoryStore.labelFor(code, 'produto')
}

function getGroupPhotoUrl(group) {
  return group.photo?.url?.() || null
}

function getGroupStockClass(group) {
  if (group.totalStock <= 0) return 'text-red-600'
  if (group.totalStock <= 5) return 'text-amber-600'
  return 'text-gray-600'
}

function openGroup(group) {
  router.push({
    path: '/produtos/grupo',
    query: { nome: group.name, categoria: group.categoryCode }
  })
}

function applyFilters() {
  const filters = {}
  if (filterActive.value === 'true') filters.active = true
  else if (filterActive.value === 'false') filters.active = false
  if (filterCategory.value) filters.category = filterCategory.value
  productStore.setFilters(filters)
}

function handleSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    productStore.loading = true
    try {
      const filters = {}
      if (filterActive.value === 'true') filters.active = true
      else if (filterActive.value === 'false') filters.active = false
      if (filterCategory.value) filters.category = filterCategory.value
      const { productService } = await import('../../services/index.js')
      productStore.products = await productService.searchProducts(searchTerm.value, 0, 200, filters)
    } catch (_) {
    } finally {
      productStore.loading = false
    }
  }, 300)
}

onMounted(async () => {
  await categoryStore.load()
  applyFilters()
})
</script>
