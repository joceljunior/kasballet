<template>
  <div class="space-y-6 pb-20 md:pb-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Turmas</h1>
          <p class="text-gray-600 mt-1">Gerencie as turmas da escola</p>
        </div>
        <div class="flex items-center gap-4 mt-4 md:mt-0">
          <!-- Toggle de visualização (apenas desktop) -->
          <div v-if="!isMobile" class="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              @click="viewMode = 'grid'"
              :class="viewMode === 'grid' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600'"
              class="p-2 rounded-md transition-all"
              title="Visualização em grade"
            >
              <Squares2X2Icon class="w-5 h-5" />
            </button>
            <button
              @click="viewMode = 'list'"
              :class="viewMode === 'list' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600'"
              class="p-2 rounded-md transition-all"
              title="Visualização em lista"
            >
              <ListBulletIcon class="w-5 h-5" />
            </button>
          </div>
          <router-link v-if="authStore.isMaster" to="/turmas/nova" class="btn-primary">
            Nova Turma
          </router-link>
        </div>
      </div>

      <!-- Filtro -->
      <div class="card">
        <div class="flex justify-end">
          <select v-model="activeFilter" @change="handleFilter" class="input w-full sm:w-48">
            <option value="">Todas</option>
            <option value="true">Ativas</option>
            <option value="false">Inativas</option>
          </select>
        </div>
      </div>

      <div v-if="crewStore.loading && crewStore.crews.length === 0" class="card text-center py-12">
        <p class="text-gray-600">Carregando...</p>
      </div>

      <div v-else-if="crewStore.crews.length === 0" class="card text-center py-12">
        <AcademicCapIcon class="h-12 w-12 mx-auto text-gray-400" />
        <p class="mt-4 text-gray-600">Nenhuma turma encontrada</p>
      </div>

      <!-- Visualização em Grade -->
      <div v-else-if="viewMode === 'grid' || isMobile" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="crew in crewStore.crews"
          :key="crew.id"
          class="card hover:shadow-lg transition-shadow cursor-pointer"
          @click="$router.push(`/turmas/${crew.id}`)"
        >
          <h3 class="font-semibold text-gray-900">{{ crew.get('Name') }}</h3>
          <p class="text-sm text-gray-600 mt-1">{{ crew.get('Key') }}</p>
          <p class="text-sm text-pink-500 mt-1">{{ getTeacherName(crew) }}</p>
          <span
            :class="crew.get('Active') ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
            class="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full"
          >
            {{ crew.get('Active') ? 'Ativa' : 'Inativa' }}
          </span>
        </div>
      </div>

      <!-- Visualização em Lista -->
      <div v-else class="card">
        <div class="divide-y divide-gray-200">
          <div
            v-for="crew in crewStore.crews"
            :key="crew.id"
            class="p-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between"
            @click="$router.push(`/turmas/${crew.id}`)"
          >
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900">{{ crew.get('Name') }}</h3>
              <p class="text-sm text-gray-600 mt-1">{{ crew.get('Key') }}</p>
              <p class="text-sm text-pink-500 mt-1">{{ getTeacherName(crew) }}</p>
            </div>
            <span
              :class="crew.get('Active') ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
              class="px-3 py-1 text-xs font-medium rounded-full"
            >
              {{ crew.get('Active') ? 'Ativa' : 'Inativa' }}
            </span>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useCrewStore } from '../../stores/crew'
import { useAuthStore } from '../../stores/auth'
import { teacherService } from '../../services/index.js'
import { AcademicCapIcon, Squares2X2Icon, ListBulletIcon } from '@heroicons/vue/24/outline'

const crewStore = useCrewStore()
const authStore = useAuthStore()
const viewMode = ref('grid')
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 768)
const activeFilter = ref('')
const teacherMap = ref({}) // teacherId -> _User

const isMobile = computed(() => windowWidth.value < 768)

function getTeacherName(crew) {
  const tid = crew.get('teacherId')
  if (!tid) return '—'
  const t = teacherMap.value[tid]
  return t?.get('username') || '—'
}

function handleResize() {
  if (typeof window === 'undefined') return
  windowWidth.value = window.innerWidth
  if (isMobile.value) viewMode.value = 'grid'
}

function handleFilter() {
  const filters = {}
  if (activeFilter.value === 'true') filters.active = true
  else if (activeFilter.value === 'false') filters.active = false
  crewStore.setFilters(filters)
}

onMounted(async () => {
  handleFilter()
  try {
    const teachers = await teacherService.getTeachers()
    const map = {}
    for (const t of teachers) map[t.id] = t
    teacherMap.value = map
  } catch (_) {}
  if (typeof window !== 'undefined') window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (typeof window !== 'undefined') window.removeEventListener('resize', handleResize)
})
</script>
