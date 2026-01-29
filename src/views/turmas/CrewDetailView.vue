<template>
  <div class="space-y-6 pb-20 md:pb-6">
      <div v-if="loading" class="card text-center py-12">
        <p class="text-gray-600">Carregando...</p>
      </div>

      <div v-else-if="crew">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{{ crew.get('Name') }}</h1>
            <p class="text-gray-600 mt-1">{{ crew.get('Key') }}</p>
          </div>
          <router-link
            v-if="authStore.isMaster"
            :to="`/turmas/${crew.id}/edit`"
            class="btn-secondary mt-4 md:mt-0"
          >
            Editar Turma
          </router-link>
        </div>

        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Informações da Turma</h2>
          <dl class="space-y-3">
            <div>
              <dt class="text-sm font-medium text-gray-500">Nome</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ crew.get('Name') }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Horário</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ crew.get('Key') }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Status</dt>
              <dd class="mt-1">
                <span
                  :class="crew.get('Active') ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                  class="px-2 py-1 text-xs font-medium rounded-full"
                >
                  {{ crew.get('Active') ? 'Ativa' : 'Inativa' }}
                </span>
              </dd>
            </div>
            <div v-if="teacher">
              <dt class="text-sm font-medium text-gray-500">Professora</dt>
              <dd class="mt-1">
                <router-link :to="`/professores/${teacher.id}`" class="text-green-600 hover:underline">
                  {{ teacher.get('username') }} <span v-if="teacher.get('email')" class="text-gray-500">({{ teacher.get('email') }})</span>
                </router-link>
              </dd>
            </div>
          </dl>
        </div>

        <!-- Alunas Vinculadas -->
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Alunas Vinculadas</h2>
          
          <div v-if="studentsLoading" class="text-center py-8">
            <p class="text-gray-600">Carregando alunas...</p>
          </div>
          
          <div v-else-if="students.length === 0" class="text-center py-8">
            <p class="text-gray-600">Nenhuma aluna vinculada a esta turma</p>
          </div>
          
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="student in students"
              :key="student.id"
              class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              @click="$router.push(`/alunos/${student.id}`)"
            >
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <img
                    v-if="getPhotoUrl(student)"
                    :src="getPhotoUrl(student)"
                    :alt="student.get('name')"
                    class="w-full h-full object-cover"
                  />
                  <UserCircleIcon v-else class="w-8 h-8 text-gray-400" />
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-gray-900 truncate">{{ student.get('name') }}</h3>
                  <p class="text-sm text-gray-600">
                    {{ formatDate(student.get('birthday')) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCrewStore } from '../../stores/crew'
import { useAuthStore } from '../../stores/auth'
import { crewService, teacherService } from '../../services/index.js'
import { UserCircleIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const crewStore = useCrewStore()
const authStore = useAuthStore()
const crew = ref(null)
const teacher = ref(null)
const students = ref([])
const loading = ref(true)
const studentsLoading = ref(false)

function formatDate(date) {
  if (!date) return 'Não informado'
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return 'Não informado'
  return d.toLocaleDateString('pt-BR')
}

function getPhotoUrl(student) {
  const photo = student.get('photo')
  return photo ? photo.url() : null
}

onMounted(async () => {
  try {
    crew.value = await crewStore.getCrewById(route.params.id)
    const tid = crew.value.get('teacherId')
    if (tid) {
      try { teacher.value = await teacherService.getTeacherById(tid) } catch (_) {}
    }
    studentsLoading.value = true
    students.value = await crewService.getStudentsByCrew(route.params.id)
  } catch (error) {
    console.error('Error loading crew:', error)
    router.push('/turmas')
  } finally {
    loading.value = false
    studentsLoading.value = false
  }
})
</script>
