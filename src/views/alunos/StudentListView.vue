<template>
  <div class="space-y-6 pb-20 md:pb-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Alunos</h1>
        <p class="text-gray-600 mt-1">Gerencie os alunos da escola</p>
      </div>
      <div class="flex items-center gap-3 mt-4 md:mt-0">
        <!-- Toggle lista/grade (apenas desktop) -->
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
        <router-link to="/alunos/novo" class="btn-primary">
          Novo Aluno
        </router-link>
      </div>
    </div>

    <!-- Search -->
    <div class="card">
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1">
          <input
            v-model="searchQuery"
            @input="handleSearch"
            type="text"
            placeholder="Buscar por nome ou CPF..."
            class="input"
          />
        </div>
        <select v-model="activeFilter" @change="handleFilter" class="input md:w-48">
          <option value="">Todos</option>
          <option value="true">Ativos</option>
          <option value="pending">Pendentes</option>
          <option value="false">Inativos</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="studentStore.loading && studentStore.students.length === 0" class="card text-center py-12">
      <svg class="animate-spin h-8 w-8 mx-auto text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p class="mt-4 text-gray-600">Carregando alunos...</p>
    </div>

    <!-- Error State -->
    <div v-if="studentStore.error" class="card bg-red-50 border border-red-200 text-red-700">
      {{ studentStore.error }}
    </div>

    <!-- Students: Grade -->
    <div v-if="(!studentStore.loading || studentStore.students.length > 0) && viewMode === 'grid'" class="md:block">
      <InfiniteScroll
        :loading="studentStore.loading"
        :has-more="studentStore.hasMore"
        @load-more="handleLoadMore"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="student in studentStore.students"
            :key="student.id"
            class="card hover:shadow-lg transition-shadow flex flex-col"
          >
            <div class="flex gap-4 cursor-pointer" @click="$router.push(`/alunos/${student.id}`)">
              <div class="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                <img v-if="getPhotoUrl(student)" :src="getPhotoUrl(student)" :alt="student.get('name')" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center bg-gray-200">
                  <UserCircleIcon class="w-8 h-8 text-gray-400" />
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-900 truncate">{{ student.get('name') }}</h3>
                <p class="text-sm text-gray-600 mt-0.5">{{ formatBirthday(student.get('birthday')) }}</p>
                <p class="text-sm text-pink-500">{{ getCrewNames(student) }}</p>
              </div>
            </div>
            <!-- Link de edição pública (só para alunas aprovadas) -->
            <div v-if="student.get('active')" class="mt-3 pt-3 border-t border-gray-100">
              <button 
                @click.stop="copyEditLink(student.id)"
                class="text-xs text-gray-500 hover:text-green-600 flex items-center gap-1"
                :title="'Copiar link de edição para ' + student.get('name')"
              >
                <LinkIcon class="w-3.5 h-3.5" />
                <span>{{ copiedId === student.id ? 'Link copiado!' : 'Copiar link de edição' }}</span>
              </button>
            </div>
          </div>
        </div>
      </InfiniteScroll>
    </div>

    <!-- Students: Lista -->
    <div v-if="(!studentStore.loading || studentStore.students.length > 0) && viewMode === 'list'" class="hidden md:block">
      <InfiniteScroll
        :loading="studentStore.loading"
        :has-more="studentStore.hasMore"
        @load-more="handleLoadMore"
      >
        <div class="card overflow-hidden p-0">
          <div
            v-for="student in studentStore.students"
            :key="student.id"
            class="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
          >
            <div class="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer" @click="$router.push(`/alunos/${student.id}`)">
              <img v-if="getPhotoUrl(student)" :src="getPhotoUrl(student)" :alt="student.get('name')" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center bg-gray-200">
                <UserCircleIcon class="w-7 h-7 text-gray-400" />
              </div>
            </div>
            <div class="flex-1 min-w-0 cursor-pointer" @click="$router.push(`/alunos/${student.id}`)">
              <h3 class="font-medium text-gray-900">{{ student.get('name') }}</h3>
              <p class="text-sm text-gray-500">
                {{ formatBirthday(student.get('birthday')) }} · 
                <span class="text-pink-500">{{ getCrewNames(student) }}</span>
              </p>
            </div>
            <button 
              v-if="student.get('active')"
              @click.stop="copyEditLink(student.id)"
              class="text-xs text-gray-400 hover:text-green-600 flex items-center gap-1 flex-shrink-0"
              :title="'Copiar link de edição'"
            >
              <LinkIcon class="w-4 h-4" />
              <span class="hidden lg:inline">{{ copiedId === student.id ? 'Copiado!' : 'Link' }}</span>
            </button>
          </div>
        </div>
      </InfiniteScroll>
    </div>

    <!-- Mobile: sempre grade (sem toggle) -->
    <div v-if="(!studentStore.loading || studentStore.students.length > 0) && viewMode === 'list'" class="md:hidden">
      <InfiniteScroll :loading="studentStore.loading" :has-more="studentStore.hasMore" @load-more="handleLoadMore">
        <div class="grid grid-cols-1 gap-3">
          <div
            v-for="student in studentStore.students"
            :key="student.id"
            class="card hover:shadow-md flex flex-col"
          >
            <div class="flex gap-3 cursor-pointer" @click="$router.push(`/alunos/${student.id}`)">
              <div class="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                <img v-if="getPhotoUrl(student)" :src="getPhotoUrl(student)" :alt="student.get('name')" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center bg-gray-200">
                  <UserCircleIcon class="w-7 h-7 text-gray-400" />
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-medium text-gray-900">{{ student.get('name') }}</h3>
                <p class="text-sm text-gray-600">{{ formatBirthday(student.get('birthday')) }}</p>
                <p class="text-sm text-pink-600 font-medium">{{ getCrewNames(student) }}</p>
              </div>
            </div>
            <div v-if="student.get('active')" class="mt-2 pt-2 border-t border-gray-100">
              <button 
                @click.stop="copyEditLink(student.id)"
                class="text-xs text-gray-500 hover:text-green-600 flex items-center gap-1"
              >
                <LinkIcon class="w-3.5 h-3.5" />
                <span>{{ copiedId === student.id ? 'Link copiado!' : 'Copiar link de edição' }}</span>
              </button>
            </div>
          </div>
        </div>
      </InfiniteScroll>
    </div>

    <!-- Empty State -->
    <div v-if="!studentStore.loading && studentStore.students.length === 0" class="card text-center py-12">
      <UserGroupIcon class="h-12 w-12 mx-auto text-gray-400" />
      <p class="mt-4 text-gray-600">Nenhum aluno encontrado</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useStudentStore } from '../../stores/student'
import InfiniteScroll from '../../components/common/InfiniteScroll.vue'
import { UserGroupIcon, Squares2X2Icon, ListBulletIcon, UserCircleIcon, LinkIcon } from '@heroicons/vue/24/outline'

const studentStore = useStudentStore()
const searchQuery = ref('')
const activeFilter = ref('')
const viewMode = ref('grid') // 'grid' | 'list'
const copiedId = ref(null)

async function copyEditLink(studentId) {
  const url = `${window.location.origin}/editar-aluno/${studentId}`
  try {
    await navigator.clipboard.writeText(url)
    copiedId.value = studentId
    setTimeout(() => {
      copiedId.value = null
    }, 2000)
  } catch (err) {
    console.error('Erro ao copiar:', err)
  }
}

onMounted(async () => {
  await studentStore.loadStudents(true)
})

function formatBirthday(val) {
  if (!val) return '—'
  const d = val instanceof Date ? val : new Date(val)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR')
}

function getPhotoUrl(student) {
  const photo = student.get('photo')
  return photo?.url?.() || null
}

function getCrewNames(student) {
  const crews = studentStore.studentCrewsMap[student.id] || []
  if (!crews.length) return '—'
  return crews.map((c) => {
    const name = c.get?.('Name') || ''
    const key = c.get?.('Key') || ''
    if (name && key) {
      return `${name} - ${key}`
    }
    return name || key || ''
  }).filter(Boolean).join(', ')
}

async function handleLoadMore() {
  await studentStore.loadMore()
}

async function handleSearch() {
  if (searchQuery.value.trim()) {
    // Aplicar filtro na busca também
    const filters = {}
    if (activeFilter.value === 'true') {
      filters.active = true
    } else if (activeFilter.value === 'false') {
      filters.active = false
      filters.inactive = true
    } else if (activeFilter.value === 'pending') {
      filters.pending = true
    }
    studentStore.setFilters(filters)
    await studentStore.search(searchQuery.value)
  } else {
    // Se limpar a busca, recarregar com filtros
    await handleFilter()
  }
}

async function handleFilter() {
  const filters = {}
  if (activeFilter.value === 'true') {
    filters.active = true
  } else if (activeFilter.value === 'false') {
    filters.active = false
    filters.inactive = true
  } else if (activeFilter.value === 'pending') {
    filters.pending = true
  }
  // Se vazio, não passar filtro (mostrar todos)
  await studentStore.setFilters(filters)
}
</script>
