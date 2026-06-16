<template>
  <div class="space-y-6 pb-20 md:pb-6">
    <AppLoading v-if="pageLoading" card message="Carregando produto..." />

    <template v-else>
    <h1 class="text-2xl font-bold text-gray-900">{{ isEdit ? 'Editar Produto' : 'Novo Produto' }}</h1>
    <p v-if="!isEdit && route.query.nome" class="text-sm text-gray-600">
      Adicionando variação para <strong>{{ route.query.nome }}</strong>
    </p>

    <form @submit.prevent="handleSubmit" class="card space-y-6">
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {{ error }}
      </div>

      <div class="flex flex-col md:flex-row gap-6">
        <div class="w-full md:w-48 aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
          <img v-if="photoPreview || currentPhotoUrl" :src="photoPreview || currentPhotoUrl" alt="Preview" class="w-full h-full object-cover" />
          <ShoppingBagIcon v-else class="w-16 h-16 text-gray-300" />
        </div>
        <div class="flex-1">
          <label class="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 transition-colors">
            <CameraIcon class="w-5 h-5" />
            <span>Selecionar foto</span>
            <input type="file" accept="image/*" class="hidden" @change="onPhotoChange" />
          </label>
          <p class="text-xs text-gray-500 mt-2">JPG ou PNG. Opcional.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-2">Nome do produto *</label>
          <input v-model="form.name" type="text" required class="input" placeholder="Ex: Collant, Sapatilha Capezio" />
          <p class="text-xs text-gray-500 mt-1">Use o mesmo nome para variações de tamanho. Ex: todos os collants com nome "Collant".</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
          <select v-model="form.categoryCode" class="input" @change="onCategoryChange">
            <option value="">Selecione...</option>
            <option v-for="cat in categoryOptions" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
          </select>
        </div>

        <div>
          <label class="flex items-center mt-8">
            <input v-model="form.active" type="checkbox" class="rounded border-gray-300 text-green-600 focus:ring-green-500" />
            <span class="ml-2 text-sm text-gray-700">Produto ativo (disponível para venda)</span>
          </label>
        </div>

        <template v-if="selectedCategoryFields.length">
          <div
            v-for="field in selectedCategoryFields"
            :key="field.key"
            class="md:col-span-1"
          >
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ field.label }}
              <span class="text-gray-400 font-normal">(opcional)</span>
            </label>
            <select
              v-if="field.options.length"
              v-model="form.attributes[field.key]"
              class="input"
            >
              <option value="">Selecione...</option>
              <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
            </select>
            <input
              v-else
              v-model="form.attributes[field.key]"
              type="text"
              class="input"
              :placeholder="fieldPlaceholder(field)"
            />
          </div>
        </template>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Valor (R$) *</label>
          <input v-model.number="form.price" type="number" min="0" step="0.01" required class="input" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Quantidade em estoque *</label>
          <input v-model.number="form.stockQuantity" type="number" min="0" step="1" required class="input" />
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
          <textarea v-model="form.description" rows="3" class="input" placeholder="Detalhes adicionais..."></textarea>
        </div>
      </div>

      <div class="flex gap-4">
        <button type="submit" :disabled="loading" class="btn-primary disabled:opacity-50">
          {{ loading ? 'Salvando...' : 'Salvar' }}
        </button>
        <router-link to="/produtos" class="btn-secondary">Cancelar</router-link>
      </div>
    </form>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductStore } from '../../stores/product'
import { useItemCategoryStore } from '../../stores/itemCategory'
import { ShoppingBagIcon, CameraIcon } from '@heroicons/vue/24/outline'
import AppLoading from '../../components/common/AppLoading.vue'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const categoryStore = useItemCategoryStore()
const loading = ref(false)
const pageLoading = ref(false)
const error = ref(null)
const photoFile = ref(null)
const photoPreview = ref(null)
const currentPhotoUrl = ref(null)

const isEdit = computed(() => !!route.params.id && route.params.id !== 'novo')
const categoryOptions = computed(() => categoryStore.options())

const selectedCategory = computed(() =>
  form.value.categoryCode ? categoryStore.getCategoryOption(form.value.categoryCode) : null
)
const selectedCategoryFields = computed(() => selectedCategory.value?.attributeFields || [])

const form = ref({
  name: '',
  price: 0,
  stockQuantity: 0,
  categoryCode: '',
  attributes: {},
  description: '',
  active: true
})

function fieldPlaceholder(field) {
  if (field.type === 'numeric') return 'Ex: 32, 48'
  return 'Ex: P, M, G, 10/12, 10'
}

function onCategoryChange() {
  const fields = selectedCategoryFields.value
  const next = {}
  for (const field of fields) {
    next[field.key] = form.value.attributes[field.key] || ''
  }
  form.value.attributes = next
}

onMounted(async () => {
  pageLoading.value = true
  try {
    await categoryStore.load()
    if (isEdit.value) {
      const product = await productStore.getProductById(route.params.id)
      const attrs = product.get('attributes') || {}
      form.value = {
        name: product.get('name') || '',
        price: Number(product.get('price')) || 0,
        stockQuantity: Number(product.get('stockQuantity')) || 0,
        categoryCode: product.get('categoryCode') || product.get('category') || '',
        attributes: { ...attrs },
        description: product.get('description') || '',
        active: product.get('active') !== false
      }
      onCategoryChange()
      const photo = product.get('photo')
      if (photo) currentPhotoUrl.value = photo.url()
    } else {
      if (route.query.nome) form.value.name = String(route.query.nome)
      if (route.query.categoria) form.value.categoryCode = String(route.query.categoria)
      onCategoryChange()
    }
  } catch (err) {
    error.value = err.message || 'Erro ao carregar produto'
    router.push('/produtos')
  } finally {
    pageLoading.value = false
  }
})

function onPhotoChange(e) {
  const file = e.target.files?.[0]
  photoFile.value = file || null
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoPreview.value = file ? URL.createObjectURL(file) : null
  if (file) currentPhotoUrl.value = null
}

async function handleSubmit() {
  loading.value = true
  error.value = null
  try {
    const payload = {
      ...form.value,
      categoryAttributeFields: selectedCategoryFields.value
    }
    if (photoFile.value) payload.photo = photoFile.value
    if (isEdit.value) {
      await productStore.updateProduct(route.params.id, payload)
    } else {
      await productStore.createProduct(payload)
    }
    const groupQuery = form.value.categoryCode
      ? { path: '/produtos/grupo', query: { nome: form.value.name, categoria: form.value.categoryCode } }
      : { path: '/produtos' }
    router.push(groupQuery)
  } catch (err) {
    error.value = err.message || 'Erro ao salvar produto'
  } finally {
    loading.value = false
  }
}
</script>
