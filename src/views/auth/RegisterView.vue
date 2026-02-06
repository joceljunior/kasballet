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

          <form @submit.prevent="handleSubmit" class="space-y-8">
            <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {{ error }}
            </div>

            <!-- Foto da aluna -->
            <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-dashed border-green-200">
              <div class="flex flex-col md:flex-row items-center gap-6">
                <div class="w-32 h-32 rounded-full overflow-hidden bg-white shadow-lg flex items-center justify-center flex-shrink-0 ring-4 ring-green-100">
                  <img v-if="photoPreview" :src="photoPreview" alt="Preview" class="w-full h-full object-cover" />
                  <div v-else class="text-center">
                    <CameraIcon class="w-10 h-10 text-gray-300 mx-auto" />
                    <span class="text-xs text-gray-400 mt-1">Sem foto</span>
                  </div>
                </div>
                <div class="text-center md:text-left">
                  <h3 class="font-semibold text-gray-900 mb-2">Foto de Perfil da Aluna</h3>
                  <p class="text-sm text-gray-600 mb-3">Adicione uma foto para identificação</p>
                  <label class="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 transition-colors">
                    <CameraIcon class="w-5 h-5" />
                    <span>Selecionar Imagem</span>
                    <input
                      type="file"
                      accept="image/*"
                      @change="onPhotoChange"
                      class="hidden"
                    />
                  </label>
                  <p class="text-xs text-gray-500 mt-2">JPG ou PNG. Opcional.</p>
                </div>
              </div>
              
              <!-- Autorização de uso de imagem (obrigatório) -->
              <div class="mt-4 pt-4 border-t border-green-200">
                <label class="flex items-start gap-3 cursor-pointer">
                  <input v-model="form.useImage" type="checkbox" required class="w-5 h-5 mt-0.5 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                  <div>
                    <span class="text-sm font-medium text-gray-700">Autorizo o uso da imagem *</span>
                    <p class="text-xs text-gray-500 mt-0.5">Autorizo o uso da imagem da aluna para fins de divulgação em redes sociais e materiais da escola.</p>
                    <p class="text-xs text-red-500 mt-1">Este campo é obrigatório para realizar o cadastro.</p>
                  </div>
                </label>
              </div>
            </div>

            <!-- SEÇÃO: Dados da Aluna -->
            <div class="border-t pt-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserCircleIcon class="w-5 h-5 text-green-600" />
                Dados da Aluna
              </h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Nome Completo *</label>
                  <input v-model="form.name" type="text" required class="input" />
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
                  <label class="block text-sm font-medium text-gray-700 mb-2">Nome da Escola</label>
                  <input v-model="form.schoolName" type="text" class="input" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Série/Ano Escolar</label>
                  <input v-model="form.schoolGrade" type="text" class="input" placeholder="Ex: 3º ano, 1ª série..." />
                </div>

                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Possui Alergia?</label>
                  <div class="flex items-center gap-6">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="radio" :value="true" v-model="form.hasAllergy" class="w-4 h-4 text-green-600 focus:ring-green-500" />
                      <span class="text-sm text-gray-700">Sim</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="radio" :value="false" v-model="form.hasAllergy" class="w-4 h-4 text-green-600 focus:ring-green-500" />
                      <span class="text-sm text-gray-700">Não</span>
                    </label>
                  </div>
                  <input 
                    v-if="form.hasAllergy"
                    v-model="form.allergy" 
                    type="text" 
                    class="input mt-3" 
                    placeholder="Descreva a alergia (Ex: Amendoim, lactose...)" 
                    :required="form.hasAllergy"
                  />
                </div>
              </div>
            </div>

            <!-- SEÇÃO: Dados do Responsável -->
            <div class="border-t pt-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                Dados do Responsável
              </h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label class="block text-sm font-medium text-gray-700 mb-2">CPF do Responsável *</label>
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
              </div>
            </div>

            <!-- SEÇÃO: Endereço -->
            <div class="border-t pt-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                Endereço
              </h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Endereço *</label>
                  <input v-model="form.address" type="text" required class="input" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Número *</label>
                  <input v-model.number="form.addressNumber" type="number" required class="input" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Complemento</label>
                  <input v-model="form.complement" type="text" class="input" placeholder="Ex: Apt 101, Bloco A..." />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Bairro *</label>
                  <input v-model="form.addressDistrict" type="text" required class="input" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Cidade *</label>
                  <input v-model="form.addressCity" type="text" required class="input" />
                </div>
              </div>
            </div>

            <!-- SEÇÃO: Turmas e Plano -->
            <div class="border-t pt-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
                Turmas e Plano
              </h2>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Turmas de Interesse</label>
                  <p class="text-xs text-gray-500 mb-2">Selecione uma ou mais turmas.</p>
                  <div v-if="loadingCrews" class="text-gray-500 text-sm">Carregando turmas...</div>
                  <div v-else class="flex flex-wrap gap-3">
                    <label
                      v-for="c in crews"
                      :key="c.id"
                      class="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-green-300 cursor-pointer"
                      :class="{ 'border-green-500 bg-green-50': form.crewIds.includes(c.id) }"
                    >
                      <input type="checkbox" :value="c.id" v-model="form.crewIds" class="rounded text-green-600" />
                      <span>{{ c.get('Name') }}</span>
                    </label>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Plano de Pagamento</label>
                    <select v-model="form.tipoPlano" class="input">
                      <option value="">Selecione</option>
                      <option value="Mensal">Mensal</option>
                      <option value="Semestral">Semestral</option>
                      <option value="Anual">Anual</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Melhor Dia de Pagamento</label>
                    <select v-model.number="form.melhorDiaPagamento" class="input">
                      <option value="">Selecione</option>
                      <option :value="5">Dia 5</option>
                      <option :value="10">Dia 10</option>
                      <option :value="15">Dia 15</option>
                      <option :value="20">Dia 20</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div class="pt-4">
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
import { ref, onMounted } from 'vue'
import { studentService, crewService } from '../../services/index.js'
import Parse from '../../services/parse.js'
import { UserCircleIcon, CameraIcon } from '@heroicons/vue/24/outline'

const loading = ref(false)
const loadingCrews = ref(false)
const error = ref(null)
const success = ref(false)
const photoFile = ref(null)
const photoPreview = ref(null)
const crews = ref([])

onMounted(async () => {
  loadingCrews.value = true
  try {
    crews.value = await crewService.getCrews(0, 200)
  } catch (err) {
    console.error('Erro ao carregar turmas:', err)
  } finally {
    loadingCrews.value = false
  }
})

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
  crewIds: [],
  tipoPlano: '',
  valorMensalidade: null,
  melhorDiaPagamento: null,
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
      // Campos de alergia
      allergy: form.value.hasAllergy ? form.value.allergy : ''
    }
    
    // Remover hasAllergy do payload (apenas controle do formulário)
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
