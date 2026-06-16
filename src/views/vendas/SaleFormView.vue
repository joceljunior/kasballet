<template>
  <div class="space-y-6 pb-20 md:pb-6">
    <AppLoading v-if="pageLoading" card message="Carregando venda..." />

    <template v-else>
    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ isEdit ? 'Editar Venda' : 'Nova Venda' }}</h1>
        <p class="text-gray-600 mt-1">
          {{ isEdit ? 'Alterações atualizam o estoque e o lançamento financeiro.' : 'A venda será registrada automaticamente no financeiro como entrada.' }}
        </p>
      </div>
      <div class="flex flex-wrap gap-2 mt-4 md:mt-0">
        <router-link :to="isEdit ? `/vendas/${route.params.id}` : '/vendas'" class="btn-secondary">Voltar</router-link>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {{ error }}
      </div>

      <div class="card space-y-4">
        <h2 class="text-lg font-semibold text-gray-900">Dados da venda</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Data *</label>
            <input v-model="form.date" type="date" required class="input" />
          </div>
          <div>
            <StudentFilterSelect
              v-model="form.studentId"
              label="Aluna (opcional)"
              placeholder="Cliente avulso"
            />
          </div>
          <div v-if="!form.studentId">
            <label class="block text-sm font-medium text-gray-700 mb-2">Nome do cliente</label>
            <input v-model="form.customerName" type="text" class="input" placeholder="Ex: Maria Silva" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">Observações</label>
            <input v-model="form.notes" type="text" class="input" placeholder="Opcional" />
          </div>
        </div>
      </div>

      <div class="card space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 class="text-lg font-semibold text-gray-900">Produtos</h2>
          <router-link to="/produtos/novo" class="text-sm text-green-600 hover:text-green-700">
            + Cadastrar produto
          </router-link>
        </div>

        <AppLoading v-if="loadingProducts" size="sm" inline message="Carregando produtos..." />

        <div v-else-if="selectableProducts.length === 0" class="text-center py-6 text-gray-500">
          <p>Nenhum produto ativo com estoque.</p>
          <router-link to="/produtos" class="text-green-600 hover:underline mt-2 inline-block">Ver produtos</router-link>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Produto</label>
            <select v-model="selectedProductId" class="input">
              <option value="">Selecione...</option>
              <option
                v-for="p in selectableProducts"
                :key="p.id"
                :value="p.id"
              >
                {{ productDisplayName(p) }} — R$ {{ formatMoney(p.get('price')) }} ({{ getAvailableStock(p.id) }} disp.)
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
            <input v-model.number="selectedQuantity" type="number" min="1" class="input" />
          </div>
          <div>
            <button type="button" class="btn-secondary w-full" :disabled="!selectedProductId" @click="addItem">
              Adicionar
            </button>
          </div>
        </div>

        <div v-if="cart.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Preço un.</th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Qtd</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                <th class="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="(item, index) in cart" :key="item.productId">
                <td class="px-3 py-2 text-sm text-gray-900">{{ item.productName }}</td>
                <td class="px-3 py-2 text-sm text-right text-gray-600">R$ {{ formatMoney(item.unitPrice) }}</td>
                <td class="px-3 py-2 text-center">
                  <input
                    v-model.number="item.quantity"
                    type="number"
                    min="1"
                    :max="getMaxQuantity(item.productId)"
                    class="input w-20 text-center mx-auto"
                    @change="updateItemQuantity(index)"
                  />
                </td>
                <td class="px-3 py-2 text-sm text-right font-medium text-gray-900">
                  R$ {{ formatMoney(item.unitPrice * item.quantity) }}
                </td>
                <td class="px-3 py-2 text-right">
                  <button type="button" class="text-red-600 hover:text-red-800 text-sm" @click="removeItem(index)">
                    Remover
                  </button>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="px-3 py-3 text-right font-semibold text-gray-900">Total</td>
                <td class="px-3 py-3 text-right text-lg font-bold text-green-700">R$ {{ formatMoney(cartTotal) }}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div class="flex gap-4">
        <button type="submit" :disabled="loading || cart.length === 0" class="btn-primary disabled:opacity-50">
          {{ loading ? 'Salvando...' : (isEdit ? 'Salvar alterações' : 'Confirmar venda') }}
        </button>
        <router-link :to="isEdit ? `/vendas/${route.params.id}` : '/vendas'" class="btn-secondary">Cancelar</router-link>
      </div>
    </form>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSaleStore } from '../../stores/sale'
import { useItemCategoryStore } from '../../stores/itemCategory'
import { productService } from '../../services/index.js'
import { formatProductDisplayName } from '../../utils/itemCategories'
import { toYYYYMMDDLocal } from '../../utils/date.js'
import StudentFilterSelect from '../../components/common/StudentFilterSelect.vue'
import AppLoading from '../../components/common/AppLoading.vue'

const route = useRoute()
const router = useRouter()
const saleStore = useSaleStore()
const categoryStore = useItemCategoryStore()
const loading = ref(false)
const pageLoading = ref(false)
const loadingProducts = ref(false)
const error = ref(null)
const products = ref([])
const cart = ref([])
const selectedProductId = ref('')
const selectedQuantity = ref(1)
const originalSaleQty = ref({})

const isEdit = computed(() => route.name === 'venda-editar')

const today = new Date()
const form = ref({
  date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
  studentId: '',
  customerName: '',
  notes: ''
})

const selectableProducts = computed(() => {
  const cartIds = new Set(cart.value.map((i) => i.productId))
  return products.value.filter((p) => {
    const stock = Number(p.get('stockQuantity')) || 0
    const bonus = originalSaleQty.value[p.id] || 0
    return p.get('active') !== false && (stock + bonus > 0 || cartIds.has(p.id))
  })
})

const cartTotal = computed(() =>
  cart.value.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
)

function formatMoney(v) {
  const n = Number(v)
  return isNaN(n) ? '0,00' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getProductById(id) {
  return products.value.find((p) => p.id === id)
}

function productDisplayName(product) {
  const code = product.get('categoryCode') || product.get('category')
  const category = code ? categoryStore.getCategory(code, 'produto') : null
  return formatProductDisplayName(product, category)
}

function getAvailableStock(productId) {
  const product = getProductById(productId)
  if (!product) return 0
  const current = Number(product.get('stockQuantity')) || 0
  const bonus = originalSaleQty.value[productId] || 0
  const inCart = cart.value.find((i) => i.productId === productId)
  const reserved = inCart ? Number(inCart.quantity) || 0 : 0
  return current + bonus - reserved
}

function getMaxQuantity(productId) {
  const product = getProductById(productId)
  if (!product) return 1
  const current = Number(product.get('stockQuantity')) || 0
  const bonus = originalSaleQty.value[productId] || 0
  return Math.max(1, current + bonus)
}

function addItem() {
  error.value = null
  const product = getProductById(selectedProductId.value)
  if (!product) return
  const qty = Number(selectedQuantity.value) || 1
  const available = getAvailableStock(product.id)
  if (qty <= 0 || qty > available) {
    error.value = `Quantidade inválida. Disponível: ${available}`
    return
  }
  const existing = cart.value.find((i) => i.productId === product.id)
  if (existing) {
    const newQty = existing.quantity + qty
    if (newQty > getMaxQuantity(product.id)) {
      error.value = `Estoque insuficiente. Disponível: ${getMaxQuantity(product.id)}`
      return
    }
    existing.quantity = newQty
  } else {
    cart.value.push({
      productId: product.id,
      productName: productDisplayName(product),
      unitPrice: Number(product.get('price')) || 0,
      quantity: qty
    })
  }
  selectedProductId.value = ''
  selectedQuantity.value = 1
}

function updateItemQuantity(index) {
  const item = cart.value[index]
  if (!item) return
  const max = getMaxQuantity(item.productId)
  if (item.quantity < 1) item.quantity = 1
  if (item.quantity > max) {
    item.quantity = max
    error.value = `Quantidade ajustada ao estoque disponível (${max})`
  }
}

function removeItem(index) {
  cart.value.splice(index, 1)
}

async function handleSubmit() {
  if (cart.value.length === 0) {
    error.value = 'Adicione ao menos um produto'
    return
  }
  loading.value = true
  error.value = null
  try {
    const payload = {
      date: form.value.date,
      studentId: form.value.studentId || null,
      customerName: form.value.customerName,
      notes: form.value.notes,
      items: cart.value.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice
      }))
    }
    if (isEdit.value) {
      await saleStore.updateSale(route.params.id, payload)
      router.push(`/vendas/${route.params.id}`)
    } else {
      const sale = await saleStore.createSale(payload)
      router.push(`/vendas/${sale.id}`)
    }
  } catch (err) {
    error.value = err.message || 'Erro ao salvar venda'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  pageLoading.value = isEdit.value
  loadingProducts.value = true
  try {
    await categoryStore.load()
    products.value = await productService.getProducts(0, 200, { active: true })

    if (isEdit.value) {
      const sale = await saleStore.getSaleById(route.params.id)
      form.value = {
        date: toYYYYMMDDLocal(sale.get('date')) || form.value.date,
        studentId: sale.get('studentId') || '',
        customerName: sale.get('customerName') || '',
        notes: sale.get('notes') || ''
      }
      const items = sale.get('items') || []
      const qtyMap = {}
      cart.value = items.map((item) => {
        qtyMap[item.productId] = (qtyMap[item.productId] || 0) + (Number(item.quantity) || 0)
        return {
          productId: item.productId,
          productName: item.productName,
          unitPrice: Number(item.unitPrice) || 0,
          quantity: Number(item.quantity) || 0
        }
      })
      originalSaleQty.value = qtyMap

      for (const productId of Object.keys(qtyMap)) {
        if (!getProductById(productId)) {
          try {
            const product = await productService.getProductById(productId)
            if (product) products.value.push(product)
          } catch (_) {}
        }
      }
    }
  } catch (err) {
    error.value = err.message || 'Erro ao carregar venda'
    router.push('/vendas')
  } finally {
    pageLoading.value = false
    loadingProducts.value = false
  }
})
</script>
