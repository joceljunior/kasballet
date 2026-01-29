<template>
  <div class="space-y-6 pb-20 md:pb-6">
    <h1 class="text-2xl font-bold text-gray-900">{{ isEdit ? 'Editar Chamada' : 'Nova Chamada' }}</h1>

    <form @submit.prevent="handleSubmit" class="card space-y-6">
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {{ error }}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Turma *</label>
          <select v-model="form.crewId" required class="input" :disabled="isEdit" @change="onCrewChange">
            <option value="">Selecione</option>
            <option v-for="c in crews" :key="c.id" :value="c.id">
              {{ c.get('Name') }} – {{ c.get('Key') }}
            </option>
          </select>
          <p v-if="isEdit" class="text-xs text-gray-500 mt-1">Não é possível alterar a turma.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Data *</label>
          <input v-model="form.dateregister" type="date" required class="input" />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Presença</label>
        <p class="text-sm text-gray-500 mb-2">Marque as alunas presentes. Alunas ativas da turma.</p>
        <div v-if="!form.crewId" class="text-sm text-gray-500 py-4">Selecione uma turma para carregar a lista.</div>
        <div v-else-if="studentsLoading" class="text-sm text-gray-500 py-4">Carregando alunas...</div>
        <div v-else-if="students.length === 0" class="text-sm text-gray-500 py-4">Nenhuma aluna ativa nesta turma.</div>
        <div v-else class="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-64 overflow-y-auto">
          <label
            v-for="s in students"
            :key="s.id"
            class="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer"
          >
            <input
              v-model="form.presents"
              :value="s.id"
              type="checkbox"
              class="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span class="ml-3 text-sm font-medium text-gray-900">{{ s.get('name') }}</span>
            <span class="ml-2 text-xs text-gray-500">{{ formatDate(s.get('birthday')) }}</span>
          </label>
        </div>
      </div>

      <div class="flex gap-4">
        <button type="submit" :disabled="loading || studentsLoading" class="btn-primary disabled:opacity-50">
          {{ loading ? 'Salvando...' : 'Salvar' }}
        </button>
        <router-link :to="isEdit ? `/chamadas/${route.params.id}` : '/chamadas'" class="btn-secondary">
          Cancelar
        </router-link>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRegisterStore } from '../../stores/register'
import { useAuthStore } from '../../stores/auth'
import { crewService } from '../../services/index.js'

const route = useRoute()
const router = useRouter()
const registerStore = useRegisterStore()
const authStore = useAuthStore()
const loading = ref(false)
const error = ref(null)
const studentsLoading = ref(false)
const crews = ref([])
const students = ref([])

const isEdit = computed(() => !!route.params.id && route.params.id !== 'nova')

const form = ref({
  crewId: '',
  dateregister: '',
  presents: [] // array de studentId marcados como presente
})

function formatDate(d) {
  if (!d) return ''
  const x = d instanceof Date ? d : new Date(d)
  return isNaN(x.getTime()) ? '' : x.toLocaleDateString('pt-BR')
}

function getDateInputValue(d) {
  if (!d) return ''
  const x = d instanceof Date ? d : new Date(d)
  if (isNaN(x.getTime())) return ''
  return x.toISOString().slice(0, 10)
}

async function onCrewChange() {
  form.value.presents = []
  if (!form.value.crewId) { students.value = []; return }
  studentsLoading.value = true
  try {
    students.value = await crewService.getStudentsByCrew(form.value.crewId)
  } catch (_) {
    students.value = []
  } finally {
    studentsLoading.value = false
  }
}

onMounted(async () => {
  try {
    if (authStore.isTeacher) {
      crews.value = await crewService.getCrewsByTeacher(authStore.user?.id, 0, 200, { active: true })
    } else {
      crews.value = await crewService.getCrews(0, 200, { active: true })
    }
  } catch (_) {}

  if (isEdit.value) {
    try {
      loading.value = true
      const reg = await registerStore.getRegisterById(route.params.id)
      const arr = reg.get('studentRegisters') || []
      const presentIds = arr.filter((x) => x && x.present === true).map((x) => x.studentId)
      form.value = {
        crewId: reg.get('crewId') || '',
        dateregister: getDateInputValue(reg.get('dateregister')),
        presents: []
      }
      await onCrewChange()
      form.value.presents = [...presentIds]
    } catch (err) {
      error.value = err.message || 'Erro ao carregar chamada'
      router.push('/chamadas')
    } finally {
      loading.value = false
    }
  }
})

async function handleSubmit() {
  if (!form.value.crewId || !form.value.dateregister) {
    error.value = 'Preencha turma e data.'
    return
  }
  loading.value = true
  error.value = null
  const presentSet = new Set(form.value.presents || [])
  const studentRegisters = students.value.map((s) => ({
    studentId: s.id,
    present: presentSet.has(s.id)
  }))

  try {
    const payload = {
      crewId: form.value.crewId,
      dateregister: form.value.dateregister,
      studentRegisters
    }
    if (isEdit.value) {
      await registerStore.updateRegister(route.params.id, payload)
      router.push(`/chamadas/${route.params.id}`)
    } else {
      const r = await registerStore.createRegister(payload)
      router.push(`/chamadas/${r.id}`)
    }
  } catch (err) {
    error.value = err?.message || (isEdit.value ? 'Erro ao atualizar chamada' : 'Erro ao criar chamada')
  } finally {
    loading.value = false
  }
}
</script>
