<template>
  <div class="space-y-6 pb-20 md:pb-6">
      <div v-if="loading" class="card text-center py-12">
        <p class="text-gray-600">Carregando...</p>
      </div>

      <div v-else-if="student" class="space-y-6">
        <!-- Cabeçalho com Foto e Ações -->
        <div class="card">
          <div class="flex flex-col md:flex-row md:items-center gap-6">
            <div class="w-28 h-28 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
              <img v-if="getPhotoUrl(student)" :src="getPhotoUrl(student)" :alt="student.get('name')" class="w-full h-full object-cover" />
              <UserCircleIcon v-else class="w-16 h-16 text-gray-400" />
            </div>
            <div class="flex-1">
              <div class="flex flex-wrap items-center gap-3 mb-2">
                <h1 class="text-2xl font-bold text-gray-900">{{ student.get('name') }}</h1>
                <span
                  :class="student.get('active') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
                  class="px-3 py-1 text-xs font-medium rounded-full"
                >
                  {{ student.get('active') ? 'Ativa' : 'Pendente' }}
                </span>
              </div>
              <p class="text-gray-600">Cadastrada em {{ formatDate(student.get('dateRegistry') || student.createdAt) }}</p>
            </div>
            <div class="flex gap-2">
              <router-link :to="`/alunos/${student.id}/edit`" class="btn-secondary">
                Editar
              </router-link>
              <button @click="handleApprove" v-if="!student.get('active')" class="btn-primary">
                Aprovar
              </button>
            </div>
          </div>
        </div>

        <!-- SEÇÃO: Dados da Aluna -->
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserCircleIcon class="w-5 h-5 text-green-600" />
            Dados da Aluna
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <dt class="text-sm font-medium text-gray-500">Nome Completo</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ student.get('name') }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Data de Nascimento</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ formatDate(student.get('birthday')) }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Nacionalidade</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ student.get('nationality') || '-' }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Escola</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ student.get('schoolName') || '-' }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Série/Ano</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ student.get('schoolGrade') || '-' }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Alergia</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ student.get('allergy') || 'Não possui' }}</dd>
            </div>
          </div>
        </div>

        <!-- SEÇÃO: Dados do Responsável -->
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            Dados do Responsável
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <dt class="text-sm font-medium text-gray-500">Nome do Responsável</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ student.get('nameResponsible') || '-' }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Parentesco</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ student.get('relationship') || '-' }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">CPF</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ student.get('cpf') || '-' }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Email</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ student.get('email') || '-' }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Telefone</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ student.get('telephone') || '-' }}</dd>
            </div>
          </div>
        </div>

        <!-- SEÇÃO: Endereço -->
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            Endereço
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="md:col-span-2">
              <dt class="text-sm font-medium text-gray-500">Endereço</dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ student.get('address') || '-' }}{{ student.get('addressNumber') ? ', ' + student.get('addressNumber') : '' }}{{ student.get('complement') ? ' - ' + student.get('complement') : '' }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Bairro</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ student.get('addressDistrict') || '-' }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Cidade</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ student.get('addressCity') || '-' }}</dd>
            </div>
          </div>
        </div>

        <!-- SEÇÃO: Turmas e Plano -->
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
            Turmas e Plano
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="md:col-span-2 lg:col-span-4">
              <dt class="text-sm font-medium text-gray-500">Turmas</dt>
              <dd class="mt-1">
                <div v-if="!studentCrews.length" class="text-sm text-gray-500">Nenhuma turma vinculada</div>
                <div v-else class="flex flex-wrap gap-1">
                  <span 
                    v-for="c in studentCrews" 
                    :key="c.id"
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    {{ c.get('Name') }}
                  </span>
                </div>
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Plano de Pagamento</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ formatTipoPlano(student.get('tipoPlano')) }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Valor da Mensalidade</dt>
              <dd class="mt-1 text-sm text-gray-900 font-semibold text-green-600">
                {{ student.get('valorMensalidade') ? 'R$ ' + formatMoney(student.get('valorMensalidade')) : '-' }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Melhor Dia de Pagamento</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ student.get('melhorDiaPagamento') ? 'Dia ' + student.get('melhorDiaPagamento') : '-' }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Uso de Imagem</dt>
              <dd class="mt-1">
                <span 
                  :class="student.get('useImage') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                  class="px-2 py-1 text-xs font-medium rounded-full"
                >
                  {{ student.get('useImage') ? 'Autorizado' : 'Não autorizado' }}
                </span>
              </dd>
            </div>
          </div>
        </div>

        <!-- SEÇÃO: Histórico de Pagamentos (somente Master) -->
        <div v-if="authStore.isMaster" class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Histórico Financeiro
          </h2>
          <div v-if="paymentLoading" class="text-sm text-gray-500 py-2">Carregando...</div>
          <div v-else-if="!paymentHistory.length" class="text-sm text-gray-500 py-2">Nenhum lançamento registrado.</div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                  <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="e in paymentHistory" :key="e.id">
                  <td class="px-3 py-2 text-sm text-gray-900">{{ formatDate(e.get('date')) }}</td>
                  <td class="px-3 py-2 text-sm">
                    <span :class="getSubtypeClass(e.get('subtype'))" class="px-2 py-0.5 rounded-full text-xs font-medium">
                      {{ formatSubtype(e.get('subtype')) }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-sm text-gray-600">{{ e.get('description') || '-' }}</td>
                  <td class="px-3 py-2 text-sm text-right text-green-700 font-medium">R$ {{ formatMoney(e.get('value')) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <router-link :to="{ path: '/financeiro/lancamentos/novo', query: { studentId: student.id } }" class="inline-block mt-3 text-sm text-green-600 hover:underline">+ Lançar mensalidade</router-link>
        </div>

        <!-- SEÇÃO: Informações do Sistema -->
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Informações do Sistema
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <dt class="text-sm font-medium text-gray-500">Data de Registro</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ formatDate(student.get('dateRegistry') || student.createdAt) }}</dd>
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
              <dd class="mt-1 text-sm text-gray-900">{{ student.get('useImage') ? 'Sim' : 'Não' }}</dd>
            </div>
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

function formatSubtype(subtype) {
  const map = {
    'mensalidade': 'Mensalidade',
    'rematricula': 'Rematrícula',
    'taxa_participacao': 'Taxa de Participação',
    'figurino': 'Figurino',
    'vendas': 'Vendas',
    'outros': 'Outros'
  }
  return map[subtype] || subtype || '-'
}

function getSubtypeClass(subtype) {
  const classes = {
    'mensalidade': 'bg-green-100 text-green-800',
    'rematricula': 'bg-blue-100 text-blue-800',
    'taxa_participacao': 'bg-purple-100 text-purple-800',
    'figurino': 'bg-pink-100 text-pink-800',
    'vendas': 'bg-amber-100 text-amber-800',
    'outros': 'bg-gray-100 text-gray-800'
  }
  return classes[subtype] || 'bg-gray-100 text-gray-800'
}

function formatTipoPlano(tipo) {
  const map = {
    'PIX': 'Mensal',
    'Mensal': 'Mensal',
    'MensalRecorrente': 'Mensal Recorrente',
    'RecorrenteMensal': 'Mensal Recorrente',
    'RecorrenteAnual': 'Anual',
    'Anual': 'Anual',
    'RecorrenteSemestral': 'Semestral',
    'Semestral': 'Semestral'
  }
  return map[tipo] || '-'
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
