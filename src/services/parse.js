import Parse from 'parse'
// Importação explícita do InstallationController para garantir que esteja
// registrado no CoreManager (evita erro "currentInstallationId" de undefined)
import InstallationController from 'parse/lib/browser/InstallationController.js'

const applicationId = import.meta.env.VITE_PARSE_APPLICATION_ID
const javascriptKey = import.meta.env.VITE_PARSE_JAVASCRIPT_KEY
const serverURL = import.meta.env.VITE_PARSE_SERVER_URL

let isParseInitialized = false

// Initialize Parse SDK
if (applicationId && javascriptKey) {
  Parse.initialize(applicationId, javascriptKey)
  // Garantir InstallationController (corrige "currentInstallationId" undefined no login)
  const controller = InstallationController?.default ?? InstallationController
  if (controller) {
    Parse.CoreManager.setInstallationController(controller)
  }
  if (serverURL) {
    Parse.serverURL = serverURL
  }
  isParseInitialized = true
} else {
  console.warn('Parse SDK: Missing environment variables. Copy .env.example to .env and set VITE_PARSE_APPLICATION_ID, VITE_PARSE_JAVASCRIPT_KEY and VITE_PARSE_SERVER_URL')
}

export default Parse
export { isParseInitialized }