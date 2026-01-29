<template>
  <div class="space-y-6 pb-20 md:pb-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Chamadas</h1>
        <p class="text-gray-600 mt-1">Registro de presença por turma e data</p>
      </div>
      <router-link to="/chamadas/nova" class="btn-primary mt-4 md:mt-0">
        Nova Chamada
      </router-link>
    </div>

    <!-- Filtros -->
    <div class="card">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Turma</label>
          <select v-model="filterCrewId" @change="applyFilters" class="input">
            <option value="">Todas</option>
            <option v-for="c in crewsForFilter" :key="c.id" :value="c.id">
              {{ c.get('Name') }} – {{ c.get('Key') }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Data de</label>
          <input v-model="filterDateFrom" type="date" class="input" @change="applyFilters" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Data até</label>
          <input v-model="filterDateTo" type="date" class="input" @change="applyFilters" />
        </div>
        <div class="flex items-end">
          <button type="button" @click="clearFilters" class="btn-secondary w-full md:w-auto">Limpar</button>
        </div>
      </div>
    </div>

    <div v-if="registerStore.loading && registerStore.registers.length === 0" class="card text-center py-12">
      <p class="text-gray-600">Carregando...</p>
    </div>

    <div v-else-if="registerStore.registers.length === 0" class="card text-center py-12">
      <ClipboardDocumentListIcon class="h-12 w-12 mx-auto text-gray-400" />
      <p class="mt-4 text-gray-600">Nenhuma chamada encontrada</p>
    </div>

    <div v-else class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Turma</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quem fez a chamada</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="r in registerStore.registers" :key="r.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm text-gray-900">{{ getCrewName(r.get('crewId')) }}</td>
              <td class="px-4 py-3 text-sm text-gray-900">{{ formatDate(r.get('dateregister')) }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ getCalledBy(r.get('calledByUserId')) }}</td>
              <td class="px-4 py-3 text-sm text-right">
                <router-link :to="`/chamadas/${r.id}`" class="text-green-600 hover:underline mr-3">Ver</router-link>
                <router-link :to="`/chamadas/${r.id}/edit`" class="text-green-600 hover:underline mr-3">Editar</router-link>
                <button type="button" @click="toDelete = r" class="text-red-600 hover:underline">Excluir</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal confirmar exclusão -->
    <div v-if="toDelete" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" @click.self="toDelete = null">
      <div class="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
        <p class="text-gray-700">Excluir a chamada de <strong>{{ getCrewName(toDelete.get('crewId')) }}</strong> em {{ formatDate(toDelete.get('dateregister')) }}?</p>
        <div class="flex gap-3 mt-6">
          <button type="button" @click="doDelete" class="btn-primary flex-1">Excluir</button>
          <button type="button" @click="toDelete = null" class="btn-secondary flex-1">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRegisterStore } from '../../stores/register'
import { useAuthStore } from '../../stores/auth'
import { crewService, userRepository } from '../../services/index.js'
import { ClipboardDocumentListIcon } from '@heroicons/vue/24/outline'

const registerStore = useRegisterStore()
const authStore = useAuthStore()
const filterCrewId = ref('')
const filterDateFrom = ref('')
const filterDateTo = ref('')
const crewsForFilter = ref([])
const crewMap = ref({})
const calledByMap = ref({})
const toDelete = ref(null)

function formatDate(d) {
  if (!d) return '—'
  const x = d instanceof Date ? d : new Date(d)
  return isNaN(x.getTime()) ? '—' : x.toLocaleDateString('pt-BR')
}

function getCrewName(crewId) {
  if (!crewId) return '—'
  const c = crewMap.value[crewId]
  if (!c) return crewId
  return `${c.get('Name') || ''} – ${c.get('Key') || ''}`.trim() || crewId
}

function getCalledBy(uid) {
  if (!uid) return '—'
  return calledByMap.value[uid] || uid
}

async function applyFilters() {
  const f = {}
  if (filterCrewId.value) f.crewId = filterCrewId.value
  else if (authStore.isTeacher && crewsForFilter.value.length) f.crewIds = crewsForFilter.value.map((c) => c.id)
  if (filterDateFrom.value) f.dateFrom = filterDateFrom.value
  if (filterDateTo.value) f.dateTo = filterDateTo.value
  await registerStore.setFilters(f)
  await loadCalledByMap()
}

function clearFilters() {
  filterCrewId.value = ''
  filterDateFrom.value = ''
  filterDateTo.value = ''
  applyFilters()
}

async function loadCalledByMap() {
  const ids = [...new Set(registerStore.registers.map((r) => r.get('calledByUserId')).filter(Boolean))]
  if (!ids.length) { calledByMap.value = {}; return }
  try {
    const users = await userRepository.findByIds(ids)
    calledByMap.value = Object.fromEntries(users.map((u) => [u.id, u.get('username') || u.id]))
  } catch (_) {
    calledByMap.value = {}
  }
}

async function doDelete() {
  if (!toDelete.value) return
  try {
    await registerStore.deleteRegister(toDelete.value.id)
    toDelete.value = null
  } catch (_) {}
}

onMounted(async () => {
  try {
    if (authStore.isTeacher) {
      crewsForFilter.value = await crewService.getCrewsByTeacher(authStore.user?.id, 0, 200, {})
    } else {
      crewsForFilter.value = await crewService.getCrews(0, 200, {})
    }
    crewMap.value = crewsForFilter.value.reduce((m, c) => { m[c.id] = c; return m }, {})
  } catch (_) {}
  await applyFilters()
})
</script>
