<script setup lang="ts">
import { X } from 'lucide-vue-next';
import type {Toot, Account} from '../types';

defineProps<{
  thread: Toot[];
  account: Account | null;
  instance: string;
  isOpen: boolean;
}>();

defineEmits(['close']);
</script>

<template>
  <div v-if="isOpen" class="preview-overlay" @click.self="$emit('close')">
    <div class="preview-modal">
      <header class="preview-header">
        <h3>Vista Previa del Hilo</h3>
        <button @click="$emit('close')" class="close-btn"><X :size="20" /></button>
      </header>

      <div class="preview-content">
        <div v-for="(toot, index) in thread" :key="toot.id" class="preview-toot">
          <div class="preview-aside">
            <img :src="account?.avatar" class="preview-avatar" />
            <div v-if="index < thread.length - 1" class="preview-line"></div>
          </div>

          <div class="preview-body">
            <div class="preview-user-info">
              <span class="preview-name">{{ account?.display_name }}</span>
              <span class="preview-handle">@{{ account?.username }}</span>
            </div>

            <p class="preview-text">{{ toot.content }}</p>

            <div v-if="toot.attachments.length > 0" class="preview-media-grid" :class="'count-' + toot.attachments.length">
              <img v-for="media in toot.attachments" :key="media.id" :src="media.previewUrl" class="preview-media-img" />
            </div>

            <div class="preview-footer-icons">
              <span>💬 0</span><span>🔁 0</span><span>⭐ 0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.preview-modal {
  background: #282c37; /* Color oscuro típico de Mastodon */
  width: 100%;
  max-width: 550px;
  max-height: 90vh;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-header {
  padding: 1rem;
  border-bottom: 1px solid #393f4f;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-content {
  overflow-y: auto;
  padding: 1.5rem;
}

.preview-toot {
  display: flex;
  gap: 12px;
}

.preview-aside {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.preview-avatar {
  width: 48px;
  height: 48px;
  border-radius: 4px;
}

.preview-line {
  width: 2px;
  background: #393f4f;
  flex-grow: 1;
  margin: 4px 0;
}

.preview-body {
  flex-grow: 1;
  padding-bottom: 1.5rem;
}

.preview-user-info {
  margin-bottom: 4px;
}

.preview-name { font-weight: bold; margin-right: 5px; }
.preview-handle { color: #707788; font-size: 0.9rem; }

.preview-text {
  white-space: pre-wrap;
  line-height: 1.5;
  margin-bottom: 10px;
}

.preview-media-grid {
  display: grid;
  gap: 4px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 10px;
}

.preview-media-grid.count-1 { grid-template-columns: 1fr; }
.preview-media-grid.count-2 { grid-template-columns: 1fr 1fr; }
.preview-media-grid.count-3, .preview-media-grid.count-4 { grid-template-columns: 1fr 1fr; }

.preview-media-img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  background: #191b22;
}

.preview-footer-icons {
  color: #707788;
  display: flex;
  gap: 20px;
  font-size: 0.8rem;
}

.close-btn { background: none; border: none; color: white; cursor: pointer; }
</style>