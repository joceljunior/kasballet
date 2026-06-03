<template>
  <div class="space-y-6 pb-20 md:pb-6">
    <AppLoading v-if="pageLoading" card message="Carregando categorias..." />

    <template v-else>
    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Categorias financeiras</h1>
        <p class="text-gray-600 mt-1">Cadastre os tipos de entrada e saída usados nos lançamentos</p>
      </div>
      <div class="flex gap-2 mt-4 md:mt-0">
        <router-link to="/financeiro" class="btn-secondary">Voltar</router-link>
        <button type="button" class="btn-primary" @click="openForm()">Nova categoria</button>
      </div>
    </div>

    <template v-if="!categoryStore.loading">
      <section v-for="section in sections" :key="section.type" class="card">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ section.title }}</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Regras</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="cat in section.items" :key="cat.id" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm">
                  <p class="font-medium text-gray-900">{{ cat.get('label') }}</p>
                  <p class="text-xs text-gray-500">{{ cat.get('code') }}</p>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">
                  <div class="flex flex-wrap gap-1">
                    <span v-if="cat.get('requiresStudent')" class="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">Aluna</span>
                    <span v-if="cat.get('requiresTeacher')" class="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800">Professora</span>
                    <span v-if="cat.get('requiresDescription')" class="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800">Descrição</span>
                    <span v-if="cat.get('systemBehavior')" class="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">Sistema</span>
                    <span v-if="!cat.get('requiresStudent') && !cat.get('requiresTeacher') && !cat.get('requiresDescription')" class="text-xs text-gray-400">—</span>
                  </div>
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
                  <button
                    v-if="!cat.get('systemBehavior')"
                    type="button"
                    class="text-red-600 hover:underline"
                    @click="toDelete = cat"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
              <tr v-if="section.items.length === 0">
                <td colspan="4" class="px-4 py-6 text-sm text-gray-500 text-center">Nenhuma categoria cadastrada.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <AppLoading v-else-if="categoryStore.loading" card message="Atualizando categorias..." />
    </template>

    <!-- Form modal -->
    <div v-if="formOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" @click.self="closeForm">
      <div class="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ editing ? 'Editar categoria' : 'Nova categoria' }}</h3>
        <div v-if="formError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {{ formError }}
        </div>
        <form class="space-y-4" @submit.prevent="saveForm">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <select v-model="form.type" :disabled="!!editing" required class="input disabled:bg-gray-100">
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input v-model="form.label" type="text" required class="input" placeholder="Ex: Uniforme" />
          </div>
          <div class="space-y-2">
            <p class="text-sm font-medium text-gray-700">Regras do lançamento</p>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input v-model="form.requiresStudent" type="checkbox" class="rounded text-green-600" />
              Exige seleção de aluna
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input v-model="form.requiresTeacher" type="checkbox" class="rounded text-green-600" />
              Exige seleção de professora
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input v-model="form.requiresDescription" type="checkbox" class="rounded text-green-600" />
              Exige descrição
            </label>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
            <input v-model.number="form.sortOrder" type="number" min="0" class="input w-32" />
          </div>
          <label v-if="editing" class="flex items-center gap-2 text-sm text-gray-700">
            <input v-model="form.active" type="checkbox" class="rounded text-green-600" />
            Categoria ativa
          </label>
          <p v-if="editing?.get('systemBehavior')" class="text-xs text-gray-500">
            Categoria do sistema: usada em automações (mensalidades, contratos etc.). O nome e as regras principais não devem ser alterados sem cuidado.
          </p>
          <div class="flex gap-3 pt-2">
            <button type="submit" :disabled="saving" class="btn-primary flex-1 disabled:opacity-50">
              {{ saving ? 'Salvando...' : 'Salvar' }}
            </button>
            <button type="button" class="btn-secondary flex-1" @click="closeForm">Cancelar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete confirm -->
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
import { ref, computed, onMounted } from 'vue'
import { useFinancialCategoryStore } from '../../stores/financialCategory'
import AppLoading from '../../components/common/AppLoading.vue'

const categoryStore = useFinancialCategoryStore()
const pageLoading = ref(true)
const formOpen = ref(false)
const editing = ref(null)
const saving = ref(false)
const formError = ref(null)
const toDelete = ref(null)

const form = ref({
  type: 'entrada',
  label: '',
  requiresStudent: false,
  requiresTeacher: false,
  requiresDescription: false,
  sortOrder: 99,
  active: true
})

const sections = computed(() => [
  {
    type: 'entrada',
    title: 'Entradas',
    items: categoryStore.categories.filter((c) => c.get('type') === 'entrada')
  },
  {
    type: 'saida',
    title: 'Saídas',
    items: categoryStore.categories.filter((c) => c.get('type') === 'saida')
  }
])

function openForm(category = null) {
  editing.value = category
  formError.value = null
  if (category) {
    form.value = {
      type: category.get('type'),
      label: category.get('label') || '',
      requiresStudent: !!category.get('requiresStudent'),
      requiresTeacher: !!category.get('requiresTeacher'),
      requiresDescription: !!category.get('requiresDescription'),
      sortOrder: category.get('sortOrder') ?? 99,
      active: category.get('active') !== false
    }
  } else {
    form.value = {
      type: 'entrada',
      label: '',
      requiresStudent: false,
      requiresTeacher: false,
      requiresDescription: false,
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
      type: form.value.type,
      label: form.value.label,
      requiresStudent: form.value.requiresStudent,
      requiresTeacher: form.value.requiresTeacher,
      requiresDescription: form.value.requiresDescription,
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
