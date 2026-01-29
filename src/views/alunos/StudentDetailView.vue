<template>
  <div class="space-y-6 pb-20 md:pb-6">
      <div v-if="loading" class="card text-center py-12">
        <p class="text-gray-600">Carregando...</p>
      </div>

      <div v-else-if="student">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <p class="text-gray-600">Detalhes do aluno</p>
          </div>
          <div class="flex gap-2 mt-4 md:mt-0">
            <router-link :to="`/alunos/${student.id}/edit`" class="btn-secondary">
              Editar
            </router-link>
            <button @click="handleApprove" v-if="!student.get('active')" class="btn-primary">
              Aprovar
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Foto e Status -->
          <div class="card md:col-span-2">
            <div class="flex items-center gap-6">
              <div class="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                <img v-if="getPhotoUrl(student)" :src="getPhotoUrl(student)" :alt="student.get('name')" class="w-full h-full object-cover" />
                <UserCircleIcon v-else class="w-14 h-14 text-gray-400" />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-3">
                  <h1 class="text-2xl font-bold text-gray-900">{{ student.get('name') }}</h1>
                  <span
                    :class="student.get('active') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
                    class="px-3 py-1 text-xs font-medium rounded-full"
                  >
                    {{ student.get('active') ? 'Ativa' : 'Pendente' }}
                  </span>
                </div>
                <p class="text-gray-600 mt-1">Detalhes do aluno</p>
              </div>
            </div>
          </div>

          <div class="card">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Informações Pessoais</h2>
            <dl class="space-y-3">
              <div>
                <dt class="text-sm font-medium text-gray-500">CPF</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ student.get('cpf') }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Email</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ student.get('email') || 'Não informado' }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Telefone</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ student.get('telephone') }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Data de Nascimento</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ formatDate(student.get('birthday')) }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Nacionalidade</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ student.get('nationality') }}</dd>
              </div>
              <div v-if="student.get('allergy')">
                <dt class="text-sm font-medium text-gray-500">Alergia</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ student.get('allergy') }}</dd>
              </div>
            </dl>
          </div>

          <div class="card">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Endereço</h2>
            <dl class="space-y-3">
              <div>
                <dt class="text-sm font-medium text-gray-500">Endereço</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {{ student.get('address') }}, {{ student.get('addressNumber') }}
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Bairro</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ student.get('addressDistrict') }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Cidade</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ student.get('addressCity') }}</dd>
              </div>
              <div v-if="student.get('complement')">
                <dt class="text-sm font-medium text-gray-500">Complemento</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ student.get('complement') }}</dd>
              </div>
            </dl>
          </div>

          <div class="card">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Responsável</h2>
            <dl class="space-y-3">
              <div>
                <dt class="text-sm font-medium text-gray-500">Nome</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ student.get('nameResponsible') || 'Não informado' }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Parentesco</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ student.get('relationship') || 'Não informado' }}</dd>
              </div>
            </dl>
          </div>

          <div class="card">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Escola</h2>
            <dl class="space-y-3">
              <div v-if="student.get('schoolName')">
                <dt class="text-sm font-medium text-gray-500">Nome da Escola</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ student.get('schoolName') }}</dd>
              </div>
              <div v-if="student.get('schoolGrade')">
                <dt class="text-sm font-medium text-gray-500">Série/Ano</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ student.get('schoolGrade') }}</dd>
              </div>
              <div v-if="!student.get('schoolName') && !student.get('schoolGrade')">
                <p class="text-sm text-gray-500">Não informado</p>
              </div>
            </dl>
          </div>

          <div class="card">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Turmas</h2>
            <p v-if="!studentCrews.length" class="text-sm text-gray-500">Nenhuma turma vinculada.</p>
            <ul v-else class="space-y-1">
              <li v-for="c in studentCrews" :key="c.id" class="text-sm text-pink-500">
                {{ c.get('Name') }}
              </li>
            </ul>
          </div>

          <div class="card">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Financeiro</h2>
            <dl class="space-y-3">
              <div>
                <dt class="text-sm font-medium text-gray-500">Melhor Dia de Pagamento</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {{ student.get('melhorDiaPagamento') || 'Não informado' }}
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Tipo de Plano</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {{ student.get('tipoPlano') || 'Não informado' }}
                </dd>
              </div>
            </dl>
          </div>

          <div v-if="authStore.isMaster" class="card md:col-span-2">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Histórico de pagamentos (mensalidades)</h2>
            <div v-if="paymentLoading" class="text-sm text-gray-500 py-2">Carregando...</div>
            <div v-else-if="!paymentHistory.length" class="text-sm text-gray-500 py-2">Nenhuma mensalidade lançada.</div>
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
                    <td class="px-3 py-2 text-sm text-gray-900">{{ formatDate(e.get('date')) }}</td>
                    <td class="px-3 py-2 text-sm text-right text-green-700 font-medium">{{ formatMoney(e.get('value')) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <router-link :to="{ path: '/financeiro/lancamentos/novo', query: { studentId: student.id } }" class="inline-block mt-3 text-sm text-green-600 hover:underline">+ Lançar mensalidade</router-link>
          </div>

          <div class="card">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Informações do Sistema</h2>
            <dl class="space-y-3">
              <div>
                <dt class="text-sm font-medium text-gray-500">Data de Registro</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ formatDate(student.get('dateRegistry')) }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Status</dt>
                <dd class="mt-1">
                  <span
                    :class="student.get('active') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
                    class="px-2 py-1 text-xs font-medium rounded-full"
                  >
                    {{ student.get('active') ? 'Ativa' : 'Pendente' }}
                  </span>
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Usa Imagem</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {{ student.get('useImage') ? 'Sim' : 'Não' }}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { studentService, financialEntryService } from '../../services/index.js'
import { formatDate } from '../../utils/pagination.js'
import { UserCircleIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const student = ref(null)
const studentCrews = ref([])
const paymentHistory = ref([])
const paymentLoading = ref(false)
const loading = ref(true)

function formatMoney(v) {
  const n = Number(v)
  return isNaN(n) ? '0,00' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(async () => {
  try {
    student.value = await studentService.getStudentById(route.params.id)
    const map = await studentService.getCrewsForStudents([student.value])
    studentCrews.value = map[student.value.id] || []
    if (authStore.isMaster) {
      paymentLoading.value = true
      paymentHistory.value = await financialEntryService.getEntriesByStudent(student.value.id, 0, 100)
    }
  } catch (error) {
    console.error('Error loading student:', error)
    router.push('/alunos')
  } finally {
    loading.value = false
    paymentLoading.value = false
  }
})

function getPhotoUrl(student) {
  const photo = student?.get('photo')
  return photo?.url?.() || null
}

async function handleApprove() {
  try {
    await studentService.approveStudent(student.value.id)
    student.value.set('active', true)
  } catch (error) {
    console.error('Error approving student:', error)
  }
}
</script>
