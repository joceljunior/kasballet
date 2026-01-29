<template>
  <div class="space-y-6 pb-20 md:pb-6">
    <h1 class="text-2xl font-bold text-gray-900">{{ isEdit ? 'Editar Professora' : 'Nova Professora' }}</h1>

    <form @submit.prevent="handleSubmit" class="card space-y-6">
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {{ error }}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Usuário (login) *</label>
          <input
            v-model="form.username"
            type="text"
            required
            class="input"
            :readonly="isEdit"
          />
          <p v-if="isEdit" class="text-xs text-gray-500 mt-1">Não é possível alterar o usuário.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">E-mail *</label>
          <input v-model="form.email" type="email" required class="input" placeholder="ex: professora@escola.com" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ isEdit ? 'Nova senha (deixe em branco para não alterar)' : 'Senha *' }}</label>
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            :required="!isEdit"
            class="input"
            :placeholder="isEdit ? '••••••••' : ''"
          />
        </div>

        <div v-if="isEdit" class="flex items-center pt-8">
          <label class="flex items-center">
            <input v-model="showPassword" type="checkbox" class="rounded border-gray-300 text-green-600 focus:ring-green-500" />
            <span class="ml-2 text-sm text-gray-700">Mostrar senha</span>
          </label>
        </div>

        <div>
          <label class="flex items-center">
            <input v-model="form.active" type="checkbox" class="rounded border-gray-300 text-green-600 focus:ring-green-500" />
            <span class="ml-2 text-sm text-gray-700">Professora ativa</span>
          </label>
          <p class="text-xs text-gray-500 mt-1">Ao inativar, os vínculos com as turmas são removidos. Para reativar, é necessário vincular a pelo menos uma turma.</p>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Turmas</label>
        <p class="text-sm text-gray-500 mb-2">
          Ao criar, é obrigatório vincular a pelo menos uma turma. Se inativa, não pode ter turmas.
          Para reativar, vincule a pelo menos uma turma.
        </p>
        <div class="border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto" :class="{ 'opacity-60 pointer-events-none': !form.active }">
          <label v-for="c in allCrews" :key="c.id" class="flex items-center py-2">
            <input
              v-model="form.crewIds"
              :value="c.id"
              type="checkbox"
              :disabled="!form.active"
              class="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span class="ml-2 text-sm">{{ c.get('Name') }} – {{ c.get('Key') }}</span>
          </label>
          <p v-if="allCrews.length === 0" class="text-sm text-gray-500">Nenhuma turma cadastrada.</p>
        </div>
      </div>

      <div class="flex gap-4">
        <button type="submit" :disabled="loading" class="btn-primary disabled:opacity-50">
          {{ loading ? 'Salvando...' : 'Salvar' }}
        </button>
        <router-link :to="isEdit ? `/professores/${route.params.id}` : '/professores'" class="btn-secondary">
          Cancelar
        </router-link>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTeacherStore } from '../../stores/teacher'
import { crewService } from '../../services/index.js'

const route = useRoute()
const router = useRouter()
const teacherStore = useTeacherStore()
const loading = ref(false)
const error = ref(null)
const showPassword = ref(false)
const allCrews = ref([])

const isEdit = computed(() => !!route.params.id && route.params.id !== 'novo')

const form = ref({
  username: '',
  email: '',
  password: '',
  active: true,
  crewIds: []
})

onMounted(async () => {
  try {
    allCrews.value = await crewService.getCrews(0, 500, {})
  } catch (_) {}

  if (isEdit.value) {
    try {
      loading.value = true
      const t = await teacherStore.getTeacherById(route.params.id)
      const crews = await crewService.getCrewsByTeacher(route.params.id, 0, 500, {})
      const rawEmail = t.get('email')
      form.value = {
        username: t.get('username') || '',
        email: (rawEmail != null && String(rawEmail).trim() !== '') ? String(rawEmail).trim() : '',
        password: '',
        active: t.get('active') !== false,
        crewIds: crews.map((c) => c.id)
      }
    } catch (err) {
      error.value = err.message || 'Erro ao carregar professora'
      router.push('/professores')
    } finally {
      loading.value = false
    }
  }
})

watch(() => form.value.active, (isActive) => {
  if (!isActive) form.value.crewIds = []
})

async function handleSubmit() {
  error.value = null
  const em = (form.value.email != null && typeof form.value.email === 'string') ? String(form.value.email).trim() : ''
  if (em === '') {
    error.value = 'E-mail é obrigatório.'
    return
  }
  if (form.value.active && form.value.crewIds.length === 0) {
    error.value = 'Vincule a professora a pelo menos uma turma. (Obrigatório ao criar; para reativar, ao menos uma.)'
    return
  }
  if (!form.value.active && form.value.crewIds.length > 0) {
    error.value = 'Se a professora é inativa, não pode estar vinculada a turmas.'
    return
  }
  loading.value = true

  try {
    if (isEdit.value) {
      await teacherStore.updateTeacher(route.params.id, {
        email: form.value.email,
        password: form.value.password || undefined,
        active: form.value.active,
        crewIds: form.value.crewIds
      })
      router.push(`/professores/${route.params.id}`)
    } else {
      const t = await teacherStore.createTeacher({
        username: form.value.username,
        email: form.value.email,
        password: form.value.password,
        active: form.value.active,
        crewIds: form.value.crewIds
      })
      router.push(`/professores/${t.id}`)
    }
  } catch (err) {
    const msg = err?.message || err?.error || (err && String(err))
    error.value = msg || (isEdit.value ? 'Erro ao atualizar professora' : 'Erro ao criar professora')
  } finally {
    loading.value = false
  }
}
</script>
