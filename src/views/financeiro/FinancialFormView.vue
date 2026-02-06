<template>
  <div class="space-y-6 pb-20 md:pb-6">
    <h1 class="text-2xl font-bold text-gray-900">{{ isEdit ? 'Editar Lançamento' : 'Novo Lançamento' }}</h1>

    <form @submit.prevent="handleSubmit" class="card space-y-6">
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {{ error }}
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
        <div class="flex gap-6">
          <label class="flex items-center">
            <input v-model="form.type" type="radio" value="entrada" class="text-green-600 focus:ring-green-500" />
            <span class="ml-2">Entrada</span>
          </label>
          <label class="flex items-center">
            <input v-model="form.type" type="radio" value="saida" class="text-green-600 focus:ring-green-500" />
            <span class="ml-2">Saída</span>
          </label>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Status *</label>
        <div class="flex gap-6">
          <label class="flex items-center">
            <input v-model="form.status" type="radio" value="pendente" class="text-amber-500 focus:ring-amber-500" />
            <span class="ml-2">Pendente</span>
          </label>
          <label class="flex items-center">
            <input v-model="form.status" type="radio" value="efetivado" class="text-green-600 focus:ring-green-500" />
            <span class="ml-2">Efetivado</span>
          </label>
        </div>
        <p class="text-xs text-gray-500 mt-1">Pendente entra no saldo projetado; efetivado entra no saldo efetivo e no projetado.</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Subtipo *</label>
        <select v-model="form.subtype" required class="input md:max-w-xs">
          <option value="">Selecione</option>
          <template v-if="form.type === 'entrada'">
            <option value="mensalidade">Mensalidade</option>
            <option value="rematricula">Rematrícula</option>
            <option value="taxa_participacao">Taxa de Participação</option>
            <option value="figurino">Figurino</option>
            <option value="vendas">Vendas</option>
            <option value="outros">Outros</option>
          </template>
          <template v-if="form.type === 'saida'">
            <option value="pagamento">Pagamento</option>
            <option value="contas">Contas</option>
            <option value="compras">Compras</option>
            <option value="impostos">Impostos</option>
            <option value="outros">Outros</option>
          </template>
        </select>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Data *</label>
          <input v-model="form.date" type="date" required class="input" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Valor (R$) *</label>
          <input v-model="form.value" type="number" step="0.01" min="0" required class="input" placeholder="0,00" />
        </div>
      </div>

      <!-- Mensalidade, Rematrícula, Taxa de Participação, Figurino: obrigatório Aluna (popup com filtro) -->
      <div v-if="form.type === 'entrada' && ['mensalidade', 'rematricula', 'taxa_participacao', 'figurino'].includes(form.subtype)">
        <label class="block text-sm font-medium text-gray-700 mb-2">Aluna *</label>
        <div
          class="input md:max-w-md flex items-center justify-between gap-2 cursor-pointer"
          @click="studentPopupOpen = true"
        >
          <span :class="selectedStudentName ? 'text-gray-900' : 'text-gray-500'">{{ selectedStudentName || 'Clique para selecionar a aluna' }}</span>
          <div class="flex items-center gap-1 flex-shrink-0">
            <button
              v-if="form.studentId"
              type="button"
              @click.stop="form.studentId = ''"
              class="p-1 rounded hover:bg-gray-200 text-gray-500"
              title="Limpar"
            >
              <XMarkIcon class="w-5 h-5" />
            </button>
            <ChevronDownIcon class="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      <!-- Popup Selecionar aluna -->
      <Teleport to="body">
        <div
          v-if="studentPopupOpen"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          @click.self="studentPopupOpen = false"
        >
          <div class="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[85vh] flex flex-col" @click.stop>
            <div class="p-4 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900">Selecionar aluna</h3>
              <input
                ref="studentFilterInputRef"
                v-model="studentFilterText"
                type="text"
                class="input mt-3"
                placeholder="Filtrar por nome..."
                autocomplete="off"
              />
            </div>
            <div class="overflow-y-auto flex-1 min-h-0 p-2">
              <p v-if="filteredStudentsForPopup.length === 0" class="text-sm text-gray-500 py-4 text-center">
                {{ studentFilterText ? 'Nenhuma aluna encontrada.' : 'Nenhuma aluna carregada.' }}
              </p>
              <button
                v-for="s in filteredStudentsForPopup"
                :key="s.id"
                type="button"
                class="w-full text-left px-3 py-2.5 rounded-lg hover:bg-green-50 transition-colors"
                :class="form.studentId === s.id ? 'bg-green-100 text-green-900' : 'text-gray-900'"
                @click="form.studentId = s.id; studentPopupOpen = false"
              >
                {{ s.get('name') }}
              </button>
            </div>
            <div class="p-3 border-t border-gray-200">
              <button type="button" class="btn-secondary w-full" @click="studentPopupOpen = false">Fechar</button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Vendas / Outros (entrada): obrigatório Descrição -->
      <div v-if="form.type === 'entrada' && (form.subtype === 'vendas' || form.subtype === 'outros')">
        <label class="block text-sm font-medium text-gray-700 mb-2">Descrição *</label>
        <input v-model="form.description" type="text" required class="input" placeholder="Ex: venda de collant" />
      </div>

      <!-- Pagamento: obrigatório Professora -->
      <div v-if="form.type === 'saida' && form.subtype === 'pagamento'">
        <label class="block text-sm font-medium text-gray-700 mb-2">Professora *</label>
        <select v-model="form.teacherId" required class="input md:max-w-md">
          <option value="">Selecione a professora</option>
          <option v-for="t in teachers" :key="t.id" :value="t.id">
            {{ t.get('username') }}{{ t.get('active') === false ? ' — Inativa' : '' }}
          </option>
        </select>
      </div>

      <!-- Contas, Compras, Impostos, Outros (saída): obrigatório Descrição -->
      <div v-if="form.type === 'saida' && ['contas','compras','impostos','outros'].includes(form.subtype)">
        <label class="block text-sm font-medium text-gray-700 mb-2">Descrição *</label>
        <input v-model="form.description" type="text" required class="input" placeholder="Ex: conta de luz" />
      </div>

      <div class="flex gap-4">
        <button type="submit" :disabled="loading" class="btn-primary disabled:opacity-50">
          {{ loading ? 'Salvando...' : 'Salvar' }}
        </button>
        <router-link to="/financeiro/lancamentos" class="btn-secondary">Cancelar</router-link>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFinancialStore } from '../../stores/financial'
import { studentService, teacherService } from '../../services/index.js'
import { XMarkIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const financialStore = useFinancialStore()
const loading = ref(false)
const error = ref(null)
const students = ref([])
const teachers = ref([])
const skipClearWatchers = ref(false)

const studentPopupOpen = ref(false)
const studentFilterText = ref('')
const studentFilterInputRef = ref(null)

const isEdit = computed(() => !!route.params.id && route.params.id !== 'novo')

const selectedStudentName = computed(() => {
  const s = students.value.find((x) => x.id === form.value.studentId)
  return s?.get('name') || ''
})

const filteredStudentsForPopup = computed(() => {
  const q = String(studentFilterText.value || '').trim().toLowerCase()
  if (!q) return [...students.value]
  return students.value.filter((s) => (s.get('name') || '').toLowerCase().includes(q))
})

const form = ref({
  type: 'entrada',
  subtype: '',
  status: 'efetivado',
  date: new Date().toISOString().slice(0, 10),
  value: '',
  description: '',
  studentId: '',
  teacherId: ''
})

function getDateInputValue(d) {
  if (!d) return ''
  const x = d instanceof Date ? d : new Date(d)
  return isNaN(x.getTime()) ? '' : x.toISOString().slice(0, 10)
}

watch(() => form.value.type, () => {
  if (skipClearWatchers.value) return
  form.value.subtype = ''
  form.value.studentId = ''
  form.value.teacherId = ''
  form.value.description = ''
})
watch(() => form.value.subtype, () => {
  if (skipClearWatchers.value) return
  form.value.studentId = ''
  form.value.teacherId = ''
  form.value.description = ''
})

watch(studentPopupOpen, async (open) => {
  if (open) {
    studentFilterText.value = ''
    await nextTick()
    studentFilterInputRef.value?.focus()
  }
})

onMounted(async () => {
  try {
    if (isEdit.value) {
      loading.value = true
      const e = await financialStore.getEntryById(route.params.id)
      const [s, t] = await Promise.all([
        studentService.getStudents(0, 500, { active: true }),
        teacherService.getTeachers()
      ])
      students.value = s || []
      teachers.value = t || []

      const sid = e.get('studentId')
      const tid = e.get('teacherId')
      if (sid && !students.value.some((x) => x.id === sid)) {
        try {
          const one = await studentService.getStudentById(sid)
          if (one) students.value = [one, ...students.value]
        } catch (_) {}
      }
      if (tid && !teachers.value.some((x) => x.id === tid)) {
        try {
          const one = await teacherService.getTeacherById(tid)
          if (one) teachers.value = [one, ...teachers.value]
        } catch (_) {}
      }

      skipClearWatchers.value = true
      form.value = {
        type: e.get('type') || 'entrada',
        subtype: e.get('subtype') || '',
        status: e.get('status') === 'pendente' ? 'pendente' : 'efetivado',
        date: getDateInputValue(e.get('date')),
        value: e.get('value') ?? '',
        description: e.get('description') || '',
        studentId: sid || '',
        teacherId: tid || ''
      }
      await nextTick()
      skipClearWatchers.value = false
    } else {
      const [s, t] = await Promise.all([
        studentService.getStudents(0, 500, { active: true }),
        teacherService.getTeachers()
      ])
      students.value = s || []
      teachers.value = t || []

      if (route.query.studentId) {
        form.value.type = 'entrada'
        form.value.subtype = 'mensalidade'
        form.value.studentId = route.query.studentId
      }
      if (route.query.teacherId) {
        form.value.type = 'saida'
        form.value.subtype = 'pagamento'
        form.value.teacherId = route.query.teacherId
      }
    }
  } catch (err) {
    error.value = err?.message || 'Erro ao carregar'
    if (isEdit.value) router.push('/financeiro/lancamentos')
  } finally {
    loading.value = false
  }
})

async function handleSubmit() {
  error.value = null
  const subtypesRequiringStudent = ['mensalidade', 'rematricula', 'taxa_participacao', 'figurino']
  if (form.value.type === 'entrada' && subtypesRequiringStudent.includes(form.value.subtype) && !form.value.studentId) {
    const subtypeLabels = {
      mensalidade: 'mensalidade',
      rematricula: 'rematrícula',
      taxa_participacao: 'taxa de participação',
      figurino: 'figurino'
    }
    error.value = `Selecione a aluna para ${subtypeLabels[form.value.subtype]}.`
    return
  }
  if (form.value.type === 'entrada' && ['vendas','outros'].includes(form.value.subtype) && !String(form.value.description || '').trim()) {
    error.value = 'Descrição é obrigatória para vendas e outros (entrada).'
    return
  }
  if (form.value.type === 'saida' && form.value.subtype === 'pagamento' && !form.value.teacherId) {
    error.value = 'Selecione a professora para pagamento.'
    return
  }
  if (form.value.type === 'saida' && ['contas','compras','impostos','outros'].includes(form.value.subtype) && !String(form.value.description || '').trim()) {
    error.value = 'Descrição é obrigatória para contas, compras, impostos e outros (saída).'
    return
  }

  loading.value = true
  try {
    const payload = {
      type: form.value.type,
      subtype: form.value.subtype,
      status: form.value.status === 'pendente' ? 'pendente' : 'efetivado',
      date: form.value.date,
      value: Number(form.value.value) || 0,
      description: String(form.value.description || '').trim(),
      studentId: (form.value.type === 'entrada' && subtypesRequiringStudent.includes(form.value.subtype)) ? form.value.studentId : null,
      teacherId: (form.value.type === 'saida' && form.value.subtype === 'pagamento') ? form.value.teacherId : null
    }
    if (isEdit.value) {
      await financialStore.updateEntry(route.params.id, payload)
      router.push('/financeiro/lancamentos')
    } else {
      await financialStore.createEntry(payload)
      router.push('/financeiro/lancamentos')
    }
  } catch (err) {
    error.value = err?.message || 'Erro ao salvar'
  } finally {
    loading.value = false
  }
}
</script>
