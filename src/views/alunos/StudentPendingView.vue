<template>
  <div class="space-y-6 pb-20 md:pb-6">
      <h1 class="text-2xl font-bold text-gray-900">Alunos Pendentes</h1>

      <div v-if="studentStore.loading && studentStore.students.length === 0" class="card text-center py-12">
        <p class="text-gray-600">Carregando...</p>
      </div>

      <div v-else-if="studentStore.students.length === 0" class="card text-center py-12">
        <p class="text-gray-600">Nenhum aluno pendente</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="student in studentStore.students"
          :key="student.id"
          class="card"
        >
          <!-- Cabeçalho com foto e ações -->
          <div class="flex flex-col md:flex-row md:items-start gap-4 pb-4 border-b">
            <div class="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
              <img v-if="student.get('photo')" :src="student.get('photo').url()" alt="Foto" class="w-full h-full object-cover" />
              <UserCircleIcon v-else class="w-12 h-12 text-gray-400" />
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-semibold text-gray-900">{{ student.get('name') }}</h3>
              <p class="text-sm text-gray-500 mt-1">Cadastrado em: {{ formatDate(student.get('dateRegistry') || student.createdAt) }}</p>
            </div>
            <div class="flex gap-2">
              <button
                @click="toggleExpand(student.id)"
                class="btn-secondary text-sm"
              >
                {{ expandedStudents.includes(student.id) ? 'Ocultar Detalhes' : 'Ver Detalhes' }}
              </button>
              <button
                @click="handleApprove(student.id)"
                :disabled="studentStore.loading"
                class="btn-primary"
              >
                Aprovar
              </button>
            </div>
          </div>

          <!-- Resumo básico sempre visível -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">Responsável</p>
              <p class="text-sm font-medium text-gray-900">{{ student.get('nameResponsible') || '-' }}</p>
              <p class="text-sm text-gray-600">{{ student.get('relationship') || '-' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">Telefone</p>
              <p class="text-sm font-medium text-gray-900">{{ student.get('telephone') || '-' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">Email</p>
              <p class="text-sm font-medium text-gray-900">{{ student.get('email') || '-' }}</p>
            </div>
          </div>

          <!-- Detalhes expandidos -->
          <div v-if="expandedStudents.includes(student.id)" class="border-t pt-4 space-y-6">
            <!-- Dados da Aluna -->
            <div>
              <h4 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <UserCircleIcon class="w-4 h-4 text-green-600" />
                Dados da Aluna
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p class="text-xs text-gray-500">Nome Completo</p>
                  <p class="text-sm text-gray-900">{{ student.get('name') }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Data de Nascimento</p>
                  <p class="text-sm text-gray-900">{{ formatDate(student.get('birthday')) }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Nacionalidade</p>
                  <p class="text-sm text-gray-900">{{ student.get('nationality') || '-' }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Escola</p>
                  <p class="text-sm text-gray-900">{{ student.get('schoolName') || '-' }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Série/Ano</p>
                  <p class="text-sm text-gray-900">{{ student.get('schoolGrade') || '-' }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Alergia</p>
                  <p class="text-sm text-gray-900">{{ student.get('allergy') || 'Não possui' }}</p>
                </div>
              </div>
            </div>

            <!-- Dados do Responsável -->
            <div>
              <h4 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                Dados do Responsável
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p class="text-xs text-gray-500">Nome</p>
                  <p class="text-sm text-gray-900">{{ student.get('nameResponsible') || '-' }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Parentesco</p>
                  <p class="text-sm text-gray-900">{{ student.get('relationship') || '-' }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">CPF</p>
                  <p class="text-sm text-gray-900">{{ student.get('cpf') || '-' }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Email</p>
                  <p class="text-sm text-gray-900">{{ student.get('email') || '-' }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Telefone</p>
                  <p class="text-sm text-gray-900">{{ student.get('telephone') || '-' }}</p>
                </div>
              </div>
            </div>

            <!-- Endereço -->
            <div>
              <h4 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                Endereço
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="md:col-span-2">
                  <p class="text-xs text-gray-500">Endereço</p>
                  <p class="text-sm text-gray-900">
                    {{ student.get('address') || '-' }}{{ student.get('addressNumber') ? ', ' + student.get('addressNumber') : '' }}{{ student.get('complement') ? ' - ' + student.get('complement') : '' }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Bairro</p>
                  <p class="text-sm text-gray-900">{{ student.get('addressDistrict') || '-' }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Cidade</p>
                  <p class="text-sm text-gray-900">{{ student.get('addressCity') || '-' }}</p>
                </div>
              </div>
            </div>

            <!-- Turmas e Plano -->
            <div>
              <h4 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
                Turmas e Plano
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p class="text-xs text-gray-500">Turmas Selecionadas</p>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <span 
                      v-for="crewName in getStudentCrewNames(student.id)" 
                      :key="crewName"
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      {{ crewName }}
                    </span>
                    <span v-if="!getStudentCrewNames(student.id).length" class="text-sm text-gray-500">Nenhuma selecionada</span>
                  </div>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Tipo de Plano</p>
                  <p class="text-sm text-gray-900">{{ formatTipoPlano(student.get('tipoPlano')) }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Melhor Dia de Pagamento</p>
                  <p class="text-sm text-gray-900">{{ student.get('melhorDiaPagamento') || '-' }}</p>
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
import { useStudentStore } from '../../stores/student'
import { studentService } from '../../services/index.js'
import { UserCircleIcon } from '@heroicons/vue/24/outline'

const studentStore = useStudentStore()
const expandedStudents = ref([])
const studentCrewsMap = ref({})

onMounted(async () => {
  await studentStore.loadPendingStudents()
  await loadCrewsForStudents()
})

async function loadCrewsForStudents() {
  if (studentStore.students.length > 0) {
    const map = await studentService.getCrewsForStudents(studentStore.students)
    studentCrewsMap.value = map
  }
}

function getStudentCrewNames(studentId) {
  const crews = studentCrewsMap.value[studentId] || []
  return crews.map(c => c.get('Name'))
}

function toggleExpand(studentId) {
  const index = expandedStudents.value.indexOf(studentId)
  if (index > -1) {
    expandedStudents.value.splice(index, 1)
  } else {
    expandedStudents.value.push(studentId)
  }
}

function formatDate(date) {
  if (!date) return '-'
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('pt-BR')
}

function formatTipoPlano(tipo) {
  const map = {
    'PIX': 'PIX',
    'RecorrenteMensal': 'Recorrente Mensal',
    'RecorrenteAnual': 'Recorrente Anual',
    'RecorrenteSemestral': 'Recorrente Semestral'
  }
  return map[tipo] || '-'
}

async function handleApprove(id) {
  try {
    await studentStore.approveStudent(id)
    await studentStore.loadPendingStudents()
    await loadCrewsForStudents()
  } catch (error) {
    console.error('Error approving student:', error)
  }
}
</script>
