<template>
  <div class="space-y-6 pb-20 md:pb-6">
    <AppLoading v-if="pageLoading" card message="Carregando produto..." />

    <template v-else>
    <h1 class="text-2xl font-bold text-gray-900">{{ isEdit ? 'Editar Produto' : 'Novo Produto' }}</h1>

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
          <input v-model="form.name" type="text" required class="input" placeholder="Ex: Sapatilha Capezio tamanho 35" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Valor (R$) *</label>
          <input v-model.number="form.price" type="number" min="0" step="0.01" required class="input" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Quantidade em estoque *</label>
          <input v-model.number="form.stockQuantity" type="number" min="0" step="1" required class="input" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
          <input v-model="form.category" type="text" class="input" list="product-categories" placeholder="Ex: Sapatilhas" />
          <datalist id="product-categories">
            <option v-for="cat in categories" :key="cat" :value="cat" />
          </datalist>
        </div>

        <div>
          <label class="flex items-center mt-8">
            <input v-model="form.active" type="checkbox" class="rounded border-gray-300 text-green-600 focus:ring-green-500" />
            <span class="ml-2 text-sm text-gray-700">Produto ativo (disponível para venda)</span>
          </label>
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
          <textarea v-model="form.description" rows="3" class="input" placeholder="Detalhes, tamanhos, cores..."></textarea>
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
import { ShoppingBagIcon, CameraIcon } from '@heroicons/vue/24/outline'
import AppLoading from '../../components/common/AppLoading.vue'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const loading = ref(false)
const pageLoading = ref(false)
const error = ref(null)
const photoFile = ref(null)
const photoPreview = ref(null)
const currentPhotoUrl = ref(null)

const categories = ['Sapatilhas', 'Roupas', 'Mochilas', 'Acessórios', 'Outros']
const isEdit = computed(() => !!route.params.id && route.params.id !== 'novo')

const form = ref({
  name: '',
  price: 0,
  stockQuantity: 0,
  category: '',
  description: '',
  active: true
})

onMounted(async () => {
  if (isEdit.value) {
    pageLoading.value = true
    try {
      const product = await productStore.getProductById(route.params.id)
      form.value = {
        name: product.get('name') || '',
        price: Number(product.get('price')) || 0,
        stockQuantity: Number(product.get('stockQuantity')) || 0,
        category: product.get('category') || '',
        description: product.get('description') || '',
        active: product.get('active') !== false
      }
      const photo = product.get('photo')
      if (photo) currentPhotoUrl.value = photo.url()
    } catch (err) {
      error.value = err.message || 'Erro ao carregar produto'
      router.push('/produtos')
    } finally {
      pageLoading.value = false
    }
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
    const payload = { ...form.value }
    if (photoFile.value) payload.photo = photoFile.value
    if (isEdit.value) {
      await productStore.updateProduct(route.params.id, payload)
    } else {
      await productStore.createProduct(payload)
    }
    router.push('/produtos')
  } catch (err) {
    error.value = err.message || 'Erro ao salvar produto'
  } finally {
    loading.value = false
  }
}
</script>
