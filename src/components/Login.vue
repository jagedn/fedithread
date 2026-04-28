<script setup lang="ts">
import { ref } from 'vue';
import { Share2 } from 'lucide-vue-next';

const instance = ref('');
const loading = ref(false);
const error = ref('');

const getRedirectUri = () => {
  const path = window.location.pathname.replace(/\/[^\/]*$/, '');
  return `${window.location.origin}${path}/`.replace(/\/+$/, '/');
};

const handleLogin = async () => {
  if (!instance.value) return;

  loading.value = true;
  error.value = '';

  // Limpiar la URL por si el usuario pone https://
  const domain = instance.value.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const redirectUri = getRedirectUri();
  try {
    // 1. Registrar la App en la instancia del usuario
    // Nota: En una App real, estos datos deberían ser consistentes
    const response = await fetch(`https://${domain}/api/v1/apps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: 'FediThread',
        redirect_uris: redirectUri,
        scopes: 'read write follow',
        website: window.location.origin
      })
    });

    const appData = await response.json();

    // Guardamos temporalmente los datos de la app para el callback
    localStorage.setItem('temp_app_data', JSON.stringify({
      ...appData,
      instance: domain
    }));

    // 2. Redirigir al OAuth
    const authUrl = `https://${domain}/oauth/authorize?client_id=${appData.client_id}&scope=read+write+follow&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;

    window.location.href = authUrl;
  } catch (err) {
    error.value = 'No se pudo conectar con la instancia. Revisa el dominio.';
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-card">
    <div class="logo-area">
      <Share2 :size="48" class="icon" />
      <h1>FediThread</h1>
      <p>Crea hilos perfectos en el Fediverso</p>
    </div>

    <div class="input-group">
      <label>Introduce tu instancia</label>
      <input
          v-model="instance"
          type="text"
          placeholder="ej: mastodon.social"
          @keyup.enter="handleLogin"
          :disabled="loading"
      />
      <p v-if="error" class="error-msg">{{ error }}</p>
    </div>

    <button @click="handleLogin" :disabled="loading || !instance" class="login-btn">
      {{ loading ? 'Conectando...' : 'Empezar' }}
    </button>
  </div>
</template>

<style scoped>
.login-card {
  background: #1f232b;
  padding: 2.5rem;
  border-radius: 12px;
  border: 1px solid #393f4f;
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.logo-area h1 { margin: 1rem 0 0.5rem; color: #fff; }
.logo-area p { color: #707788; margin-bottom: 2rem; }
.icon { color: #2b90d9; }

.input-group {
  text-align: left;
  margin-bottom: 1.5rem;
}

label {
  display: block;
  color: #707788;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

input {
  width: 100%;
  padding: 12px;
  background: #191b22;
  border: 1px solid #393f4f;
  border-radius: 6px;
  color: white;
  font-size: 1rem;
}

.login-btn {
  width: 100%;
  padding: 12px;
  background: #2b90d9;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}

.login-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.error-msg { color: #ff5f5f; font-size: 0.85rem; margin-top: 0.5rem; }
</style>