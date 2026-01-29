<template>
  <div class="space-y-6 pb-20 md:pb-6">
      <h1 class="text-2xl font-bold text-gray-900">{{ isEdit ? 'Editar Aluno' : 'Novo Aluno' }}</h1>

      <form @submit.prevent="handleSubmit" class="card space-y-6">
        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {{ error }}
        </div>

        <!-- Foto da aluna -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Foto da aluna</label>
          <div class="flex items-center gap-4">
            <div class="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
              <img v-if="photoPreview || currentPhotoUrl" :src="photoPreview || currentPhotoUrl" alt="Preview" class="w-full h-full object-cover" />
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
            <input v-model="form.cpf" type="text" required :disabled="isEdit" class="input" :class="{ 'bg-gray-100 cursor-not-allowed': isEdit }" />
            <p v-if="isEdit" class="text-xs text-gray-500 mt-1">CPF não pode ser alterado</p>
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

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">Turmas</label>
            <p class="text-xs text-gray-500 mb-2">A aluna pode estar em mais de uma turma.</p>
            <div class="flex flex-wrap gap-3">
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
            <input v-model="form.complement" type="text" class="input" placeholder="Ex: Apt 101, Bloco A..." />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Melhor Dia de Pagamento</label>
            <input v-model.number="form.melhorDiaPagamento" type="number" min="1" max="31" class="input" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Plano</label>
            <select v-model="form.tipoPlano" class="input">
              <option value="">Selecione</option>
              <option value="PIX">PIX</option>
              <option value="RecorrenteMensal">Recorrente Mensal</option>
              <option value="RecorrenteAnual">Recorrente Anual</option>
              <option value="RecorrenteSemestral">Recorrente Semestral</option>
            </select>
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">Possui Alergia *</label>
            <div class="flex items-center gap-6">
              <label class="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  :value="true"
                  v-model="form.hasAllergy" 
                  class="w-4 h-4 text-green-600 focus:ring-green-500"
                />
                <span class="text-sm text-gray-700">Sim</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  :value="false"
                  v-model="form.hasAllergy" 
                  class="w-4 h-4 text-green-600 focus:ring-green-500"
                />
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

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Nome da Escola</label>
            <input v-model="form.schoolName" type="text" class="input" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Série/Ano Escolar</label>
            <input v-model="form.schoolGrade" type="text" class="input" placeholder="Ex: 3º ano, 1ª série..." />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Nome do Responsável *</label>
            <input v-model="form.nameResponsible" type="text" required class="input" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Parentesco *</label>
            <input v-model="form.relationship" type="text" required class="input" placeholder="Ex: Mãe, Pai, Avó..." />
          </div>
        </div>

        <div class="flex gap-4">
          <button type="submit" :disabled="loading" class="btn-primary disabled:opacity-50">
            {{ loading ? 'Salvando...' : 'Salvar' }}
          </button>
          <router-link :to="isEdit ? `/alunos/${route.params.id}` : '/alunos'" class="btn-secondary">
            Cancelar
          </router-link>
        </div>
      </form>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStudentStore } from '../../stores/student'
import { studentService, crewService } from '../../services/index.js'
import Parse from '../../services/parse.js'
import { UserCircleIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const studentStore = useStudentStore()
const loading = ref(false)
const error = ref(null)
const crews = ref([])
const photoFile = ref(null)
const photoPreview = ref(null)
const currentPhotoUrl = ref(null)

const isEdit = computed(() => !!route.params.id && route.params.id !== 'novo')

const form = ref({
  name: '',
  cpf: '',
  email: '',
  telephone: '',
  birthday: '',
  crewIds: [],
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
  melhorDiaPagamento: null,
  tipoPlano: '',
  active: true,
  dateRegistry: new Date(),
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
    crews.value = await crewService.getCrews(0, 200)
    
    if (isEdit.value) {
      loading.value = true
      const student = await studentService.getStudentById(route.params.id)
      const map = await studentService.getCrewsForStudents([student])
      const studentCrews = map[student.id] || []
      
      // Carregar foto atual se existir
      const photo = student.get('photo')
      if (photo) {
        currentPhotoUrl.value = photo.url()
      }
      
      // Preencher formulário com dados do aluno
      const allergyValue = student.get('allergy') || ''
      form.value = {
        name: student.get('name') || '',
        cpf: student.get('cpf') || '',
        email: student.get('email') || '',
        telephone: student.get('telephone') || '',
        birthday: formatDateForInput(student.get('birthday')),
        crewIds: studentCrews.map(c => c.id),
        nationality: student.get('nationality') || 'Brasileira',
        address: student.get('address') || '',
        addressNumber: student.get('addressNumber') || '',
        addressDistrict: student.get('addressDistrict') || '',
        addressCity: student.get('addressCity') || '',
        complement: student.get('complement') || '',
        hasAllergy: !!allergyValue,
        allergy: allergyValue,
        nameResponsible: student.get('nameResponsible') || '',
        relationship: student.get('relationship') || '',
        schoolName: student.get('schoolName') || '',
        schoolGrade: student.get('schoolGrade') || '',
        melhorDiaPagamento: student.get('melhorDiaPagamento') || null,
        tipoPlano: student.get('tipoPlano') || '',
        active: student.get('active') !== undefined ? student.get('active') : true,
        dateRegistry: student.get('dateRegistry') || new Date(),
        useImage: student.get('useImage') !== undefined ? student.get('useImage') : true
      }
      loading.value = false
    }
  } catch (err) {
    error.value = err.message || 'Erro ao carregar dados'
    loading.value = false
    if (isEdit.value) {
      router.push('/alunos')
    }
  }
})

function onPhotoChange(e) {
  const file = e.target.files?.[0]
  photoFile.value = file || null
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoPreview.value = file ? URL.createObjectURL(file) : null
  // Limpar foto atual quando uma nova é selecionada
  if (file) {
    currentPhotoUrl.value = null
  }
}

async function handleSubmit() {
  loading.value = true
  error.value = null

  try {
    const payload = { ...form.value }
    
    // Remover hasAllergy do payload (é apenas para controle do formulário)
    delete payload.hasAllergy
    
    // Se não possui alergia, limpar o campo allergy
    if (!form.value.hasAllergy) {
      payload.allergy = ''
    }
    
    // Converter data de nascimento para Date se necessário
    if (payload.birthday && typeof payload.birthday === 'string') {
      payload.birthday = new Date(payload.birthday)
    }
    
    // Converter data de registro para Date se necessário
    if (payload.dateRegistry && typeof payload.dateRegistry === 'string') {
      payload.dateRegistry = new Date(payload.dateRegistry)
    }
    
    // Adicionar foto se uma nova foi selecionada
    if (photoFile.value) {
      payload.photo = new Parse.File(photoFile.value.name, photoFile.value)
    }
    
    if (isEdit.value) {
      // Atualizar aluno existente
      await studentStore.updateStudent(route.params.id, payload)
      router.push(`/alunos/${route.params.id}`)
    } else {
      // Criar novo aluno pelo Master - cria como ativo (isPublicRegistration = false)
      const student = await studentStore.createStudent(payload, false)
      router.push(`/alunos/${student.id}`)
    }
  } catch (err) {
    error.value = err.message || (isEdit.value ? 'Erro ao atualizar aluno' : 'Erro ao criar aluno')
  } finally {
    loading.value = false
  }
}
</script>
