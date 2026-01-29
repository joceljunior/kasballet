import Parse from 'parse'

// IMPORTANTE: No Vite, as variáveis de ambiente são substituídas em TEMPO DE BUILD
// Elas precisam estar disponíveis quando o Railway executa `npm run build`
const applicationId = import.meta.env.VITE_PARSE_APPLICATION_ID
const javascriptKey = import.meta.env.VITE_PARSE_JAVASCRIPT_KEY
const serverURL = import.meta.env.VITE_PARSE_SERVER_URL

let isParseInitialized = false

// Initialize Parse SDK
if (applicationId && javascriptKey) {
  Parse.initialize(applicationId, javascriptKey)
  
  if (serverURL) {
    Parse.serverURL = serverURL
  }
  
  isParseInitialized = true
} else {
  const missingVars = []
  if (!applicationId) missingVars.push('VITE_PARSE_APPLICATION_ID')
  if (!javascriptKey) missingVars.push('VITE_PARSE_JAVASCRIPT_KEY')
  if (!serverURL) missingVars.push('VITE_PARSE_SERVER_URL')
  
  console.error('❌ Parse SDK: Variáveis de ambiente faltando:', missingVars.join(', '))
  console.error('📝 Configure no Railway: Settings > Variables')
  console.error('⚠️  IMPORTANTE: As variáveis devem estar disponíveis durante o BUILD (npm run build)')
  console.error('🔧 Após adicionar as variáveis, faça um novo deploy no Railway')
}

export default Parse
export { isParseInitialized }