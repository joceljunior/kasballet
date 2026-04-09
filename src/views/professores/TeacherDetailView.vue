<template>
  <div class="space-y-6 pb-20 md:pb-6">
    <div v-if="loading && !teacher" class="card text-center py-12">
      <p class="text-gray-600">Carregando...</p>
    </div>

    <div v-else-if="teacher">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-2xl font-bold text-gray-900">{{ teacher.get('username') }}</h1>
            <span
              :class="teacher.get('active') !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
              class="px-2 py-1 text-xs font-medium rounded-full"
            >
              {{ teacher.get('active') !== false ? 'Ativa' : 'Inativa' }}
            </span>
          </div>
          <p class="text-gray-600 mt-1">{{ teacher.get('email') || '—' }}</p>
        </div>
        <div v-if="authStore.isMaster" class="flex flex-wrap gap-3 mt-4 md:mt-0">
          <router-link
            :to="`/professores/${teacher.id}/edit`"
            class="btn-secondary"
          >
            Editar
          </router-link>
          <button
            type="button"
            class="btn-secondary text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-50"
            :disabled="deleting"
            @click="confirmDelete"
          >
            {{ deleting ? 'Excluindo...' : 'Excluir professora' }}
          </button>
        </div>
      </div>

      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Turmas</h2>
        <div v-if="crewsLoading" class="text-center py-6">
          <p class="text-gray-600">Carregando turmas...</p>
        </div>
        <div v-else-if="crews.length === 0" class="text-center py-6">
          <p class="text-gray-600">Nenhuma turma vinculada</p>
        </div>
        <div v-else class="space-y-2">
          <router-link
            v-for="c in crews"
            :key="c.id"
            :to="`/turmas/${c.id}`"
            class="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-green-300 transition-colors"
          >
            <span class="font-medium text-gray-900">{{ c.get('Name') }}</span>
            <span class="text-gray-500"> – {{ c.get('Key') }}</span>
            <span
              :class="c.get('Active') ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
              class="ml-2 px-2 py-0.5 text-xs font-medium rounded-full"
            >
              {{ c.get('Active') ? 'Ativa' : 'Inativa' }}
            </span>
          </router-link>
        </div>
      </div>

      <div v-if="authStore.isMaster" class="card">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Histórico de pagamentos</h2>
        <div v-if="paymentLoading" class="text-sm text-gray-500 py-2">Carregando...</div>
        <div v-else-if="!paymentHistory.length" class="text-sm text-gray-500 py-2">Nenhum pagamento lançado a esta professora.</div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="e in paymentHistory" :key="e.id">
                <td class="px-3 py-2 text-sm text-gray-900">{{ formatDateBR(e.get('date')) || '—' }}</td>
                <td class="px-3 py-2 text-sm text-right text-red-700 font-medium">{{ formatMoney(e.get('value')) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <router-link :to="{ path: '/financeiro/lancamentos/novo', query: { teacherId: teacher.id } }" class="inline-block mt-3 text-sm text-green-600 hover:underline">+ Lançar pagamento</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTeacherStore } from '../../stores/teacher'
import { useAuthStore } from '../../stores/auth'
import { crewService, financialEntryService } from '../../services/index.js'
import { formatDateBR } from '../../utils/date.js'

const route = useRoute()
const router = useRouter()
const teacherStore = useTeacherStore()
const authStore = useAuthStore()
const teacher = ref(null)
const crews = ref([])
const paymentHistory = ref([])
const paymentLoading = ref(false)
const loading = ref(true)
const crewsLoading = ref(false)
const deleting = ref(false)

function formatMoney(v) {
  const n = Number(v)
  return isNaN(n) ? '0,00' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function confirmDelete() {
  const name = teacher.value?.get('username') || 'esta professora'
  if (!window.confirm(`Excluir ${name} permanentemente? As turmas ficarão sem professora atribuída. Esta ação não pode ser desfeita.`)) {
    return
  }
  deleting.value = true
  try {
    await teacherStore.deleteTeacher(teacher.value.id)
    router.push('/professores')
  } catch (err) {
    console.error(err)
    alert(err?.message || 'Não foi possível excluir.')
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  try {
    teacher.value = await teacherStore.getTeacherById(route.params.id)
    crewsLoading.value = true
    crews.value = await crewService.getCrewsByTeacher(route.params.id, 0, 200, {})
    if (authStore.isMaster) {
      paymentLoading.value = true
      paymentHistory.value = await financialEntryService.getEntriesByTeacher(teacher.value.id, 0, 100)
    }
  } catch (err) {
    console.error('Error loading teacher:', err)
    router.push('/professores')
  } finally {
    loading.value = false
    crewsLoading.value = false
    paymentLoading.value = false
  }
})
</script>
