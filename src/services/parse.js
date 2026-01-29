import Parse from 'parse'

// Configuração do Back4App
// Usa variáveis de ambiente se disponíveis, senão usa valores padrão (para desenvolvimento)
const applicationId = import.meta.env.VITE_PARSE_APPLICATION_ID || ''
const javascriptKey = import.meta.env.VITE_PARSE_JAVASCRIPT_KEY || ''
const serverURL = import.meta.env.VITE_PARSE_SERVER_URL || 'https://parseapi.back4app.com'

// Inicializar Parse apenas se tiver Application ID e JavaScript Key
if (applicationId && javascriptKey) {
  Parse.initialize(applicationId, javascriptKey)
  Parse.serverURL = serverURL
} else {
  console.error('❌ Parse SDK: Credenciais não configuradas!')
  console.error('Configure as variáveis de ambiente no Railway:')
  console.error('- VITE_PARSE_APPLICATION_ID')
  console.error('- VITE_PARSE_JAVASCRIPT_KEY')
  console.error('- VITE_PARSE_SERVER_URL')
}

export default Parse