<template>
  <div class="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-12 px-4">
    <div class="max-w-2xl mx-auto">
      <div class="bg-white rounded-2xl shadow-xl p-6 md:p-8">
        
        <!-- Loading -->
        <div v-if="loading && !student" class="text-center py-12">
          <svg class="animate-spin h-8 w-8 mx-auto text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="mt-4 text-gray-600">Carregando...</p>
        </div>

        <!-- Erro: aluna não encontrada ou não aprovada -->
        <div v-else-if="errorNotFound" class="text-center py-12">
          <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Link Inválido</h2>
          <p class="text-gray-600">Este link de edição não está disponível.<br>A aluna pode não existir ou ainda não foi aprovada.</p>
        </div>

        <!-- Tela de sucesso após salvar -->
        <div v-else-if="success" class="text-center py-12">
          <div class="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <svg class="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-900 mb-4">Dados Atualizados!</h2>
          <p class="text-lg text-gray-600 mb-3">As informações foram salvas com sucesso.</p>
          <button @click="success = false" class="btn-secondary mt-4">Editar novamente</button>
        </div>

        <!-- Formulário de Edição -->
        <template v-else-if="student">
          <div class="text-center mb-8">
            <div class="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <img v-if="photoPreview || currentPhotoUrl" :src="photoPreview || currentPhotoUrl" alt="Foto" class="w-full h-full object-cover" />
              <UserCircleIcon v-else class="w-14 h-14 text-gray-400" />
            </div>
            <h1 class="text-2xl font-bold text-gray-900 mb-2">Editar Dados</h1>
            <p class="text-gray-600">Atualize as informações de <strong>{{ student.get('name') }}</strong></p>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-8">
            <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {{ error }}
            </div>

            <!-- Foto da aluna -->
            <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-dashed border-green-200">
              <div class="flex flex-col md:flex-row items-center gap-6">
                <div class="w-28 h-28 rounded-full overflow-hidden bg-white shadow-lg flex items-center justify-center flex-shrink-0 ring-4 ring-green-100">
                  <img v-if="photoPreview || currentPhotoUrl" :src="photoPreview || currentPhotoUrl" alt="Preview" class="w-full h-full object-cover" />
                  <div v-else class="text-center">
                    <CameraIcon class="w-8 h-8 text-gray-300 mx-auto" />
                    <span class="text-xs text-gray-400 mt-1">Sem foto</span>
                  </div>
                </div>
                <div class="text-center md:text-left">
                  <h3 class="font-semibold text-gray-900 mb-2">Foto de Perfil</h3>
                  <p class="text-sm text-gray-600 mb-3">Atualize a foto da aluna</p>
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
              
              <!-- Autorização de uso de imagem (opcional) -->
              <div class="mt-4 pt-4 border-t border-green-200">
                <label class="flex items-start gap-3 cursor-pointer">
                  <input v-model="form.useImage" type="checkbox" class="w-5 h-5 mt-0.5 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                  <div>
                    <span class="text-sm font-medium text-gray-700">Autorizo o uso da imagem</span>
                    <p class="text-xs text-gray-500 mt-0.5">Autorizo o uso da imagem da aluna para fins de divulgação em redes sociais e materiais da escola.</p>
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

            <div class="pt-4">
              <button
                type="submit"
                :disabled="saving"
                class="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="saving">Salvando...</span>
                <span v-else>Salvar Alterações</span>
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
import { useRoute } from 'vue-router'
import { studentService } from '../../services/index.js'
import { UserCircleIcon, CameraIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const errorNotFound = ref(false)
const success = ref(false)
const student = ref(null)
const photoFile = ref(null)
const photoPreview = ref(null)
const currentPhotoUrl = ref(null)

const form = ref({
  name: '',
  birthday: '',
  nationality: '',
  schoolName: '',
  schoolGrade: '',
  hasAllergy: false,
  allergy: '',
  nameResponsible: '',
  relationship: '',
  email: '',
  telephone: '',
  address: '',
  addressNumber: '',
  complement: '',
  addressDistrict: '',
  addressCity: '',
  useImage: true
})

function formatDateForInput(date) {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

onMounted(async () => {
  try {
    const studentId = route.params.id
    const s = await studentService.getStudentById(studentId)
    
    // Verificar se aluna existe e está aprovada (active: true)
    if (!s || !s.get('active')) {
      errorNotFound.value = true
      loading.value = false
      return
    }
    
    student.value = s
    
    // Carregar foto atual
    const photo = s.get('photo')
    if (photo) {
      currentPhotoUrl.value = photo.url()
    }
    
    // Preencher formulário
    const allergyValue = s.get('allergy') || ''
    form.value = {
      name: s.get('name') || '',
      birthday: formatDateForInput(s.get('birthday')),
      nationality: s.get('nationality') || '',
      schoolName: s.get('schoolName') || '',
      schoolGrade: s.get('schoolGrade') || '',
      hasAllergy: !!allergyValue,
      allergy: allergyValue,
      nameResponsible: s.get('nameResponsible') || '',
      relationship: s.get('relationship') || '',
      email: s.get('email') || '',
      telephone: s.get('telephone') || '',
      address: s.get('address') || '',
      addressNumber: s.get('addressNumber') || '',
      complement: s.get('complement') || '',
      addressDistrict: s.get('addressDistrict') || '',
      addressCity: s.get('addressCity') || '',
      useImage: s.get('useImage') !== undefined ? s.get('useImage') : true
    }
  } catch (err) {
    console.error('Erro ao carregar aluna:', err)
    errorNotFound.value = true
  } finally {
    loading.value = false
  }
})

function onPhotoChange(e) {
  const file = e.target.files?.[0]
  photoFile.value = file || null
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoPreview.value = file ? URL.createObjectURL(file) : null
  if (file) {
    currentPhotoUrl.value = null
  }
}

async function handleSubmit() {
  saving.value = true
  error.value = null

  try {
    const payload = {
      name: form.value.name,
      birthday: form.value.birthday ? new Date(form.value.birthday) : null,
      nationality: form.value.nationality,
      schoolName: form.value.schoolName,
      schoolGrade: form.value.schoolGrade,
      allergy: form.value.hasAllergy ? form.value.allergy : '',
      nameResponsible: form.value.nameResponsible,
      relationship: form.value.relationship,
      email: form.value.email,
      telephone: form.value.telephone,
      address: form.value.address,
      addressNumber: form.value.addressNumber,
      complement: form.value.complement,
      addressDistrict: form.value.addressDistrict,
      addressCity: form.value.addressCity,
      useImage: form.value.useImage
    }
    
    // Adicionar foto se uma nova foi selecionada (enviar File nativo, o service converte)
    if (photoFile.value) {
      payload.photo = photoFile.value
    }
    
    await studentService.updateStudent(student.value.id, payload)
    success.value = true
  } catch (err) {
    error.value = err.message || 'Erro ao salvar alterações'
  } finally {
    saving.value = false
  }
}
</script>
