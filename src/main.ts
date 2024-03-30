import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice';

import App from './App.vue'
import router from './router'
import 'primevue/resources/themes/aura-light-green/theme.css'
import 'primeflex/primeflex.css'
import 'primeicons/primeicons.css'
import ToastService from 'primevue/toastservice';
const app = createApp(App)
app.use(PrimeVue)
app.use(ConfirmationService);
app.use(ToastService);
app.use(createPinia())
app.use(router)

app.mount('#app')
