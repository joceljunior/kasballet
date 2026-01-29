import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Composable for infinite scroll functionality
 * @param {Function} loadMore - Function to call when more items should be loaded
 * @param {Object} options - Configuration options
 */
export function useInfiniteScroll(loadMore, options = {}) {
  const {
    rootMargin = '100px',
    threshold = 0.1,
    enabled = true
  } = options

  const sentinel = ref(null)
  const loading = ref(false)
  const hasMore = ref(true)
  let observer = null

  const handleIntersect = async (entries) => {
    const entry = entries[0]
    if (entry.isIntersecting && hasMore.value && !loading.value && enabled) {
      loading.value = true
      try {
        await loadMore()
      } finally {
        loading.value = false
      }
    }
  }

  onMounted(() => {
    if (typeof IntersectionObserver !== 'undefined' && sentinel.value) {
      observer = new IntersectionObserver(handleIntersect, {
        rootMargin,
        threshold
      })
      observer.observe(sentinel.value)
    }
  })

  onUnmounted(() => {
    if (observer && sentinel.value) {
      observer.unobserve(sentinel.value)
    }
  })

  return {
    sentinel,
    loading,
    hasMore,
    setHasMore: (value) => { hasMore.value = value },
    setLoading: (value) => { loading.value = value }
  }
}
