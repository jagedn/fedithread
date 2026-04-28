<script setup lang="ts">
import {ref, watch, onMounted, computed, nextTick} from 'vue';
import { Paperclip, Trash2, PlusCircle, X } from 'lucide-vue-next';
import { calculateMastodonLength } from '../utils/helpers';
import type {Attachment} from '../types';

interface Props {
  modelValue: string;
  index: number;
  isLast: boolean;
  attachments: Attachment[];
  maxChars: number;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue', 'add', 'remove', 'attach', 'remove-attachment', 'paste-file','paste-long-text']);

const textareaRef = ref<HTMLTextAreaElement | null>(null);
const currentLength = computed(() => calculateMastodonLength(props.modelValue));
const remainingChars = computed(() => props.maxChars - currentLength.value);
const isOverLimit = computed(() => currentLength.value > props.maxChars);

const adjustHeight = () => {
  const el = textareaRef.value;
  if (el) {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }
};

const handlePaste = (event: ClipboardEvent) => {
  const text = event.clipboardData?.getData('text');
  const items = event.clipboardData?.items;
  if ( items ) {
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          event.preventDefault();
          emit('paste-file', file);
          return;
        }
      }
    }
  }
  if (text && calculateMastodonLength(text) > props.maxChars) {
    event.preventDefault();
    // Emitimos un evento especial para que el padre gestione la creación de múltiples toots
    emit('paste-long-text', text);
  }
};


watch(() => props.modelValue, async () => {
  await nextTick();
  adjustHeight();
});

onMounted(adjustHeight);
</script>

<template>
  <div class="toot-box-container">
    <div class="thread-line-container">
      <div class="avatar-placeholder">{{ index + 1 }}</div>
      <div v-if="!isLast" class="line"></div>
    </div>

    <div class="toot-content">
      <textarea
          ref="textareaRef"
          :value="modelValue"
          @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          @paste="handlePaste"
          placeholder="¿Qué está pasando?"
          class="toot-textarea"
          rows="1"
      ></textarea>

      <div class="attachments-preview" v-if="attachments && attachments.length > 0">
        <div v-for="media in attachments" :key="media.id" class="media-container">
          <div class="thumbnail-wrapper">
            <img :src="media.previewUrl" :class="{ 'is-uploading': media.status === 'uploading' }" />

            <div v-if="media.status === 'uploading'" class="upload-overlay">
              <div class="spinner"></div>
            </div>

            <button class="remove-media-btn" @click="$emit('remove-attachment', media.id)">
              <X :size="14" />
            </button>
          </div>
        </div>
      </div>

      <footer class="toot-footer">
        <div class="footer-left">
          <button
              @click="$emit('attach')"
              class="icon-btn"
              :class="{ 'disabled': attachments.length >= 4 }"
              :disabled="attachments.length >= 4"
              title="Adjuntar imagen (Máx. 4)"
          >
            <Paperclip :size="18" />
            <span v-if="attachments.length > 0" class="attachment-count">{{ attachments.length }}</span>
          </button>
          <button v-if="index > 0" @click="$emit('remove')" class="icon-btn delete" title="Eliminar toot">
            <Trash2 :size="18" />
          </button>
        </div>

        <div class="footer-right">
          <span :class="['char-counter', { 'error': isOverLimit }]">{{ remainingChars }}</span>
          <button v-if="isLast" @click="$emit('add')" class="add-btn">
            <PlusCircle :size="18" />
            <span>Añadir otro</span>
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.toot-box-container {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.thread-line-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-placeholder {
  width: 40px;
  height: 40px;
  background: #2b90d9;
  color: white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.line {
  width: 2px;
  background: #393f4f;
  flex-grow: 1;
  margin-top: 4px;
}

.toot-content {
  flex-grow: 1;
  background: #1f232b;
  border: 1px solid #393f4f;
  border-radius: 8px;
  padding: 1rem;
}

.toot-textarea {
  width: 100%;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1.1rem;
  resize: none;
  outline: none;
  font-family: inherit;
}

.toot-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid #393f4f;
}

.icon-btn {
  background: none;
  border: none;
  color: #707788;
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s;
}

.icon-btn:hover { color: #2b90d9; }
.icon-btn.delete:hover { color: #ff5f5f; }

.char-counter {
  font-size: 0.85rem;
  color: #707788;
  margin-right: 1rem;
}

.char-counter.error { color: #ff5f5f; }

.add-btn {
  background: #2b90d9;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-weight: 600;
}

.add-btn:hover { background: #41a1e6; }

.attachments-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
  margin-bottom: 1rem;
  margin-top: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid #393f4f;
}

.media-container {
  position: relative;
  aspect-ratio: 16 / 9;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #393f4f;
}

.remove-media {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0,0,0,0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.icon-btn {
  position: relative;
  display: flex;
  align-items: center;
}

.icon-btn.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.attachment-count {
  font-size: 10px;
  background: #2b90d9;
  color: white;
  border-radius: 10px;
  padding: 1px 5px;
  position: absolute;
  top: -5px;
  right: -5px;
}
.is-uploading {
  filter: blur(2px) grayscale(1);
  opacity: 0.5;
}

.upload-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.attachments-grid {
  display: flex; /* Cambiamos a flex para que se alineen a la izquierda */
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.media-item {
  width: 80px; /* Tamaño fijo de miniatura */
  height: 80px;
  position: relative;
}

.thumbnail-wrapper {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #393f4f;
  background: #191b22;
}

.thumbnail-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* Esto hace que la imagen llene el cuadrado sin deformarse */
  display: block;
}

.remove-media-btn {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff5f5f;
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  z-index: 10;
}

.is-uploading {
  filter: grayscale(1) blur(1px);
  opacity: 0.4;
}
</style>