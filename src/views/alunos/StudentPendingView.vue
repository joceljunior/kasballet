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
          <div class="flex flex-col md:flex-row md:items-center md:justify-between">
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900">{{ student.get('name') }}</h3>
              <p class="text-sm text-gray-600 mt-1">CPF: {{ student.get('cpf') }}</p>
              <p class="text-sm text-gray-600">Email: {{ student.get('email') || 'Não informado' }}</p>
              <p class="text-sm text-gray-600">Telefone: {{ student.get('telephone') }}</p>
            </div>
            <button
              @click="handleApprove(student.id)"
              :disabled="studentStore.loading"
              class="btn-primary mt-4 md:mt-0 md:ml-4"
            >
              Aprovar
            </button>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useStudentStore } from '../../stores/student'

const studentStore = useStudentStore()

onMounted(async () => {
  await studentStore.loadPendingStudents()
})

async function handleApprove(id) {
  try {
    await studentStore.approveStudent(id)
    await studentStore.loadPendingStudents()
  } catch (error) {
    console.error('Error approving student:', error)
  }
}
</script>
