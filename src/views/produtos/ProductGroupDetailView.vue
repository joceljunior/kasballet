<template>
  <div class="space-y-6 pb-20 md:pb-6">
    <AppLoading v-if="pageLoading" card message="Carregando produto..." />

    <template v-else>
      <div v-if="loadError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {{ loadError }}
        <router-link to="/produtos" class="block mt-2 text-sm text-red-800 underline">Voltar aos produtos</router-link>
      </div>

      <template v-else>
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <router-link to="/produtos" class="text-sm text-green-600 hover:underline">← Voltar aos produtos</router-link>
            <h1 class="text-2xl font-bold text-gray-900 mt-2">{{ groupName }}</h1>
            <p v-if="categoryLabel" class="text-gray-600 mt-1">{{ categoryLabel }}</p>
          </div>
          <router-link
            :to="{ path: '/produtos/novo', query: { nome: groupName, categoria: categoryCode } }"
            class="btn-primary"
          >
            Adicionar tamanho/variação
          </router-link>
        </div>

        <div class="card flex flex-col md:flex-row gap-6">
          <div class="w-full md:w-48 aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
            <img v-if="photoUrl" :src="photoUrl" :alt="groupName" class="w-full h-full object-cover" />
            <ShoppingBagIcon v-else class="w-16 h-16 text-gray-300" />
          </div>
          <div class="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p class="text-sm text-gray-500">Variações</p>
              <p class="text-2xl font-bold text-gray-900">{{ variants.length }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Estoque total</p>
              <p class="text-2xl font-bold" :class="totalStock <= 0 ? 'text-red-600' : totalStock <= 5 ? 'text-amber-600' : 'text-gray-900'">
                {{ totalStock }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Preço mínimo</p>
              <p class="text-lg font-semibold text-green-700">R$ {{ formatMoney(minPrice) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Preço máximo</p>
              <p class="text-lg font-semibold text-green-700">R$ {{ formatMoney(maxPrice) }}</p>
            </div>
          </div>
        </div>

        <div v-if="saveError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {{ saveError }}
        </div>

        <div class="card overflow-x-auto">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Estoque por tamanho</h2>
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th v-for="field in attributeFields" :key="field.key" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {{ field.label }}
                </th>
                <th v-if="attributeFields.length === 0" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variação</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estoque</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="product in sortedVariants" :key="product.id" class="hover:bg-gray-50">
                <td v-for="field in attributeFields" :key="field.key" class="px-4 py-3 text-sm text-gray-900">
                  {{ getAttribute(product, field.key) || '—' }}
                </td>
                <td v-if="attributeFields.length === 0" class="px-4 py-3 text-sm text-gray-500">Padrão</td>
                <td class="px-4 py-3 text-sm font-medium text-green-700">R$ {{ formatMoney(product.get('price')) }}</td>
                <td class="px-4 py-3 text-sm">
                  <div class="flex items-center gap-2">
                    <input
                      v-model.number="stockEdits[product.id]"
                      type="number"
                      min="0"
                      step="1"
                      class="input w-24"
                      :disabled="savingStockId === product.id"
                      @keyup.enter="saveStock(product)"
                    />
                    <button
                      v-if="stockChanged(product)"
                      type="button"
                      class="text-xs text-green-600 hover:underline whitespace-nowrap disabled:opacity-50"
                      :disabled="savingStockId === product.id"
                      @click="saveStock(product)"
                    >
                      {{ savingStockId === product.id ? 'Salvando...' : 'Salvar' }}
                    </button>
                  </div>
                </td>
                <td class="px-4 py-3 text-sm">
                  <span
                    :class="product.get('active') !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'"
                    class="px-2 py-0.5 text-xs font-medium rounded-full"
                  >
                    {{ product.get('active') !== false ? 'Ativo' : 'Inativo' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-right whitespace-nowrap">
                  <router-link :to="`/produtos/${product.id}/edit`" class="text-green-600 hover:underline">Editar</router-link>
                </td>
              </tr>
              <tr v-if="variants.length === 0">
                <td :colspan="attributeFields.length + 4" class="px-4 py-6 text-sm text-gray-500 text-center">
                  Nenhuma variação cadastrada.
                  <router-link
                    :to="{ path: '/produtos/novo', query: { nome: groupName, categoria: categoryCode } }"
                    class="block mt-2 text-green-600 hover:underline"
                  >
                    Adicionar primeiro tamanho
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useItemCategoryStore } from '../../stores/itemCategory'
import { useProductStore } from '../../stores/product'
import { productService } from '../../services/index.js'
import { normalizeAttributeFields } from '../../utils/itemCategories'
import { ShoppingBagIcon } from '@heroicons/vue/24/outline'
import AppLoading from '../../components/common/AppLoading.vue'

const route = useRoute()
const categoryStore = useItemCategoryStore()
const productStore = useProductStore()
const pageLoading = ref(true)
const loadError = ref(null)
const saveError = ref(null)
const variants = ref([])
const stockEdits = ref({})
const savingStockId = ref(null)

const groupName = computed(() => String(route.query.nome || ''))
const categoryCode = computed(() => String(route.query.categoria || ''))
const categoryLabelQuery = computed(() => String(route.query.categoriaLabel || ''))

const category = computed(() => {
  const code = categoryCode.value
  if (!code) return null
  return categoryStore.getCategory(code) || null
})
const categoryLabel = computed(() => {
  if (category.value) return category.value.get('label')
  return categoryLabelQuery.value || categoryCode.value || ''
})
const attributeFields = computed(() => normalizeAttributeFields(category.value?.get('attributeFields')))

const totalStock = computed(() => variants.value.reduce((sum, p) => sum + (Number(p.get('stockQuantity')) || 0), 0))
const minPrice = computed(() => {
  const prices = variants.value.map((p) => Number(p.get('price')) || 0).filter((p) => p > 0)
  return prices.length ? Math.min(...prices) : 0
})
const maxPrice = computed(() => {
  const prices = variants.value.map((p) => Number(p.get('price')) || 0)
  return prices.length ? Math.max(...prices) : 0
})

const photoUrl = computed(() => {
  for (const product of variants.value) {
    const photo = product.get('photo')
    const url = photo?.url?.()
    if (url) return url
  }
  return null
})

const sortedVariants = computed(() => {
  const primaryKey = attributeFields.value[0]?.key
  return [...variants.value].sort((a, b) => {
    if (!primaryKey) return 0
    const av = getAttribute(a, primaryKey)
    const bv = getAttribute(b, primaryKey)
    const an = Number(av)
    const bn = Number(bv)
    if (!isNaN(an) && !isNaN(bn)) return an - bn
    return String(av).localeCompare(String(bv), 'pt-BR', { numeric: true })
  })
})

function formatMoney(v) {
  const n = Number(v)
  return isNaN(n) ? '0,00' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getAttribute(product, key) {
  const attrs = product.get('attributes') || {}
  return attrs[key] != null ? String(attrs[key]) : ''
}

function syncStockEdits() {
  const next = {}
  for (const product of variants.value) {
    next[product.id] = Number(product.get('stockQuantity')) || 0
  }
  stockEdits.value = next
}

function stockChanged(product) {
  const current = Number(product.get('stockQuantity')) || 0
  const edited = Number(stockEdits.value[product.id])
  return edited !== current && !Number.isNaN(edited)
}

async function saveStock(product) {
  saveError.value = null
  const stock = Number(stockEdits.value[product.id])
  if (Number.isNaN(stock) || stock < 0) {
    saveError.value = 'Informe uma quantidade válida.'
    return
  }
  savingStockId.value = product.id
  try {
    const updated = await productStore.updateProduct(product.id, { stockQuantity: stock })
    const index = variants.value.findIndex((p) => p.id === product.id)
    if (index !== -1) variants.value[index] = updated
    syncStockEdits()
  } catch (err) {
    saveError.value = err.message || 'Erro ao atualizar estoque'
  } finally {
    savingStockId.value = null
  }
}

async function loadGroup() {
  if (!groupName.value) {
    loadError.value = 'Produto não informado.'
    pageLoading.value = false
    return
  }
  pageLoading.value = true
  loadError.value = null
  try {
    await categoryStore.load()
    variants.value = await productService.getProductsByGroup(
      groupName.value,
      categoryCode.value,
      categoryLabelQuery.value || categoryLabel.value
    )
    syncStockEdits()
  } catch (err) {
    loadError.value = err.message || 'Erro ao carregar variações do produto'
    variants.value = []
  } finally {
    pageLoading.value = false
  }
}

onMounted(loadGroup)
watch(() => [route.query.nome, route.query.categoria, route.query.categoriaLabel], loadGroup)
</script>
