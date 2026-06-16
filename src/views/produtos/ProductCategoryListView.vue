<template>
  <div class="space-y-6 pb-20 md:pb-6">
    <AppLoading v-if="pageLoading" card message="Carregando categorias..." />

    <template v-else>
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <router-link to="/produtos" class="text-sm text-green-600 hover:underline">← Voltar aos produtos</router-link>
          <h1 class="text-2xl font-bold text-gray-900 mt-2">Categorias de produto</h1>
          <p class="text-gray-600 mt-1">Configure categorias e os campos solicitados no cadastro</p>
        </div>
        <div class="flex gap-2 mt-4 md:mt-0">
          <button type="button" class="btn-primary" @click="openForm()">Nova categoria</button>
        </div>
      </div>

      <div v-if="!categoryStore.loading" class="card overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campos solicitados</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="cat in categoryStore.categories" :key="cat.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm">
                <p class="font-medium text-gray-900">{{ cat.get('label') }}</p>
                <p class="text-xs text-gray-500">{{ cat.get('code') }}</p>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                <div v-if="getFields(cat).length" class="flex flex-wrap gap-1">
                  <span
                    v-for="field in getFields(cat)"
                    :key="field.key"
                    class="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800"
                  >
                    {{ field.label }} ({{ fieldTypeLabel(field.type) }})
                  </span>
                </div>
                <span v-else class="text-xs text-gray-400">Nenhum campo configurado</span>
              </td>
              <td class="px-4 py-3 text-sm">
                <span
                  :class="cat.get('active') !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'"
                  class="px-2 py-0.5 text-xs font-medium rounded-full"
                >
                  {{ cat.get('active') !== false ? 'Ativa' : 'Inativa' }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-right whitespace-nowrap">
                <button type="button" class="text-green-600 hover:underline mr-3" @click="openForm(cat)">Editar</button>
                <button type="button" class="text-red-600 hover:underline" @click="toDelete = cat">Excluir</button>
              </td>
            </tr>
            <tr v-if="categoryStore.categories.length === 0">
              <td colspan="4" class="px-4 py-6 text-sm text-gray-500 text-center">Nenhuma categoria cadastrada.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <AppLoading v-else card message="Atualizando categorias..." />
    </template>

    <div v-if="formOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" @click.self="closeForm">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ editing ? 'Editar categoria' : 'Nova categoria' }}</h3>
        <div v-if="formError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {{ formError }}
        </div>
        <form class="space-y-4" @submit.prevent="saveForm">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input v-model="form.label" type="text" required class="input" placeholder="Ex: Roupas" />
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm font-medium text-gray-700">Informações solicitadas</p>
              <button type="button" class="text-sm text-green-600 hover:underline" @click="addField">+ Adicionar campo</button>
            </div>
            <p class="text-xs text-gray-500 mb-3">
              Campos exibidos ao cadastrar produtos desta categoria. Não são obrigatórios, mas serão pedidos.
            </p>
            <div v-if="form.attributeFields.length === 0" class="text-sm text-gray-400 border border-dashed rounded-lg p-4 text-center">
              Nenhum campo. Ex: Tamanho texto livre (P, M, G, 10/12) ou numérico (28, 32, 48).
            </div>
            <div v-for="(field, index) in form.attributeFields" :key="index" class="border rounded-lg p-4 mb-3 space-y-3">
              <div class="flex items-start justify-between gap-2">
                <p class="text-sm font-medium text-gray-700">Campo {{ index + 1 }}</p>
                <button type="button" class="text-red-600 text-sm hover:underline" @click="removeField(index)">Remover</button>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Nome do campo *</label>
                  <input v-model="field.label" type="text" required class="input" placeholder="Ex: Tamanho" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Tipo *</label>
                  <select v-model="field.type" class="input">
                    <option value="alphanumeric">Texto livre (P, M, G, 10/12, 10)</option>
                    <option value="numeric">Numérico (28, 32, 48)</option>
                    <option value="text">Texto livre</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Opções sugeridas (opcional)</label>
                <input
                  v-model="field.optionsText"
                  type="text"
                  class="input"
                  placeholder="Separe por vírgula. Ex: P, M, G, GG ou 28, 30, 32, 34"
                />
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
            <input v-model.number="form.sortOrder" type="number" min="0" class="input w-32" />
          </div>
          <label v-if="editing" class="flex items-center gap-2 text-sm text-gray-700">
            <input v-model="form.active" type="checkbox" class="rounded text-green-600" />
            Categoria ativa
          </label>
          <div class="flex gap-3 pt-2">
            <button type="submit" :disabled="saving" class="btn-primary flex-1 disabled:opacity-50">
              {{ saving ? 'Salvando...' : 'Salvar' }}
            </button>
            <button type="button" class="btn-secondary flex-1" @click="closeForm">Cancelar</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="toDelete" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" @click.self="toDelete = null">
      <div class="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
        <p class="text-gray-700">Excluir a categoria <strong>{{ toDelete.get('label') }}</strong>?</p>
        <div class="flex gap-3 mt-6">
          <button type="button" class="btn-primary flex-1" @click="doDelete">Excluir</button>
          <button type="button" class="btn-secondary flex-1" @click="toDelete = null">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useItemCategoryStore } from '../../stores/itemCategory'
import { normalizeAttributeFields } from '../../utils/itemCategories'
import AppLoading from '../../components/common/AppLoading.vue'

const categoryStore = useItemCategoryStore()
const pageLoading = ref(true)
const formOpen = ref(false)
const editing = ref(null)
const saving = ref(false)
const formError = ref(null)
const toDelete = ref(null)

const form = ref({
  label: '',
  attributeFields: [],
  sortOrder: 99,
  active: true
})

function fieldTypeLabel(type) {
  if (type === 'numeric') return 'numérico'
  if (type === 'alphanumeric') return 'texto livre'
  return 'texto'
}

function getFields(cat) {
  return normalizeAttributeFields(cat.get('attributeFields'))
}

function fieldsToForm(fields) {
  return normalizeAttributeFields(fields).map((f) => ({
    label: f.label,
    type: f.type,
    optionsText: f.options.join(', ')
  }))
}

function formToFields(fields) {
  return fields.map((f) => ({
    label: f.label,
    type: f.type,
    options: String(f.optionsText || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean)
  }))
}

function addField() {
  form.value.attributeFields.push({ label: '', type: 'alphanumeric', optionsText: '' })
}

function removeField(index) {
  form.value.attributeFields.splice(index, 1)
}

function openForm(category = null) {
  editing.value = category
  formError.value = null
  if (category) {
    form.value = {
      label: category.get('label') || '',
      attributeFields: fieldsToForm(category.get('attributeFields')),
      sortOrder: category.get('sortOrder') ?? 99,
      active: category.get('active') !== false
    }
  } else {
    form.value = {
      label: '',
      attributeFields: [],
      sortOrder: 99,
      active: true
    }
  }
  formOpen.value = true
}

function closeForm() {
  formOpen.value = false
  editing.value = null
  formError.value = null
}

async function saveForm() {
  formError.value = null
  saving.value = true
  try {
    const payload = {
      label: form.value.label,
      attributeFields: formToFields(form.value.attributeFields),
      sortOrder: form.value.sortOrder,
      active: form.value.active
    }
    if (editing.value) {
      await categoryStore.updateCategory(editing.value.id, payload)
    } else {
      await categoryStore.createCategory(payload)
    }
    closeForm()
  } catch (err) {
    formError.value = err?.message || 'Erro ao salvar categoria'
  } finally {
    saving.value = false
  }
}

async function doDelete() {
  if (!toDelete.value) return
  try {
    await categoryStore.deleteCategory(toDelete.value.id)
    toDelete.value = null
  } catch (err) {
    formError.value = err?.message || 'Erro ao excluir categoria'
    toDelete.value = null
  }
}

onMounted(async () => {
  try {
    await categoryStore.load()
  } finally {
    pageLoading.value = false
  }
})
</script>
