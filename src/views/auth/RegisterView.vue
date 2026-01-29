<template>
  <div class="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-12 px-4">
    <div class="max-w-2xl mx-auto">
      <div class="bg-white rounded-2xl shadow-xl p-6 md:p-8">
        
        <!-- Tela de agradecimento após cadastro -->
        <div v-if="success" class="text-center py-12">
          <div class="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <svg class="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-900 mb-4">Cadastro Realizado!</h2>
          <p class="text-lg text-gray-600 mb-3">Obrigado por se cadastrar no Kasballet!</p>
          <p class="text-gray-500 mb-6">Seu cadastro está pendente de aprovação.<br>Entraremos em contato em breve.</p>
          <div class="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Aguarde nosso contato
          </div>
        </div>

        <!-- Formulário (mostrado apenas quando não há sucesso) -->
        <template v-else>
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Cadastro de Aluno</h1>
            <p class="text-gray-600">Preencha os dados abaixo. Seu cadastro ficará pendente até aprovação.</p>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {{ error }}
            </div>

            <!-- Foto da aluna -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Foto da aluna</label>
              <div class="flex items-center gap-4">
                <div class="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <img v-if="photoPreview" :src="photoPreview" alt="Preview" class="w-full h-full object-cover" />
                  <UserCircleIcon v-else class="w-14 h-14 text-gray-400" />
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    @change="onPhotoChange"
                    class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                  <p class="text-xs text-gray-500 mt-1">JPG, PNG. Opcional.</p>
                </div>
              </div>
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

            <div class="md:col-span-2">
              <label class="flex items-center gap-3 cursor-pointer">
                <input v-model="form.hasAllergy" type="checkbox" class="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                <span class="text-sm font-medium text-gray-700">Possui alguma alergia?</span>
              </label>
              <div v-if="form.hasAllergy" class="mt-3">
                <label class="block text-sm font-medium text-gray-700 mb-2">Descreva a(s) alergia(s) *</label>
                <input v-model="form.allergy" type="text" :required="form.hasAllergy" class="input" placeholder="Ex: Amendoim, Lactose, etc." />
              </div>
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

            <div>
              <button
                type="submit"
                :disabled="loading"
                class="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="loading">Cadastrando...</span>
                <span v-else>Cadastrar</span>
              </button>
            </div>
          </form>
        </template>
        
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { studentService } from '../../services/index.js'
import Parse from '../../services/parse.js'
import { UserCircleIcon } from '@heroicons/vue/24/outline'

const loading = ref(false)
const error = ref(null)
const success = ref(false)
const photoFile = ref(null)
const photoPreview = ref(null)

function onPhotoChange(e) {
  const file = e.target.files?.[0]
  photoFile.value = file || null
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoPreview.value = file ? URL.createObjectURL(file) : null
}

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
  hasAllergy: false,
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
    // Preparar dados para envio
    const data = {
      ...form.value,
      // Converter birthday de string para Date
      birthday: form.value.birthday ? new Date(form.value.birthday) : null,
      // Campos de alergia: hasAllergy é booleano, allergy é a descrição
      allergy: form.value.hasAllergy ? form.value.allergy : ''
    }
    
    // Remover hasAllergy do payload (apenas controle do formulário, não vai para o banco)
    delete data.hasAllergy
    
    // Adicionar foto se uma foi selecionada
    if (photoFile.value) {
      data.photo = new Parse.File(photoFile.value.name, photoFile.value)
    }
    
    // Registro público: cria como pendente (isPublicRegistration = true)
    await studentService.createStudent(data, true)
    success.value = true
    // Fluxo termina aqui - apenas mostra a mensagem de agradecimento
  } catch (err) {
    error.value = err.message || 'Erro ao realizar cadastro'
  } finally {
    loading.value = false
  }
}
</script>
