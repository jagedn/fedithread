<script setup lang="ts">
import { RouterView } from 'vue-router'
import Toast from 'primevue/toast';
</script>

<template>
  <div class="w-full h-full">
    <Toast position="top-left"/>
    <RouterView />
  </div>
</template>
