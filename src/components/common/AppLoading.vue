<template>
  <div :class="containerClass" role="status" aria-live="polite" aria-busy="true">
    <div class="app-loading-spinner" :class="spinnerSizeClass">
      <span class="app-loading-spinner__ring" />
      <span class="app-loading-spinner__ring app-loading-spinner__ring--delay" />
    </div>
    <p v-if="message" :class="messageClass">{{ message }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: {
    type: String,
    default: 'Carregando...'
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  card: {
    type: Boolean,
    default: false
  },
  inline: {
    type: Boolean,
    default: false
  }
})

const containerClass = computed(() => {
  if (props.inline) return 'flex flex-col items-center justify-center py-2'
  if (props.card) return 'card flex flex-col items-center justify-center text-center py-12'
  return 'flex flex-col items-center justify-center text-center py-8'
})

const spinnerSizeClass = computed(() => ({
  sm: 'app-loading-spinner--sm',
  md: 'app-loading-spinner--md',
  lg: 'app-loading-spinner--lg'
}[props.size]))

const messageClass = computed(() => {
  const sizes = {
    sm: 'text-xs mt-2 text-gray-500',
    md: 'text-sm mt-4 text-gray-600',
    lg: 'text-base mt-5 text-gray-600'
  }
  return sizes[props.size]
})
</script>

<style scoped>
.app-loading-spinner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-loading-spinner--sm {
  width: 2rem;
  height: 2rem;
}

.app-loading-spinner--md {
  width: 3rem;
  height: 3rem;
}

.app-loading-spinner--lg {
  width: 4rem;
  height: 4rem;
}

.app-loading-spinner__ring {
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  border: 3px solid transparent;
  border-top-color: #ec4899;
  border-right-color: #111827;
  animation: app-loading-spin 0.9s linear infinite;
}

.app-loading-spinner__ring--delay {
  inset: 6px;
  border-top-color: #111827;
  border-right-color: #ec4899;
  animation-direction: reverse;
  animation-duration: 1.2s;
}

.app-loading-spinner--sm .app-loading-spinner__ring {
  border-width: 2px;
}

.app-loading-spinner--sm .app-loading-spinner__ring--delay {
  inset: 4px;
}

@keyframes app-loading-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
