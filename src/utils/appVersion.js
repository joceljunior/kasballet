/**
 * Detecta novo deploy e força reload para evitar cache de index.html / bundles antigos.
 * Em desenvolvimento não faz nada.
 */

const POLL_MS = 60_000
const CURRENT_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : ''

let checking = false
let reloading = false

async function fetchRemoteVersion() {
  const res = await fetch(`/version.json?_=${Date.now()}`, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache'
    }
  })
  if (!res.ok) return null
  const data = await res.json()
  return data?.version ? String(data.version) : null
}

function forceReload(remoteVersion) {
  if (reloading) return
  reloading = true
  console.info('[appVersion] Nova versão detectada, recarregando...', {
    current: CURRENT_VERSION,
    remote: remoteVersion
  })
  // Bypass de cache do documento: navega com query descartável e remove no próximo load
  const url = new URL(window.location.href)
  url.searchParams.set('_appv', remoteVersion)
  window.location.replace(url.toString())
}

export async function checkAppVersion() {
  if (import.meta.env.DEV || !CURRENT_VERSION || checking || reloading) return
  checking = true
  try {
    const remote = await fetchRemoteVersion()
    if (remote && remote !== CURRENT_VERSION) {
      forceReload(remote)
    }
  } catch (err) {
    console.warn('[appVersion] Falha ao verificar versão:', err)
  } finally {
    checking = false
  }
}

/**
 * Inicia verificação na abertura, ao focar a aba e em intervalo.
 */
export function startAppVersionWatcher() {
  if (import.meta.env.DEV || !CURRENT_VERSION) return () => {}

  // Remove marcador de reload da URL sem disparar navegação
  try {
    const url = new URL(window.location.href)
    if (url.searchParams.has('_appv')) {
      url.searchParams.delete('_appv')
      window.history.replaceState(window.history.state, '', url.toString())
    }
  } catch (_) {}

  checkAppVersion()

  const onVisible = () => {
    if (document.visibilityState === 'visible') checkAppVersion()
  }
  const onFocus = () => checkAppVersion()

  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('focus', onFocus)
  const timer = window.setInterval(checkAppVersion, POLL_MS)

  return () => {
    document.removeEventListener('visibilitychange', onVisible)
    window.removeEventListener('focus', onFocus)
    window.clearInterval(timer)
  }
}
