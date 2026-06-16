<template>
  <div class="space-y-6 pb-20 md:pb-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Produtos</h1>
        <p class="text-gray-600 mt-1">Visualize o estoque agrupado por produto e tamanho</p>
      </div>
      <div class="flex flex-wrap gap-2 mt-4 md:mt-0">
        <router-link to="/produtos/categorias" class="btn-secondary">Categorias</router-link>
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

    <template v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="group in paginatedGroups"
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

      <div
        v-if="productGroups.length > 0"
        class="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3"
      >
        <p class="text-sm text-gray-600">
          Mostrando {{ rangeStart }}–{{ rangeEnd }} de {{ productGroups.length }} produto{{ productGroups.length === 1 ? '' : 's' }}
        </p>
        <div v-if="totalPages > 1" class="flex items-center gap-2">
          <button
            type="button"
            class="btn-secondary text-sm py-1.5 px-3 disabled:opacity-50"
            :disabled="productStore.loading || currentPage === 0"
            @click="goPrevPage"
          >
            Anterior
          </button>
          <span class="text-sm text-gray-700 whitespace-nowrap">
            Página {{ currentPage + 1 }} de {{ totalPages }}
          </span>
          <button
            type="button"
            class="btn-secondary text-sm py-1.5 px-3 disabled:opacity-50"
            :disabled="productStore.loading || currentPage >= totalPages - 1"
            @click="goNextPage"
          >
            Próxima
          </button>
        </div>
      </div>
    </template>
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
const currentPage = ref(0)
const pageSize = 12
let searchTimeout = null

const categoryOptions = computed(() => categoryStore.options())
const productGroups = computed(() => groupProducts(productStore.products))
const totalPages = computed(() => Math.max(1, Math.ceil(productGroups.value.length / pageSize)))
const paginatedGroups = computed(() => {
  const start = currentPage.value * pageSize
  return productGroups.value.slice(start, start + pageSize)
})
const rangeStart = computed(() => (productGroups.value.length ? currentPage.value * pageSize + 1 : 0))
const rangeEnd = computed(() => Math.min(productGroups.value.length, (currentPage.value + 1) * pageSize))

function formatMoney(v) {
  const n = Number(v)
  return isNaN(n) ? '0,00' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function categoryLabel(code) {
  const label = categoryStore.labelFor(code)
  return label !== code ? label : code
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
    name: 'produto-grupo',
    query: {
      nome: group.name,
      categoria: group.categoryCode || '',
      categoriaLabel: categoryLabel(group.categoryCode) || ''
    }
  })
}

function buildFilters() {
  const filters = {}
  if (filterActive.value === 'true') filters.active = true
  else if (filterActive.value === 'false') filters.active = false
  if (filterCategory.value) filters.category = filterCategory.value
  return filters
}

async function applyFilters() {
  currentPage.value = 0
  await productStore.setFilters(buildFilters())
}

function handleSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    currentPage.value = 0
    productStore.filters = buildFilters()
    await productStore.search(searchTerm.value)
  }, 300)
}

function goPrevPage() {
  if (currentPage.value > 0) currentPage.value -= 1
}

function goNextPage() {
  if (currentPage.value < totalPages.value - 1) currentPage.value += 1
}

onMounted(async () => {
  await categoryStore.load()
  await applyFilters()
})
</script>
