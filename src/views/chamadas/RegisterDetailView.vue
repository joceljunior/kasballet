<template>
  <div class="space-y-6 pb-20 md:pb-6">
    <AppLoading v-if="loading && !register" card message="Carregando chamada..." />

    <div v-else-if="register">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Chamada – {{ getCrewName(register.get('crewId')) }}</h1>
          <p class="text-gray-600 mt-1">{{ formatDateBR(register.get('dateregister')) || '—' }}</p>
        </div>
        <div class="flex gap-2 mt-4 md:mt-0">
          <router-link :to="`/chamadas/${register.id}/edit`" class="btn-primary">Editar</router-link>
          <button type="button" @click="toDelete = true" class="btn-secondary text-red-600 border-red-200 hover:bg-red-50">Excluir</button>
        </div>
      </div>

      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Informações</h2>
        <dl class="space-y-3">
          <div>
            <dt class="text-sm font-medium text-gray-500">Turma</dt>
            <dd class="mt-1 text-sm text-gray-900">{{ getCrewName(register.get('crewId')) }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500">Data</dt>
            <dd class="mt-1 text-sm text-gray-900">{{ formatDateBR(register.get('dateregister')) || '—' }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500">Quem fez a chamada</dt>
            <dd class="mt-1 text-sm text-gray-900">{{ getCalledBy(register.get('calledByUserId')) }}</dd>
          </div>
        </dl>
      </div>

      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Presença</h2>
        <div v-if="rows.length === 0" class="text-sm text-gray-500 py-4">Nenhum registro de presença.</div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Aluna</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Presença</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="row in rows" :key="row.studentId">
                <td class="px-4 py-2 text-sm text-gray-900">{{ row.name }}</td>
                <td class="px-4 py-2">
                  <span :class="row.present ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'" class="px-2 py-0.5 text-xs font-medium rounded-full">
                    {{ row.present ? 'P' : 'A' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal confirmar exclusão -->
    <div v-if="toDelete" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" @click.self="toDelete = false">
      <div class="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
        <p class="text-gray-700">Excluir esta chamada?</p>
        <div class="flex gap-3 mt-6">
          <button type="button" @click="doDelete" class="btn-primary flex-1">Excluir</button>
          <button type="button" @click="toDelete = false" class="btn-secondary flex-1">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRegisterStore } from '../../stores/register'
import { crewService, studentService, userRepository } from '../../services/index.js'
import { formatDateBR } from '../../utils/date.js'
import AppLoading from '../../components/common/AppLoading.vue'

const route = useRoute()
const router = useRouter()
const registerStore = useRegisterStore()
const register = ref(null)
const loading = ref(true)
const toDelete = ref(false)
const crewMap = ref({})
const studentMap = ref({})
const calledBy = ref(null)

const rows = computed(() => {
  const arr = register.value?.get('studentRegisters') || []
  return arr.map((x) => {
    const name = studentMap.value[x.studentId]?.get('name') || x.studentId || '—'
    return { studentId: x.studentId, name, present: x.present === true }
  })
})

function getCrewName(crewId) {
  if (!crewId) return '—'
  const c = crewMap.value[crewId]
  return c ? `${c.get('Name') || ''} – ${c.get('Key') || ''}`.trim() || crewId : crewId
}

function getCalledBy(uid) {
  if (!uid) return '—'
  return calledBy.value || uid
}

async function doDelete() {
  if (!register.value) return
  try {
    await registerStore.deleteRegister(register.value.id)
    toDelete.value = false
    router.push('/chamadas')
  } catch (_) {}
}

onMounted(async () => {
  try {
    register.value = await registerStore.getRegisterById(route.params.id)
    const crewId = register.value.get('crewId')
    const uid = register.value.get('calledByUserId')
    const arr = register.value.get('studentRegisters') || []
    const studentIds = [...new Set(arr.map((x) => x?.studentId).filter(Boolean))]

    const [crews, users, students] = await Promise.all([
      crewId ? crewService.getCrewById(crewId).then((c) => (c ? [c] : [])).catch(() => []) : Promise.resolve([]),
      uid ? userRepository.findByIds([uid]) : Promise.resolve([]),
      studentIds.length ? studentService.getStudentsByIds(studentIds) : Promise.resolve([])
    ])
    crewMap.value = crews.reduce((m, c) => { m[c.id] = c; return m }, {})
    studentMap.value = students.reduce((m, s) => { m[s.id] = s; return m }, {})
    calledBy.value = users[0] ? (users[0].get('username') || users[0].id) : null
  } catch (err) {
    console.error(err)
    router.push('/chamadas')
  } finally {
    loading.value = false
  }
})
</script>
