<template>
  <div class="space-y-6 pb-20 md:pb-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Professoras</h1>
        <p class="text-gray-600 mt-1">Professoras da escola</p>
      </div>
      <div class="flex items-center gap-3 mt-4 md:mt-0">
        <!-- Toggle grade/lista (apenas desktop) -->
        <div class="hidden md:flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
          <button
            type="button"
            :class="viewMode === 'grid' ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-700'"
            class="p-2 rounded-md"
            title="Grade"
            @click="viewMode = 'grid'"
          >
            <Squares2X2Icon class="w-5 h-5" />
          </button>
          <button
            type="button"
            :class="viewMode === 'list' ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-700'"
            class="p-2 rounded-md"
            title="Lista"
            @click="viewMode = 'list'"
          >
            <ListBulletIcon class="w-5 h-5" />
          </button>
        </div>
        <router-link v-if="authStore.isMaster" to="/professores/novo" class="btn-primary">
          Nova Professora
        </router-link>
      </div>
    </div>

    <div v-if="teacherStore.loading && teacherStore.teachers.length === 0" class="card text-center py-12">
      <p class="text-gray-600">Carregando...</p>
    </div>

    <div v-else-if="teacherStore.teachers.length === 0" class="card text-center py-12">
      <UserIcon class="h-12 w-12 mx-auto text-gray-400" />
      <p class="mt-4 text-gray-600">Nenhuma professora encontrada</p>
    </div>

    <!-- Grade -->
    <div v-else-if="viewMode === 'grid' || isMobile" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="teacher in teacherStore.teachers"
        :key="teacher.id"
        class="card hover:shadow-lg transition-shadow cursor-pointer"
        @click="$router.push(`/professores/${teacher.id}`)"
      >
        <UserIcon class="h-10 w-10 text-gray-400 mb-2" />
        <h3 class="font-semibold text-gray-900">{{ teacher.get('username') }}</h3>
        <span
          :class="isActive(teacher) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
          class="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full"
        >
          {{ isActive(teacher) ? 'Ativa' : 'Inativa' }}
        </span>
      </div>
    </div>

    <!-- Lista -->
    <div v-else class="card">
      <div class="divide-y divide-gray-200">
        <div
          v-for="teacher in teacherStore.teachers"
          :key="teacher.id"
          class="p-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between"
          @click="$router.push(`/professores/${teacher.id}`)"
        >
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900">{{ teacher.get('username') }}</h3>
            <span
              :class="isActive(teacher) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
              class="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full"
            >
              {{ isActive(teacher) ? 'Ativa' : 'Inativa' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useTeacherStore } from '../../stores/teacher'
import { useAuthStore } from '../../stores/auth'
import { UserIcon, Squares2X2Icon, ListBulletIcon } from '@heroicons/vue/24/outline'

const teacherStore = useTeacherStore()
const authStore = useAuthStore()
const viewMode = ref('grid')
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 768)

const isMobile = computed(() => windowWidth.value < 768)

function isActive(teacher) {
  return teacher.get('active') !== false
}

function handleResize() {
  if (typeof window === 'undefined') return
  windowWidth.value = window.innerWidth
  if (isMobile.value) viewMode.value = 'grid'
}

onMounted(async () => {
  await teacherStore.loadTeachers()
  if (typeof window !== 'undefined') window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (typeof window !== 'undefined') window.removeEventListener('resize', handleResize)
})
</script>
