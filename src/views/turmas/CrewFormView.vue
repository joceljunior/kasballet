<template>
  <div class="space-y-6 pb-20 md:pb-6">
      <AppLoading v-if="pageLoading" card message="Carregando turma..." />

      <template v-else>
      <h1 class="text-2xl font-bold text-gray-900">{{ isEdit ? 'Editar Turma' : 'Nova Turma' }}</h1>

      <form @submit.prevent="handleSubmit" class="card space-y-6">
        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {{ error }}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Nome da Turma *</label>
            <input v-model="form.Name" type="text" required class="input" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Horário *</label>
            <input v-model="form.Key" type="text" required class="input" placeholder="Ex: Segunda 19h" />
          </div>

          <div v-if="authStore.isMaster" class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">Professora</label>
            <select v-model="form.teacherId" class="input md:max-w-md">
              <option value="">Nenhuma</option>
              <option v-for="t in teachers" :key="t.id" :value="t.id">
                {{ t.get('username') }}{{ t.get('email') ? ` (${t.get('email')})` : '' }}{{ t.get('active') === false ? ' — Inativa' : '' }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Nº Máximo de Alunas</label>
            <input v-model.number="form.maxStudents" type="number" min="1" class="input" placeholder="Ex: 12" />
          </div>

          <div>
            <label class="flex items-center">
              <input v-model="form.Active" type="checkbox" class="rounded border-gray-300 text-green-600 focus:ring-green-500" />
              <span class="ml-2 text-sm text-gray-700">Turma Ativa</span>
            </label>
          </div>
        </div>

        <div class="flex gap-4">
          <button type="submit" :disabled="loading" class="btn-primary disabled:opacity-50">
            {{ loading ? 'Salvando...' : 'Salvar' }}
          </button>
          <router-link :to="isEdit ? `/turmas/${route.params.id}` : '/turmas'" class="btn-secondary">
            Cancelar
          </router-link>
        </div>
      </form>
      </template>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCrewStore } from '../../stores/crew'
import { useAuthStore } from '../../stores/auth'
import { teacherService } from '../../services/index.js'
import AppLoading from '../../components/common/AppLoading.vue'

const route = useRoute()
const router = useRouter()
const crewStore = useCrewStore()
const authStore = useAuthStore()
const loading = ref(false)
const pageLoading = ref(false)
const error = ref(null)
const teachers = ref([])

const isEdit = computed(() => !!route.params.id && route.params.id !== 'nova')

const form = ref({
  Name: '',
  Key: '',
  Active: true,
  teacherId: '',
  maxStudents: null
})

onMounted(async () => {
  if (authStore.isMaster) {
    try { teachers.value = await teacherService.getTeachers() } catch (_) {}
  }
  if (isEdit.value) {
    pageLoading.value = true
    try {
      const crew = await crewStore.getCrewById(route.params.id)
      form.value = {
        Name: crew.get('Name') || '',
        Key: crew.get('Key') || '',
        Active: crew.get('Active') !== undefined ? crew.get('Active') : true,
        teacherId: crew.get('teacherId') || '',
        maxStudents: crew.get('maxStudents') || null
      }
    } catch (err) {
      error.value = err.message || 'Erro ao carregar turma'
      router.push('/turmas')
    } finally {
      pageLoading.value = false
    }
  }
})

function getPayload() {
  const p = { ...form.value }
  p.teacherId = p.teacherId || null
  p.maxStudents = p.maxStudents ? Number(p.maxStudents) : null
  return p
}

async function handleSubmit() {
  loading.value = true
  error.value = null

  try {
    const payload = getPayload()
    if (isEdit.value) {
      await crewStore.updateCrew(route.params.id, payload)
      router.push(`/turmas/${route.params.id}`)
    } else {
      const crew = await crewStore.createCrew(payload)
      router.push(`/turmas/${crew.id}`)
    }
  } catch (err) {
    error.value = err.message || (isEdit.value ? 'Erro ao atualizar turma' : 'Erro ao criar turma')
  } finally {
    loading.value = false
  }
}
</script>
