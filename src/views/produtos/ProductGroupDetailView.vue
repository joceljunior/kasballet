<template>
  <div class="space-y-6 pb-20 md:pb-6">
    <AppLoading v-if="pageLoading" card message="Carregando produto..." />

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
                <span :class="getStockClass(product)" class="font-medium">{{ product.get('stockQuantity') ?? 0 }}</span>
              </td>
              <td class="px-4 py-3 text-sm">
                <span
                  :class="product.get('active') !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'"
                  class="px-2 py-0.5 text-xs font-medium rounded-full"
                >
                  {{ product.get('active') !== false ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-right">
                <router-link :to="`/produtos/${product.id}/edit`" class="text-green-600 hover:underline">Editar</router-link>
              </td>
            </tr>
            <tr v-if="variants.length === 0">
              <td :colspan="attributeFields.length + 4" class="px-4 py-6 text-sm text-gray-500 text-center">
                Nenhuma variação cadastrada.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useItemCategoryStore } from '../../stores/itemCategory'
import { productService } from '../../services/index.js'
import { normalizeAttributeFields } from '../../utils/itemCategories'
import { ShoppingBagIcon } from '@heroicons/vue/24/outline'
import AppLoading from '../../components/common/AppLoading.vue'

const route = useRoute()
const router = useRouter()
const categoryStore = useItemCategoryStore()
const pageLoading = ref(true)
const variants = ref([])

const groupName = computed(() => String(route.query.nome || ''))
const categoryCode = computed(() => String(route.query.categoria || ''))

const category = computed(() => categoryStore.getCategory(categoryCode.value, 'produto'))
const categoryLabel = computed(() => category.value?.get('label') || categoryCode.value || '')
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

function getStockClass(product) {
  const stock = Number(product.get('stockQuantity')) || 0
  if (stock <= 0) return 'text-red-600'
  if (stock <= 5) return 'text-amber-600'
  return 'text-gray-900'
}

onMounted(async () => {
  if (!groupName.value) {
    router.replace('/produtos')
    return
  }
  try {
    await categoryStore.load()
    variants.value = await productService.getProductsByGroup(groupName.value, categoryCode.value)
  } catch (_) {
    router.replace('/produtos')
  } finally {
    pageLoading.value = false
  }
})
</script>
