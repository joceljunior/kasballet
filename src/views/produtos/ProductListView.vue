<template>
  <div class="space-y-6 pb-20 md:pb-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Produtos</h1>
        <p class="text-gray-600 mt-1">Sapatilhas, roupas, mochilas e demais itens</p>
      </div>
      <div class="flex flex-wrap gap-2 mt-4 md:mt-0">
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
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
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

    <div v-else-if="productStore.products.length === 0" class="card text-center py-12">
      <ShoppingBagIcon class="h-12 w-12 mx-auto text-gray-400" />
      <p class="mt-4 text-gray-600">Nenhum produto cadastrado</p>
      <router-link to="/produtos/novo" class="btn-primary mt-4 inline-block">Cadastrar produto</router-link>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="product in productStore.products"
        :key="product.id"
        class="card hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
        @click="$router.push(`/produtos/${product.id}/edit`)"
      >
        <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
          <img
            v-if="getPhotoUrl(product)"
            :src="getPhotoUrl(product)"
            :alt="product.get('name')"
            class="w-full h-full object-cover"
          />
          <ShoppingBagIcon v-else class="w-16 h-16 text-gray-300" />
        </div>
        <h3 class="font-semibold text-gray-900 truncate">{{ product.get('name') }}</h3>
        <p v-if="product.get('category')" class="text-xs text-gray-500 mt-0.5">{{ product.get('category') }}</p>
        <p class="text-lg font-bold text-green-700 mt-2">R$ {{ formatMoney(product.get('price')) }}</p>
        <div class="flex items-center justify-between mt-2">
          <span
            class="inline-flex items-center gap-1 text-sm font-medium"
            :class="getStockClass(product)"
          >
            <CubeIcon class="w-4 h-4" />
            {{ product.get('stockQuantity') ?? 0 }} em estoque
          </span>
          <span
            v-if="product.get('active') === false"
            class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
          >
            Inativo
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useProductStore } from '../../stores/product'
import { ShoppingBagIcon, CubeIcon } from '@heroicons/vue/24/outline'
import AppLoading from '../../components/common/AppLoading.vue'

const productStore = useProductStore()
const searchTerm = ref('')
const filterCategory = ref('')
const filterActive = ref('true')
let searchTimeout = null

const categories = ['Sapatilhas', 'Roupas', 'Mochilas', 'Acessórios', 'Outros']

function formatMoney(v) {
  const n = Number(v)
  return isNaN(n) ? '0,00' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getPhotoUrl(product) {
  const photo = product.get('photo')
  return photo?.url?.() || null
}

function getStockClass(product) {
  const stock = Number(product.get('stockQuantity')) || 0
  if (stock <= 0) return 'text-red-600'
  if (stock <= 5) return 'text-amber-600'
  return 'text-gray-600'
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

onMounted(() => {
  applyFilters()
})
</script>
