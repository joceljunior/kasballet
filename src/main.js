import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
// Import Parse first to ensure it's initialized before stores
import './services/parse'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
