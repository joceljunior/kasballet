<template>
  <div>
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-1">{{ label }}</label>
    <div
      class="input flex items-center justify-between gap-2 cursor-pointer min-w-[200px]"
      @click="popupOpen = true"
    >
      <span :class="selectedName ? 'text-gray-900' : 'text-gray-500'" class="truncate">
        {{ selectedName || placeholder }}
      </span>
      <div class="flex items-center gap-1 flex-shrink-0">
        <button
          v-if="modelValue"
          type="button"
          class="p-1 rounded hover:bg-gray-200 text-gray-500"
          title="Limpar"
          @click.stop="clear"
        >
          <XMarkIcon class="w-4 h-4" />
        </button>
        <ChevronDownIcon class="w-5 h-5 text-gray-400" />
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="popupOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click.self="popupOpen = false"
      >
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[85vh] flex flex-col" @click.stop>
          <div class="p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Selecionar aluna</h3>
            <input
              ref="filterInputRef"
              v-model="filterText"
              type="text"
              class="input mt-3"
              placeholder="Filtrar por nome..."
              autocomplete="off"
            />
          </div>
          <div class="overflow-y-auto flex-1 min-h-0 p-2">
            <AppLoading v-if="loading" size="sm" inline message="Carregando alunas..." />
            <p v-else-if="filteredStudents.length === 0" class="text-sm text-gray-500 py-4 text-center">
              {{ filterText ? 'Nenhuma aluna encontrada.' : 'Nenhuma aluna carregada.' }}
            </p>
            <button
              v-for="s in filteredStudents"
              :key="s.id"
              type="button"
              class="w-full text-left px-3 py-2.5 rounded-lg hover:bg-green-50 transition-colors"
              :class="modelValue === s.id ? 'bg-green-100 text-green-900' : 'text-gray-900'"
              @click="select(s.id)"
            >
              {{ s.get('name') }}
            </button>
          </div>
          <div class="p-3 border-t border-gray-200">
            <button type="button" class="btn-secondary w-full" @click="popupOpen = false">Fechar</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { ChevronDownIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { studentService } from '../../services/index.js'
import AppLoading from './AppLoading.vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: 'Aluna' },
  placeholder: { type: String, default: 'Todas as alunas' }
})

const emit = defineEmits(['update:modelValue', 'change'])

const students = ref([])
const loading = ref(false)
const popupOpen = ref(false)
const filterText = ref('')
const filterInputRef = ref(null)

const selectedName = computed(() => {
  if (!props.modelValue) return ''
  const s = students.value.find((x) => x.id === props.modelValue)
  return s?.get('name') || ''
})

const filteredStudents = computed(() => {
  const q = String(filterText.value || '').trim().toLowerCase()
  if (!q) return [...students.value]
  return students.value.filter((s) => (s.get('name') || '').toLowerCase().includes(q))
})

async function loadStudents() {
  loading.value = true
  try {
    const list = await studentService.getStudents(0, 500, { active: true })
    students.value = list || []
    if (props.modelValue && !students.value.some((x) => x.id === props.modelValue)) {
      try {
        const one = await studentService.getStudentById(props.modelValue)
        if (one) students.value = [one, ...students.value]
      } catch (_) {}
    }
  } catch (_) {
    students.value = []
  } finally {
    loading.value = false
  }
}

function select(id) {
  emit('update:modelValue', id)
  emit('change', id)
  popupOpen.value = false
}

function clear() {
  emit('update:modelValue', '')
  emit('change', '')
}

watch(popupOpen, async (open) => {
  if (!open) return
  filterText.value = ''
  if (students.value.length === 0) await loadStudents()
  await nextTick()
  filterInputRef.value?.focus()
})

watch(() => props.modelValue, async (id) => {
  if (id && students.value.length > 0 && !students.value.some((x) => x.id === id)) {
    try {
      const one = await studentService.getStudentById(id)
      if (one) students.value = [one, ...students.value]
    } catch (_) {}
  }
})

loadStudents()
</script>
