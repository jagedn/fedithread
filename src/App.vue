<script setup lang="ts">
import {ref, onMounted, computed} from 'vue';
import Login from './components/Login.vue';
import TheHeader from './components/TheHeader.vue';
import ThreadPreview from './components/ThreadPreview.vue';
import TootBox from './components/TootBox.vue'; // El que hicimos antes
import { getAuth, clearAuth, saveAuth } from './utils/storage';
import type {Account, AuthData, Toot} from './types';
import { watch } from 'vue';
import {calculateMastodonLength} from "./utils/helpers.ts";

const userAuth = ref<AuthData | null>(getAuth());
const accountData = ref<Account | null>(null);
const loadingAccount = ref(false);
const isPreviewOpen = ref(false);
const maxChars = ref(500);

const thread = ref<Toot[]>([
  { id: crypto.randomUUID(), content: '', attachments: [] }
]);

const fetchAccountInfo = async (auth: AuthData) => {
  loadingAccount.value = true;
  try {
    const response = await fetch(`https://${auth.instance}/api/v1/accounts/verify_credentials`, {
      headers: { 'Authorization': `Bearer ${auth.token}` }
    });
    if (response.ok) {
      accountData.value = await response.json();
    } else {
      // Si el token falló (ej: expiró), limpiamos
      handleLogout();
    }
  } catch (e) {
    console.error("Error cargando perfil", e);
  } finally {
    loadingAccount.value = false;
  }
};

const fetchInstanceConfig = async (instance: string) => {
  try {
    const response = await fetch(`https://${instance}/api/v2/instance`);
    const data = await response.json();
    if (data.configuration?.statuses?.max_characters) {
      maxChars.value = data.configuration.statuses.max_characters;
      console.log(`Límite de caracteres detectado: ${maxChars.value}`);
    }
  } catch (e) {
    console.error("No se pudo obtener la config v2, probando v1...");
    try {
      const resV1 = await fetch(`https://${instance}/api/v1/instance`);
      const dataV1 = await resV1.json();
      if (dataV1.max_toot_chars) {
        maxChars.value = dataV1.max_toot_chars;
      }
    } catch (e2) {
      console.error("Error total obteniendo configuración de instancia");
    }
  }
};

const handleLogout = () => {
  clearAuth();
  userAuth.value = null;
  accountData.value = null;
  window.location.href = getRedirectUri();
};

const addToot = () => {
  thread.value.push({
    id: crypto.randomUUID(),
    content: '',
    attachments: []
  });
};

const removeToot = (id: string) => {
  if (thread.value.length > 1) {
    thread.value = thread.value.filter(t => t.id !== id);
  }
};

const processFile = async (tootId: string, file: File) => {
  const toot = thread.value.find(t => t.id === tootId);
  if (!toot || !userAuth.value || toot.attachments.length >= 4) return;

  const tempId = crypto.randomUUID();
  toot.attachments.push({
    id: tempId,
    previewUrl: URL.createObjectURL(file),
    status: 'uploading'
  });

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`https://${userAuth.value.instance}/api/v1/media`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userAuth.value.token}` },
      body: formData
    });
    const data = await res.json();

    const index = toot.attachments.findIndex(a => a.id === tempId);
    if (index !== -1) {
      toot.attachments[index] = {
        id: data.id,
        previewUrl: data.preview_url || data.url,
        status: 'success'
      };
    }
    saveThread();
  } catch (err) {
    const index = toot.attachments.findIndex(a => a.id === tempId);
    if (index !== -1) toot.attachments[index].status = 'error';
  }
};

const handleAttachment = (tootId: string) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e: any) => {
    const file = e.target.files[0];
    if (file) processFile(tootId, file);
  };
  input.click();
};

const removeAttachment = (tootId: string, attachmentId: string) => {
  const toot = thread.value.find(t => t.id === tootId);
  if (toot) {
    // Revocar la URL para liberar memoria
    const index = toot.attachments.findIndex(a => a.id === attachmentId);
    if (index !== -1) {
      URL.revokeObjectURL(toot.attachments[index].previewUrl);
      toot.attachments.splice(index, 1);
    }
  }
};

const saveThread = () => {
  const dataToSave = thread.value.map(toot => ({
    id: toot.id,
    content: toot.content,
    attachments: []
  }));

  localStorage.setItem('draft_thread', JSON.stringify(dataToSave));
  console.log("Borrador de texto guardado localmente");
};

const clearThread = () => {
  if (confirm("¿Borrar todo el borrador?")) {
    thread.value = [{ id: crypto.randomUUID(), content: '', attachments: [] }];
    localStorage.removeItem('draft_thread');
  }
};

const canPublish = computed(() => {
  const allUnderLimit = thread.value.every(toot =>
      calculateMastodonLength(toot.content) <= 500
  );
  const firstNotEmpty = thread.value[0].content.trim().length > 0;
  return allUnderLimit && firstNotEmpty;
});

const loadSavedThread = () => {
  const saved = localStorage.getItem('draft_thread');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        thread.value = parsed;
        console.log("Hilo restaurado:", thread.value.length, "toots");
      }
    } catch (e) {
      console.error("Error al parsear el hilo guardado:", e);
    }
  }
};

watch(thread, () => {
  const data = thread.value.map(t => ({
    id: t.id,
    content: t.content,
    attachments: t.attachments.map(a => ({
      id: a.id,
      previewUrl: a.previewUrl,
      status: a.status
    }))
  }));
  localStorage.setItem('draft_thread', JSON.stringify(data));
}, { deep: true });

const getRedirectUri = () => {
  const path = window.location.pathname.replace(/\/[^\/]*$/, '');
  return `${window.location.origin}${path}/`.replace(/\/+$/, '/');
};

onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const tempAppData = JSON.parse(localStorage.getItem('temp_app_data') || 'null');

  if (code && tempAppData) {
    // Hemos vuelto del OAuth, canjeamos el código por un Token
    try {
      const redirectUri = getRedirectUri();
      const response = await fetch(`https://${tempAppData.instance}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: tempAppData.client_id,
          client_secret: tempAppData.client_secret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          code: code
        })
      });

      const tokenData = await response.json();

      const auth = {
        instance: tempAppData.instance,
        token: tokenData.access_token
      };

      saveAuth(auth);
      userAuth.value = auth;

      // Limpiamos la URL
      window.history.replaceState({}, document.title, "/");
      localStorage.removeItem('temp_app_data');
    } catch (e) {
      console.error("Error al obtener el token", e);
    }
  }
  if (userAuth.value) {
    loadSavedThread();
    await Promise.all([
      fetchAccountInfo(userAuth.value),
      fetchInstanceConfig(userAuth.value.instance)
    ]);
  }
});

const handleLongTextPaste = (startIndex: number, fullText: string) => {
  const limit = maxChars.value - 10;
  let remainingText = fullText;
  let currentIndex = startIndex;

  while (calculateMastodonLength(remainingText) > 0) {
    let splitIndex = remainingText.lastIndexOf(' ', limit);
    if (splitIndex === -1 || splitIndex < limit * 0.8) splitIndex = limit;

    const chunk = remainingText.substring(0, splitIndex).trim();
    remainingText = remainingText.substring(splitIndex).trim();

    if (thread.value[currentIndex]) {
      thread.value[currentIndex].content = chunk;
    } else {
      thread.value.push({
        id: crypto.randomUUID(),
        content: chunk,
        attachments: []
      });
    }
    currentIndex++;
  }
};

const isPublishing = ref(false);
const publishProgress = ref({ current: 0, total: 0 });
const publishError = ref<string | null>(null);

const publishFullThread = async () => {
  if (!userAuth.value || thread.value.length === 0) return;

  isPublishing.value = true;
  publishError.value = null;
  publishProgress.value = { current: 0, total: thread.value.length };

  let lastTootId: string | null = null;

  try {
    const totalToots = thread.value.length;

    for (const [index, toot] of thread.value.entries()) {
      publishProgress.value.current = index + 1;

      const mediaIds = toot.attachments
          .filter(a => a.status === 'success')
          .map(a => a.id);

      const footer = `\n\n${index + 1}/${totalToots}`;
      const finalStatus = toot.content + footer;

      const payload = {
        status: finalStatus,
        media_ids: mediaIds,
        in_reply_to_id: lastTootId,
        visibility: 'public'
      };

      const response = await fetch(`https://${userAuth.value.instance}/api/v1/statuses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userAuth.value.token}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error en el toot ${index + 1}`);
      }

      const result = await response.json();

      // 3. Guardar el ID para el siguiente toot
      lastTootId = result.id;

      // Opcional: Pequeña pausa para no saturar la instancia (rate limiting)
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // Éxito total
    alert("¡Hilo publicado con éxito!");
    clearThread(); // Limpiamos el borrador

  } catch (err: any) {
    publishError.value = err.message || "Error desconocido al publicar";
  } finally {
    isPublishing.value = false;
  }
};

</script>

<template>
  <div class="app-layout">
    <TheHeader
        v-if="userAuth"
        :account="accountData"
        :instance="userAuth.instance"
        @logout="handleLogout"
        @save="saveThread"
        @clear="clearThread"
        @preview="isPreviewOpen = true"
    />

    <ThreadPreview
        :is-open="isPreviewOpen"
        :thread="thread"
        :account="accountData"
        :instance="userAuth?.instance || ''"
        @close="isPreviewOpen = false"
    />

    <main class="main-content">
      <div v-if="!userAuth" class="login-wrapper">
        <Login />
      </div>

      <div v-else class="editor-wrapper">
        <div v-if="loadingAccount" class="loading">Cargando perfil...</div>

        <div v-else>
          <TootBox
              v-for="(toot, index) in thread"
              :key="toot.id"
              v-model="toot.content"
              :index="index"
              :is-last="index === thread.length - 1"
              :attachments="toot.attachments"
              :max-chars="maxChars"
              @add="addToot"
              @remove="removeToot(toot.id)"
              @attach="handleAttachment(toot.id)"
              @paste-file="(file) => processFile(toot.id, file)"
              @remove-attachment="(mediaId) => removeAttachment(toot.id, mediaId)"
              @paste-long-text="(text) => handleLongTextPaste(index, text)"
          />
        </div>

        <div class="publish-area">
          <button
              class="publish-btn"
              :disabled="thread[0].content.length === 0 || !canPublish"
              @click="publishFullThread"
          >
            Publicar Hilo ({{ thread.length }} toots)
          </button>
        </div>

      </div>
    </main>
  </div>
</template>

<style>
/* Estilos globales */
:root {
  --bg-color: #191b22;
  --card-bg: #1f232b;
  --border-color: #393f4f;
  --primary-color: #2b90d9;
}

body {
  margin: 0;
  background-color: var(--bg-color);
  color: white;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.main-content {
  padding: 2rem 1rem;
  display: flex;
  justify-content: center;
}

.login-wrapper {
  margin-top: 10vh;
}

.editor-wrapper {
  width: 100%;
  max-width: 600px;
}

.loading {
  text-align: center;
  color: #707788;
}
</style>