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
          <h2 class="text-3xl font-bold text-gray-900 mb-4">Matrícula efetuada com sucesso!</h2>
          <p class="text-lg text-gray-600 mb-3">Obrigado por se cadastrar no Kasballet!</p>
          <div
            v-if="partialNotice"
            class="max-w-md mx-auto mt-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm text-left"
          >
            <p>{{ partialNotice.message }}</p>
            <p class="mt-1 text-xs text-amber-700">Código de referência: {{ partialNotice.reference }}</p>
          </div>
        </div>

        <!-- Formulário (mostrado apenas quando não há sucesso) -->
        <template v-else>
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Cadastro de Aluno</h1>
            <p class="text-gray-600">Preencha os dados abaixo para efetuar a matrícula.</p>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-8">
            <div
              v-if="error"
              ref="errorBoxRef"
              role="alert"
              class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg space-y-1"
            >
              <p class="font-semibold">{{ error.title }}</p>
              <p>{{ error.message }}</p>
              <template v-if="error.kind === 'system'">
                <p class="text-xs text-red-600">Detalhe técnico: {{ error.technical }}</p>
                <p class="text-xs text-red-600">Código de referência: {{ error.reference }}</p>
                <p v-if="error.reported" class="text-xs text-red-600">Nossa equipe foi avisada automaticamente sobre este erro.</p>
                <p v-else-if="error.reporting" class="text-xs text-red-600">Avisando a equipe...</p>
                <p v-else class="text-xs text-red-600">
                  Não conseguimos avisar a equipe automaticamente. Envie o código de referência para
                  <a :href="`mailto:${supportEmail}?subject=Erro no cadastro ${error.reference}`" class="underline">{{ supportEmail }}</a>.
                </p>
              </template>
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
                  <label class="block text-sm font-medium text-gray-700 mb-2">Possui Alergia/Restrição Alimentar?</label>
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
                  <p class="text-xs text-gray-500 mb-2">Selecione uma ou mais turmas.</p>
                  <AppLoading v-if="loadingCrews" size="sm" inline message="Carregando turmas..." />
                  <div v-else-if="crewsError" class="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Não foi possível carregar as turmas. {{ crewsError }}
                    <button type="button" class="underline ml-1" @click="loadCrews">Tentar novamente</button>
                  </div>
                  <div v-else class="flex flex-wrap gap-3">
                    <label
                      v-for="c in crews"
                      :key="c.id"
                      class="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-green-300 cursor-pointer"
                      :class="{ 'border-green-500 bg-green-50': form.crewIds.includes(c.id) }"
                    >
                      <input type="checkbox" :value="c.id" v-model="form.crewIds" class="rounded text-green-600" />
                      <span class="font-medium">{{ c.get('Name') }}</span>
                      <span v-if="c.get('Key')" class="text-xs text-gray-500">({{ c.get('Key') }})</span>
                    </label>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Plano de Pagamento</label>
                    <select v-model="form.tipoPlano" class="input">
                      <option value="">Selecione</option>
                      <option value="MensalRecorrente">Mensal Recorrente</option>
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
import { ref, onMounted, nextTick } from 'vue'
import { studentService, crewService } from '../../services/index.js'
import Parse from '../../services/parse.js'
import { notifyRegistrationSuccess, reportRegistrationError } from '../../services/notifications.js'
import {
  SUPPORT_EMAIL,
  STEP_LABELS,
  ValidationError,
  generateReference,
  describeRegistrationError,
  validateRegistration
} from '../../utils/registrationErrors.js'
import { parseDateForStorage } from '../../utils/date.js'
import { UserCircleIcon, CameraIcon } from '@heroicons/vue/24/outline'
import AppLoading from '../../components/common/AppLoading.vue'

const loading = ref(false)
const loadingCrews = ref(false)
const error = ref(null) // { kind, title, message, technical, reference, reporting, reported }
const success = ref(false)
const partialNotice = ref(null)
const errorBoxRef = ref(null)
const crewsError = ref('')
const supportEmail = SUPPORT_EMAIL
const photoFile = ref(null)
const photoPreview = ref(null)
const crews = ref([])

async function loadCrews() {
  loadingCrews.value = true
  crewsError.value = ''
  try {
    crews.value = await crewService.getCrews(0, 200, { active: true })
  } catch (err) {
    console.error('Erro ao carregar turmas:', err)
    const { message, technical } = describeRegistrationError(err, 'carregar_turmas')
    crewsError.value = message
    reportRegistrationError({
      reference: generateReference(),
      step: STEP_LABELS.carregar_turmas,
      message,
      technical
    })
  } finally {
    loadingCrews.value = false
  }
}

onMounted(loadCrews)

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

function photoFileName(file) {
  // O servidor rejeita nomes com acentos/parênteses; usa um nome seguro
  const ext = (String(file.name || '').split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  return `photo-${Date.now()}.${ext}`
}

async function showSystemError(err, step, extra = {}) {
  const reference = generateReference()
  const { message, technical, code } = describeRegistrationError(err, step)
  error.value = {
    kind: 'system',
    title: `Erro: ${STEP_LABELS[step] || 'cadastro'}`,
    message,
    technical,
    reference,
    reporting: true,
    reported: false
  }
  nextTick(() => errorBoxRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' }))

  const reported = await reportRegistrationError({
    reference,
    step: STEP_LABELS[step] || step,
    message,
    code,
    technical,
    form: {
      name: form.value.name,
      nameResponsible: form.value.nameResponsible,
      email: form.value.email,
      telephone: form.value.telephone
    },
    ...extra
  })
  if (error.value?.reference === reference) {
    error.value = { ...error.value, reporting: false, reported }
  }
  return { reference, message, reported }
}

async function handleSubmit() {
  loading.value = true
  error.value = null
  success.value = false
  partialNotice.value = null

  let step = 'validacao'
  try {
    validateRegistration(form.value, photoFile.value)

    // Preparar dados para envio
    const data = {
      ...form.value,
      email: String(form.value.email).trim(),
      birthday: form.value.birthday ? parseDateForStorage(form.value.birthday) : null,
      // Campos de alergia
      allergy: form.value.hasAllergy ? form.value.allergy : ''
    }

    // Remover hasAllergy do payload (apenas controle do formulário)
    delete data.hasAllergy

    // Enviar a foto antes, para identificar falhas desta etapa
    if (photoFile.value) {
      step = 'envio_foto'
      const file = new Parse.File(photoFileName(photoFile.value), photoFile.value)
      await file.save()
      data.photo = file
    }

    // Registro público: cria como pendente (isPublicRegistration = true)
    step = 'criacao_cadastro'
    const student = await studentService.createStudent(data, true)
    success.value = true
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // Avisa a equipe por e-mail (não bloqueia nem afeta o cliente)
    notifyRegistrationSuccess(student.id)
  } catch (err) {
    if (err instanceof ValidationError) {
      error.value = { kind: 'validation', title: 'Confira os dados', message: err.message }
      nextTick(() => errorBoxRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
    } else if (err?.partialStudentId) {
      // Matrícula criada, mas as turmas não foram vinculadas: o cliente vê sucesso e a equipe é avisada
      success.value = true
      window.scrollTo({ top: 0, behavior: 'smooth' })
      const result = await showSystemError(err, 'vinculo_turmas', { partialStudentId: err.partialStudentId })
      error.value = null
      partialNotice.value = { message: result.message, reference: result.reference }
      notifyRegistrationSuccess(err.partialStudentId)
    } else {
      console.error(`Erro no cadastro (${step}):`, err)
      await showSystemError(err, step)
    }
  } finally {
    loading.value = false
  }
}
</script>
