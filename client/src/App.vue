<template>
  <div :class="[ui.darkMode ? 'dark' : '', 'min-h-screen bg-[var(--c-bg)]']">
    <ToastProvider />
    <router-view v-slot="{ Component, route }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </router-view>
  </div>
</template>

<script setup>
import { useUiStore } from './stores/uiStore'
import ToastProvider from './components/base/ToastProvider.vue'
const ui = useUiStore()
</script>

<style>
.page-enter-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.page-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.page-enter-from { opacity: 0; transform: translateY(8px); }
.page-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
