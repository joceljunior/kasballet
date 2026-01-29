<template>
  <div class="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-12 px-4">
    <div class="max-w-2xl mx-auto">
      <div class="bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Cadastro de Aluno</h1>
          <p class="text-gray-600">Preencha os dados abaixo. Seu cadastro ficará pendente até aprovação.</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {{ error }}
          </div>

          <div v-if="success" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            Cadastro realizado com sucesso! Aguarde a aprovação.
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Nome Completo *</label>
              <input v-model="form.name" type="text" required class="input" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">CPF *</label>
              <input v-model="form.cpf" type="text" required class="input" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input v-model="form.email" type="email" required class="input" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Telefone *</label>
              <input v-model="form.telephone" type="tel" required class="input" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Data de Nascimento *</label>
              <input v-model="form.birthday" type="date" required class="input" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Nacionalidade *</label>
              <input v-model="form.nationality" type="text" required class="input" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Endereço *</label>
              <input v-model="form.address" type="text" required class="input" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Número *</label>
              <input v-model.number="form.addressNumber" type="number" required class="input" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Bairro *</label>
              <input v-model="form.addressDistrict" type="text" required class="input" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Cidade *</label>
              <input v-model="form.addressCity" type="text" required class="input" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Complemento</label>
              <input v-model="form.complement" type="text" class="input" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Alergias</label>
              <input v-model="form.allergy" type="text" class="input" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Nome do Responsável *</label>
              <input v-model="form.nameResponsible" type="text" required class="input" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Parentesco *</label>
              <select v-model="form.relationship" required class="input">
                <option value="">Selecione</option>
                <option value="Mãe">Mãe</option>
                <option value="Pai">Pai</option>
                <option value="Avó">Avó</option>
                <option value="Avô">Avô</option>
                <option value="Tia">Tia</option>
                <option value="Tio">Tio</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Escola</label>
              <input v-model="form.schoolName" type="text" class="input" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Série</label>
              <input v-model="form.schoolGrade" type="text" class="input" />
            </div>
          </div>

          <div class="flex gap-4">
            <button
              type="submit"
              :disabled="loading"
              class="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="loading">Cadastrando...</span>
              <span v-else>Cadastrar</span>
            </button>
            <router-link to="/" class="btn-secondary">
              Cancelar
            </router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { studentService } from '../../services/index.js'
import router from '../../router'

const loading = ref(false)
const error = ref(null)
const success = ref(false)

const form = ref({
  name: '',
  cpf: '',
  email: '',
  telephone: '',
  birthday: '',
  nationality: 'Brasileira',
  address: '',
  addressNumber: '',
  addressDistrict: '',
  addressCity: '',
  complement: '',
  allergy: '',
  nameResponsible: '',
  relationship: '',
  schoolName: '',
  schoolGrade: '',
  active: false,
  dateRegistry: new Date(),
  useImage: true
})

async function handleSubmit() {
  loading.value = true
  error.value = null
  success.value = false

  try {
    // Registro público: cria como pendente (isPublicRegistration = true)
    await studentService.createStudent(form.value, true)
    success.value = true
    setTimeout(() => {
      router.push('/')
    }, 2000)
  } catch (err) {
    error.value = err.message || 'Erro ao realizar cadastro'
  } finally {
    loading.value = false
  }
}
</script>
