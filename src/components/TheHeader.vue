<script setup lang="ts">
import { LogOut, Save, Trash2, Eye } from 'lucide-vue-next'; // Añadimos Eye
import type {Account} from '../types';

defineProps<{
  account: Account | null;
  instance: string;
}>();

defineEmits(['logout','save','clear','preview']);
</script>

<template>
  <header class="main-header">
    <div class="header-content">
      <div class="logo">
        <span class="logo-icon">F</span>
        <span class="logo-text">FediThread</span>
      </div>

      <div v-if="account" class="user-section">
        <div class="thread-actions">
          <button @click="$emit('preview')" class="action-btn preview-btn" title="Ver vista previa">
            <Eye :size="18" />
          </button>
          <button @click="$emit('save')" class="action-btn" title="Guardar borrador">
            <Save :size="18" />
          </button>
          <button @click="$emit('clear')" class="action-btn delete" title="Limpiar hilo">
            <Trash2 :size="18" />
          </button>
        </div>

        <div class="divider"></div>

        <div class="user-info">
          <img :src="account.avatar" class="avatar" />
          <div class="user-meta">
            <span class="display-name">{{ account.display_name }}</span>
            <span class="instance-tag">@{{ account.username }}</span>
          </div>
        </div>

        <button @click="$emit('logout')" class="logout-btn">
          <LogOut :size="18" />
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.thread-actions {
  display: flex;
  gap: 0.5rem;
  margin-right: 1rem;
}

.action-btn {
  background: #2b303b;
  border: 1px solid #393f4f;
  color: #fff;
  padding: 6px 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.85rem;
}

.action-btn:hover { background: #393f4f; }
.action-btn.delete:hover { color: #ff5f5f; border-color: #ff5f5f; }

.divider {
  width: 1px;
  height: 24px;
  background: #393f4f;
  margin-right: 1rem;
}

.main-header {
  background: #1f232b;
  border-bottom: 1px solid #393f4f;
  padding: 0.75rem 1.5rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo-icon {
  background: #2b90d9;
  color: white;
  font-weight: bold;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.logo-text {
  font-weight: bold;
  font-size: 1.1rem;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  background: #191b22;
}

.user-meta {
  display: flex;
  flex-direction: column;
}

.display-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.instance-tag {
  font-size: 0.75rem;
  color: #707788;
}

.logout-btn {
  background: none;
  border: none;
  color: #707788;
  cursor: pointer;
  padding: 5px;
  transition: color 0.2s;
}

.logout-btn:hover {
  color: #ff5f5f;
}
.preview-btn {
  background: transparent !important;
  border: 1px solid var(--primary-color) !important;
  color: var(--primary-color) !important;
}

.preview-btn:hover {
  background: rgba(43, 144, 217, 0.1) !important;
}
</style>